import { prisma } from '../../db/client.js';
import type { InsightCategory, InsightSeverity, InsightStatus } from '@prisma/client';
import { createLogger } from '../../lib/logger.js';
import { computeTechnicalDebt } from './technicalDebt.service.js';
import { computeBusFactor, computeHealthScore } from './health.service.js';
import { buildTeamCollaboration } from './team.service.js';
import { getCicdAnalytics } from './cicd.service.js';
import { getSecurityAnalytics } from './security.service.js';
import { detectStale } from './stale.service.js';
import { detectAnomalies } from './anomaly.service.js';

const logger = createLogger('insights-service');

export interface InsightDraft {
  category: InsightCategory;
  severity: InsightSeverity;
  title: string;
  description?: string;
  evidence?: Record<string, unknown>;
}

interface PersistOptions {
  replaceCategoryForRepo?: InsightCategory[];
}

export async function generateRepositoryInsights(repoId: string, options: PersistOptions = {}): Promise<number> {
  const repo = await prisma.repository.findUnique({ where: { id: repoId }, select: { name: true, fullName: true } });
  if (!repo) return 0;

  const [health, debt, busFactor, stale, anomalies, team, cicd, security] = await Promise.all([
    computeHealthScore(repoId, '30d').catch(() => null),
    computeTechnicalDebt(repoId).catch(() => null),
    computeBusFactor(repoId).catch(() => []),
    detectStale(repoId).catch(() => null),
    detectAnomalies(repoId).catch(() => []),
    buildTeamCollaboration(repoId, '30d').catch(() => null),
    getCicdAnalytics(repoId, '30d').catch(() => null),
    getSecurityAnalytics(repoId).catch(() => null),
  ]);

  const drafts: InsightDraft[] = [];

  if (health) {
    if (health.score < 70) {
      drafts.push({
        category: 'RECOMMENDATION',
        severity: health.score < 50 ? 'CRITICAL' : 'HIGH',
        title: `${repo.name} health needs attention`,
        description: `Health score is ${health.score}/100. ${minComponent(health.breakdown)}`,
        evidence: { score: health.score, breakdown: health.breakdown },
      });
    }
    if (health.breakdown.testCoverage < 70) {
      drafts.push({
        category: 'TECHNICAL_DEBT',
        severity: 'MEDIUM',
        title: `Test coverage is low in ${repo.name}`,
        description: `Estimated coverage ${health.breakdown.testCoverage}%. Recommend adding tests before shipping new features.`,
        evidence: { coverage: health.breakdown.testCoverage },
      });
    }
  }

  if (debt) {
    drafts.push({
      category: 'TECHNICAL_DEBT',
      severity: debt.score > 60 ? 'HIGH' : debt.score > 35 ? 'MEDIUM' : 'LOW',
      title: `Technical debt in ${repo.name}`,
      description: `Debt score ${debt.score}/100 · ${debt.criticalFiles} critical files · ${debt.staleIssues} stale issues · ${debt.outdatedDependencies} outdated dependencies`,
      evidence: { score: debt.score, criticalFiles: debt.criticalFiles, staleIssues: debt.staleIssues, outdatedDependencies: debt.outdatedDependencies },
    });
    if (debt.highRiskFiles.length > 0) {
      drafts.push({
        category: 'TECHNICAL_DEBT',
        severity: 'MEDIUM',
        title: `High-risk files detected in ${repo.name}`,
        description: debt.highRiskFiles.slice(0, 5).join(', '),
        evidence: { files: debt.highRiskFiles.slice(0, 20) },
      });
    }
  }

  if (busFactor.length > 0) {
    for (const bf of busFactor.slice(0, 3)) {
      if (bf.risk === 'HIGH') {
        drafts.push({
          category: 'BUS_FACTOR',
          severity: 'HIGH',
          title: `Bus factor risk: ${bf.module}`,
          description: `${bf.owner} owns ${bf.concentration}% of changes in ${bf.module}. Consider adding a second maintainer.`,
          evidence: { module: bf.module, owner: bf.owner, concentration: bf.concentration, risk: bf.risk },
        });
      }
    }
  }

  if (stale && (stale.criticalPrs.length > 0 || stale.staleIssues.length > 0)) {
    drafts.push({
      category: 'STALE',
      severity: stale.criticalPrs.length > 0 ? 'HIGH' : 'MEDIUM',
      title: `Stale work in ${repo.name}`,
      description: `${stale.criticalPrs.length} PRs older than 14 days, ${stale.staleIssues.length} issues inactive for 30+ days`,
      evidence: { criticalPrs: stale.criticalPrs.length, staleIssues: stale.staleIssues.length, staleBranches: stale.staleBranches },
    });
  }

  if (cicd && cicd.failureRate !== null && cicd.failureRate > 10) {
    drafts.push({
      category: 'CI',
      severity: cicd.failureRate > 25 ? 'HIGH' : 'MEDIUM',
      title: `CI failure rate increased in ${repo.name}`,
      description: `Failure rate is ${cicd.failureRate}% across ${cicd.totalRuns} runs.`,
      evidence: { failureRate: cicd.failureRate, totalRuns: cicd.totalRuns, averageBuildTimeSeconds: cicd.averageBuildTimeSeconds },
    });
  }

  if (cicd && cicd.deployments === 0 && cicd.totalRuns > 0) {
    drafts.push({
      category: 'CI',
      severity: 'LOW',
      title: `No deployments recorded for ${repo.name}`,
      description: 'Deployment events are missing or GitHub permissions do not expose them.',
      evidence: { runCount: cicd.totalRuns },
    });
  }

  if (security && security.openAlerts > 0) {
    drafts.push({
      category: 'SECURITY',
      severity: security.criticalAlerts > 0 ? 'CRITICAL' : security.highAlerts > 0 ? 'HIGH' : 'MEDIUM',
      title: `Security alerts in ${repo.name}`,
      description: `${security.openAlerts} open alerts (${security.criticalAlerts} critical, ${security.highAlerts} high). ${security.vulnerableDependencies} vulnerable dependencies.`,
      evidence: {
        openAlerts: security.openAlerts,
        criticalAlerts: security.criticalAlerts,
        highAlerts: security.highAlerts,
        vulnerableDependencies: security.vulnerableDependencies,
      },
    });
  }

  for (const anomaly of anomalies) {
    drafts.push({
      category: 'ANOMALY',
      severity: mapAnomalySeverity(anomaly.severity),
      title: anomalyTitle(anomaly.type, repo.name),
      description: `${anomaly.metric} deviated ${anomaly.deviationPercent}% (current ${anomaly.currentValue} vs baseline ${anomaly.baselineValue}).`,
      evidence: {
        type: anomaly.type,
        currentValue: anomaly.currentValue,
        baselineValue: anomaly.baselineValue,
        deviationPercent: anomaly.deviationPercent,
        detail: anomaly.detail,
      },
    });
  }

  if (team && team.bottlenecks.length > 0) {
    const bottleneck = team.bottlenecks[0];
    drafts.push({
      category: 'COLLABORATION',
      severity: bottleneck.concentration >= 50 ? 'MEDIUM' : 'LOW',
      title: `Review bottleneck in ${repo.name}`,
      description: bottleneck.detail,
      evidence: { reviewer: bottleneck.reviewer, concentration: bottleneck.concentration },
    });
  }

  if (drafts.length === 0) {
    drafts.push({
      category: 'GENERAL',
      severity: 'INFO',
      title: `${repo.name} looks healthy`,
      description: 'No concerning signals detected during the last analysis.',
      evidence: {},
    });
  }

  // Persist: dismiss previous OPEN insights in the same categories, then insert new ones.
  const replace = options.replaceCategoryForRepo ?? ['RECOMMENDATION', 'TECHNICAL_DEBT', 'BUS_FACTOR', 'STALE', 'CI', 'SECURITY', 'COLLABORATION', 'GENERAL', 'ANOMALY'];
  await prisma.aiInsight.updateMany({
    where: { repositoryId: repoId, category: { in: replace }, status: { in: ['OPEN', 'ACKED'] } },
    data: { status: 'RESOLVED' as InsightStatus, updatedAt: new Date() },
  });

  let created = 0;
  for (const draft of drafts) {
    const existing = await prisma.aiInsight.findFirst({
      where: { repositoryId: repoId, title: draft.title, status: 'OPEN' },
    });
    if (existing) continue;
    const shouldDedupe = await prisma.aiInsight.findFirst({
      where: { repositoryId: repoId, title: draft.title, status: { in: ['OPEN', 'ACKED'] } },
    });
    if (shouldDedupe) continue;
    await prisma.aiInsight.create({
      data: {
        repositoryId: repoId,
        category: draft.category,
        severity: draft.severity,
        status: 'OPEN',
        title: draft.title,
        description: draft.description,
        evidence: draft.evidence ?? undefined,
      },
    });
    created++;
  }

  logger.info(`generated ${created} insights for ${repo.fullName}`);
  return created;
}

