import { prisma } from '../../db/client.js';
import { clamp, round, type RangeKey, rangeStartDate } from './utils.js';
import { computeRepositoryAnalytics } from './repositoryMetrics.service.js';

export interface HealthBreakdown {
  codeQuality: number;
  testCoverage: number;
  security: number;
  ciCd: number;
  prPerformance: number;
  documentation: number;
  maintenance: number;
}

export interface HealthResult {
  score: number;
  breakdown: HealthBreakdown;
  technicalDebt: number;
  criticalFiles: number;
  staleIssues: number;
  outdatedDependencies: number;
  busFactor: { module: string; owner: string; concentration: number; risk: 'HIGH' | 'MEDIUM' | 'LOW' }[];
}

export async function computeHealthScore(repoId: string, range: RangeKey): Promise<HealthResult> {
  const since = rangeStartDate(range);
  const [repo, analytics, alerts, runs, branches, issues, prs, commitFiles, firstCommit] = await Promise.all([
    prisma.repository.findUnique({ where: { id: repoId } }),
    computeRepositoryAnalytics(repoId, range),
    prisma.securityAlert.count({
      where: { repositoryId: repoId, state: 'OPEN' },
    }),
    prisma.workflowRun.findMany({
      where: { repositoryId: repoId, createdAt: { gte: since }, conclusion: { in: ['SUCCESS', 'FAILURE'] } },
      select: { conclusion: true, startedAt: true, completedAt: true, failedJobs: true, totalJobs: true },
    }),
    prisma.branch.findMany({ where: { repositoryId: repoId }, select: { name: true, isDefault: true } }),
    prisma.issue.findMany({
      where: { repositoryId: repoId, state: 'OPEN' },
      select: { updatedAt: true, createdAt: true },
    }),
    prisma.pullRequest.findMany({
      where: { repositoryId: repoId, state: 'OPEN' },
      select: { updatedAt: true, createdAt: true },
    }),
    prisma.commitFile.findMany({
      where: { repositoryId: repoId, additions: { gt: 0 } },
      select: { path: true, additions: true, deletions: true },
      take: 2000,
    }),
    prisma.commit.findFirst({
      where: { repositoryId: repoId },
      orderBy: { authoredAt: 'asc' },
      select: { authoredAt: true },
    }),
  ]);

  const score = healthScoreFromSignals({
    repoId,
    repo,
    analytics,
    openAlerts: alerts,
    ciRuns: runs.map((r) => ({
      success: r.conclusion === 'SUCCESS',
      durationMs: r.startedAt && r.completedAt ? r.completedAt.getTime() - r.startedAt.getTime() : null,
      failedJobs: r.failedJobs,
      totalJobs: r.totalJobs,
    })),
    staleIssues: issues.filter((i) => Date.now() - i.updatedAt.getTime() > 30 * 86_400_000).length,
    stalePrs: prs.filter((p) => Date.now() - p.createdAt.getTime() > 14 * 86_400_000).length,
    commitFilePaths: commitFiles.map((c) => c.path),
    hasLongHistory: !firstCommit || Date.now() - firstCommit.authoredAt.getTime() > 180 * 86_400_000,
    branchCount: branches.length,
  });

  const criticalFiles = computeCriticalFiles(commitFiles.map((c) => ({ path: c.path, churn: c.additions + c.deletions })));
  const outdatedDependencies = await prisma.securityAlert.count({
    where: { repositoryId: repoId, type: 'DEPENDABOT', state: 'OPEN' },
  });

  const busFactor = await computeBusFactor(repoId);

  return {
    ...score,
    technicalDebt: round(100 - score.breakdown.maintenance * 0),
    criticalFiles,
    staleIssues: score.staleIssues,
    outdatedDependencies,
    busFactor,
  };
}

interface HealthSignals {
  repoId: string;
  repo: { description: string | null; primaryLanguage: string | null; topics: string[]; pushedAt: Date | null; openIssuesCount: number } | null;
  analytics: ReturnType<typeof computeRepositoryAnalytics> extends Promise<infer T> ? T : never;
  openAlerts: number;
  ciRuns: { success: boolean; durationMs: number | null; failedJobs: number; totalJobs: number }[];
  staleIssues: number;
  stalePrs: number;
  commitFilePaths: string[];
  hasLongHistory: boolean;
  branchCount: number;
}

