import { prisma } from '../../db/client.js';
import type { AnomalyType, AnomalySeverity, AnomalyStatus } from '@prisma/client';
import { round, rangeStartDate, type RangeKey } from './utils.js';

export interface DetectedAnomaly {
  type: AnomalyType;
  severity: AnomalySeverity;
  metric: string;
  currentValue: number;
  baselineValue: number;
  deviationPercent: number;
  detail?: Record<string, unknown>;
}

const THRESHOLDS: Record<AnomalyType, number> = {
  ACTIVITY_DROP: -50, // current < -50% of baseline
  COMMIT_SPIKE: 150, // current > +150% of baseline
  PR_BACKLOG: 40,
  CI_FAILURE_SPIKE: 25, // percentage points above baseline
  REVIEW_DELAY: 80,
  SECURITY_INCREASE: 30,
};

export function severityFor(deviation: number, type: AnomalyType): AnomalySeverity {
  const magnitude = Math.abs(deviation);
  if (magnitude > 100 && type !== 'ACTIVITY_DROP') return 'HIGH';
  if (type === 'ACTIVITY_DROP' && deviation <= -70) return 'HIGH';
  if (magnitude >= 55) return 'MEDIUM';
  return 'LOW';
}

/**
 * Statistical anomaly detection: compare a recent window against a baseline
 * window of historical averages. No ML required.
 */