function minComponent(b: Record<string, number>): string {
  const entries = Object.entries(b);
  entries.sort((x, y) => x[1] - y[1]);
  return `Weakest area: ${entries[0][0]} at ${entries[0][1]}/100.`;
}

function anomalyTitle(type: AnomalyType, repoName: string): string {
  switch (type) {
    case 'ACTIVITY_DROP': return `Activity dropped in ${repoName}`;
    case 'COMMIT_SPIKE': return `Commit spike detected in ${repoName}`;
    case 'PR_BACKLOG': return `PR backlog growing in ${repoName}`;
    case 'CI_FAILURE_SPIKE': return `CI failure spike in ${repoName}`;
    case 'REVIEW_DELAY': return `Review delays increasing in ${repoName}`;
    case 'SECURITY_INCREASE': return `Security alerts increased in ${repoName}`;
    default: return `Anomaly detected in ${repoName}`;
  }
}

function mapAnomalySeverity(severity: string): InsightSeverity {
  switch (severity) {
    case 'CRITICAL': return 'CRITICAL';
    case 'HIGH': return 'HIGH';
    case 'MEDIUM': return 'MEDIUM';
    default: return 'LOW';
  }
}

export async function listInsights(repoId?: string, limit = 60) {
  return prisma.aiInsight.findMany({
    where: repoId ? { repositoryId: repoId } : {},
    include: { repository: { select: { name: true, fullName: true } } },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export async function acknowledgeInsight(id: string) {
  return prisma.aiInsight.update({ where: { id }, data: { status: 'ACKED' } });
}

export async function resolveInsight(id: string) {
  return prisma.aiInsight.update({ where: { id }, data: { status: 'RESOLVED' } });
}