function healthScoreFromSignals(s: HealthSignals): {
  score: number;
  breakdown: HealthBreakdown;
  staleIssues: number;
} {
  const pr = s.analytics.pullRequests;
  const issues = s.analytics.issues;
  const issueResolutionRate = issues.closed + issues.open > 0 ? issues.closed / (issues.closed + issues.open) : 0;
  const issueBacklogPenalty = clamp((issues.open - issues.closed) * 1.5, 0, 25);

  // --- Code Quality (merge rate, clean PRs, sustained review) ---
  const mergeRate = pr.mergeRate ?? 50;
  const codeQuality = clamp(Math.round(mergeRate * 0.6 + (pr.averageSize !== null && pr.averageSize < 400 ? (400 - pr.averageSize) / 4 : 50) * 0.4), 0, 100);

  // --- Test Coverage (proxy: ratio of test/spec files among sampled changes) ---
  const testFiles = s.commitFilePaths.filter((p) => /(test|spec|__tests__|\.test\.|\.spec\.)/i.test(p)).length;
  const coverageRatio = s.commitFilePaths.length > 0 ? testFiles / s.commitFilePaths.length : 0;
  const testCoverage = clamp(Math.round(40 + coverageRatio * 120), 20, 98);

  // --- Security (100 - penalty per open alert) ---
  const security = clamp(100 - s.openAlerts * 12, 0, 100);

  // --- CI/CD (success rate + build time) ---
  let ciCd = 60;
  if (s.ciRuns.length > 0) {
    const successRate = s.ciRuns.filter((r) => r.success).length / s.ciRuns.length;
    const durations = s.ciRuns.map((r) => r.durationMs).filter((d): d is number => d !== null);
    const avgMin = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length / 60_000 : 0;
    const timeScore = avgMin <= 10 ? 100 : avgMin <= 25 ? 80 : avgMin <= 45 ? 60 : 30;
    ciCd = Math.round(successRate * 100 * 0.7 + timeScore * 0.3);
  }

  // --- PR Performance ---
  const cycleGood = pr.cycleTimeHours === null ? 60 : clamp(100 - pr.cycleTimeHours * 2, 10, 100);
  const prPerformance = Math.round(pr.mergeRate ? clamp(mergeRate, 0, 100) * 0.5 : 60 * 0.5 + cycleGood * 0.5);

  // --- Documentation ---
  let documentation = 30;
  if (s.repo?.description) documentation += 25;
  if (s.repo && s.repo.topics.length > 0) documentation += 15;
  documentation += clamp(s.hasLongHistory ? 20 : 5, 0, 20);
  documentation += clamp(20 - s.staleIssues * 2, 0, 20);
  documentation = clamp(documentation, 15, 98);

  // --- Maintenance (activity recency, resolved issues, stale PRs) ---
  let maintenance = 50;
  if (s.repo?.pushedAt) {
    const daysSincePush = (Date.now() - s.repo.pushedAt.getTime()) / 86_400_000;
    maintenance += clamp(40 - daysSincePush * 2, 0, 40);
  }
  maintenance += clamp(issueResolutionRate * 30, 0, 30);
  maintenance -= issueBacklogPenalty;
  maintenance -= clamp(s.stalePrs * 4, 0, 30);
  maintenance = clamp(maintenance, 5, 98);

  const breakdown: HealthBreakdown = {
    codeQuality,
    testCoverage,
    security,
    ciCd,
    prPerformance,
    documentation,
    maintenance,
  };

  const score = clamp(Math.round(
    breakdown.codeQuality * 0.2 +
    breakdown.testCoverage * 0.2 +
    breakdown.security * 0.2 +
    breakdown.ciCd * 0.15 +
    breakdown.prPerformance * 0.1 +
    breakdown.documentation * 0.05 +
    breakdown.maintenance * 0.1,
  ), 0, 100);

  return { score, breakdown, staleIssues: s.staleIssues };
}

function computeCriticalFiles(
  files: { path: string; churn: number }[],
): number {
  const byPath = new Map<string, number>();
  for (const f of files) byPath.set(f.path, (byPath.get(f.path) ?? 0) + f.churn);
  let count = 0;
  for (const churn of byPath.values()) {
    if (churn > 1500) count++;
  }
  return count;
}

// ---------------------------------------------------------------------------
// Bus factor
// ---------------------------------------------------------------------------

export async function computeBusFactor(
  repoId: string,
): Promise<{ module: string; owner: string; concentration: number; risk: 'HIGH' | 'MEDIUM' | 'LOW' }[]> {
  const days90 = new Date(Date.now() - 90 * 86_400_000);
  const commits = await prisma.commit.findMany({
    where: { repositoryId: repoId, authoredAt: { gte: days90 }, authorId: { not: null } },
    select: { authorId: true, additions: true, files: { select: { path: true, additions: true } } },
    take: 2000,
  });

  const byAuthor = new Map<string, number>();
  const byModule = new Map<string, Map<string, number>>();

  for (const c of commits) {
    const author = c.authorId!;
    const module = moduleOf(c.files?.[0]?.path ?? 'code');
    byAuthor.set(author, (byAuthor.get(author) ?? 0) + 1);
    const perModule = byModule.get(module) ?? new Map<string, number>();
    perModule.set(author, (perModule.get(author) ?? 0) + 1);
    byModule.set(module, perModule);
  }

  if (commits.length === 0) return [];

  const total = [...byAuthor.values()].reduce((a, b) => a + b, 0);
  const topAuthor = [...byAuthor.entries()].sort((a, b) => b[1] - a[1])[0];

  const result: { module: string; owner: string; concentration: number; risk: 'HIGH' | 'MEDIUM' | 'LOW' }[] = [];
  if (topAuthor) {
    const concentration = Math.round((topAuthor[1] / total) * 100);
    const dev = topAuthor[0] ? await prisma.developer.findUnique({ where: { id: topAuthor[0] } }).catch(() => null) : null;
    result.push({
      module: 'Repository',
      owner: dev?.login ?? 'Unknown',
      concentration,
      risk: concentration > 60 ? 'HIGH' : concentration > 40 ? 'MEDIUM' : 'LOW',
    });
  }

  for (const [module, authors] of byModule) {
    if (module === 'Repository') continue;
    const modTotal = [...authors.values()].reduce((a, b) => a + b, 0);
    const [ownerId, count] = [...authors.entries()].sort((a, b) => b[1] - a[1])[0];
    const concentration = Math.round((count / modTotal) * 100);
    const dev = await prisma.developer.findUnique({ where: { id: ownerId } }).catch(() => null);
    result.push({
      module,
      owner: dev?.login ?? 'Unknown',
      concentration,
      risk: concentration > 60 ? 'HIGH' : concentration > 40 ? 'MEDIUM' : 'LOW',
    });
  }

  return result.sort((a, b) => b.concentration - a.concentration).slice(0, 8);
}

function moduleOf(path: string): string {
  if (!path) return 'code';
  const parts = path.split('/');
  if (parts.length <= 1) return 'root';
  if (parts[0] === 'src') return parts.length >= 3 ? parts[1] : 'src';
  if (/test|spec|__tests__/i.test(path)) return 'tests';
  return parts[0];
}