export async function detectAnomalies(repoId: string): Promise<DetectedAnomaly[]> {
  const now = new Date();
  const currentStart = new Date(now.getTime() - 7 * 86_400_000);
  const baselineStart = new Date(now.getTime() - 37 * 86_400_000); // baseline = previous 30 days

  const [currentCommits, baselineCommits, currentRuns, baselineRuns, openPrs, openIssues, securityHistory] = await Promise.all([
    commitsPerDay(repoId, currentStart, now),
    commitsPerDay(repoId, baselineStart, currentStart),
    ciFailureRate(repoId, currentStart, now),
    ciFailureRate(repoId, baselineStart, currentStart),
    prisma.pullRequest.count({ where: { repositoryId: repoId, state: 'OPEN' } }),
    prisma.pullRequest.count({ where: { repositoryId: repoId, state: 'OPEN', createdAt: { lt: currentStart } } }),
    prisma.securityAlert.findMany({
      where: { repositoryId: repoId },
      select: { createdAt: true, type: true, state: true },
    }),
  ]);

  const anomalies: DetectedAnomaly[] = [];

  // 1. Activity drop / commit spike
  if (baselineCommits.average > 0) {
    const deviation = ((currentCommits.value - baselineCommits.average) / baselineCommits.average) * 100;
    const activityDrop = currentCommits.value < baselineCommits.average && deviation <= THRESHOLDS.ACTIVITY_DROP;
    const spike = currentCommits.value > baselineCommits.average && deviation >= THRESHOLDS.COMMIT_SPIKE;
    if (activityDrop) {
      anomalies.push({
        type: 'ACTIVITY_DROP',
        severity: severityFor(deviation, 'ACTIVITY_DROP'),
        metric: 'commits_per_day',
        currentValue: round(currentCommits.value),
        baselineValue: round(baselineCommits.average),
        deviationPercent: round(deviation),
        detail: { commitsLast7d: currentCommits.value * 7, baselinePerDay: baselineCommits.average },
      });
    } else if (spike) {
      anomalies.push({
        type: 'COMMIT_SPIKE',
        severity: severityFor(deviation, 'COMMIT_SPIKE'),
        metric: 'commits_per_day',
        currentValue: round(currentCommits.value),
        baselineValue: round(baselineCommits.average),
        deviationPercent: round(deviation),
      });
    }
  }

  // 2. PR backlog spike
  if (openIssues > 0 && openPrs > openIssues) {
    const backlogIncrease = ((openPrs - openIssues) / openIssues) * 100;
    if (backlogIncrease >= THRESHOLDS.PR_BACKLOG) {
      anomalies.push({
        type: 'PR_BACKLOG',
        severity: severityFor(backlogIncrease, 'PR_BACKLOG'),
        metric: 'open_pull_requests',
        currentValue: openPrs,
        baselineValue: openIssues,
        deviationPercent: round(backlogIncrease),
      });
    }
  }

  // 3. CI failure spike
  if (baselineRuns.total >= 3 && currentRuns.total >= 2) {
    const delta = currentRuns.failureRate - baselineRuns.failureRate;
    if (delta >= THRESHOLDS.CI_FAILURE_SPIKE) {
      anomalies.push({
        type: 'CI_FAILURE_SPIKE',
        severity: severityFor(delta * 4, 'CI_FAILURE_SPIKE'),
        metric: 'ci_failure_rate',
        currentValue: round(currentRuns.failureRate),
        baselineValue: round(baselineRuns.failureRate),
        deviationPercent: round(delta),
        detail: { currentRunsTotal: currentRuns.total, baselineRunsTotal: baselineRuns.total },
      });
    }
  }

  // 4. Security alert increase
  const recentSecurity = securityHistory.filter((a) => a.createdAt.getTime() >= currentStart.getTime()).length;
  const olderSecurity = securityHistory.filter((a) => a.createdAt.getTime() < currentStart.getTime()).length;
  if (recentSecurity > olderSecurity && recentSecurity >= 5) {
    const deviation = ((recentSecurity - olderSecurity) / Math.max(1, olderSecurity)) * 100;
    anomalies.push({
      type: 'SECURITY_INCREASE',
      severity: severityFor(deviation, 'SECURITY_INCREASE'),
      metric: 'security_alerts',
      currentValue: recentSecurity,
      baselineValue: Math.max(olderSecurity, 1),
      deviationPercent: round(deviation),
    });
  }

  // Persist detected anomalies (dedupe — replace OPEN anomalies of same type/repo).
  for (const anomaly of anomalies) {
    await prisma.$transaction([
      prisma.anomaly.updateMany({
        where: { repositoryId: repoId, type: anomaly.type, status: { in: ['OPEN', 'ACKED'] } },
        data: { status: 'RESOLVED' as AnomalyStatus, updatedAt: new Date() },
      }),
      prisma.anomaly.create({
        data: {
          repositoryId: repoId,
          type: anomaly.type,
          severity: anomaly.severity,
          status: 'OPEN',
          metric: anomaly.metric,
          currentValue: anomaly.currentValue,
          baselineValue: anomaly.baselineValue,
          deviationPercent: anomaly.deviationPercent,
          detail: anomaly.detail ?? undefined,
          detectedAt: now,
        },
      }),
    ]);
  }

  return anomalies;
}

async function commitsPerDay(repoId: string, from: Date, to: Date): Promise<{ value: number; average: number }> {
  const days = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / 86_400_000));
  const count = await prisma.commit.count({
    where: { repositoryId: repoId, authoredAt: { gte: from, lte: to } },
  });
  return { value: Math.round(count / days), average: Math.round(count / days) };
}

async function ciFailureRate(repoId: string, from: Date, to: Date): Promise<{ failureRate: number; total: number }> {
  const runs = await prisma.workflowRun.findMany({
    where: {
      repositoryId: repoId,
      createdAt: { gte: from, lte: to },
      conclusion: { in: ['SUCCESS', 'FAILURE', 'STARTUP_FAILURE'] },
    },
    select: { conclusion: true },
  });
  if (runs.length === 0) return { failureRate: 0, total: 0 };
  const failed = runs.filter((r) => r.conclusion === 'FAILURE' || r.conclusion === 'STARTUP_FAILURE').length;
  return { failureRate: (failed / runs.length) * 100, total: runs.length };
}

export async function getRecentAnomalies(repoId?: string, limit = 50) {
  return prisma.anomaly.findMany({
    where: repoId ? { repositoryId: repoId } : {},
    orderBy: { detectedAt: 'desc' },
    take: limit,
    include: { repository: { select: { name: true, fullName: true } } },
  });
}