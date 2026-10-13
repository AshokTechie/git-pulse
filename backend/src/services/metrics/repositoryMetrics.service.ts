import { prisma } from '../../db/client.js';
import { round, daysBetween, type RangeKey, toPrRange, rangeStartDate, formatNumber } from './utils.js';

export interface PullRequestMetrics {
  opened: number;
  merged: number;
  closed: number;
  open: number;
  mergeRate: number | null;
  averageMergeTimeHours: number | null;
  reviewTimeHours: number | null;
  cycleTimeHours: number | null;
  averageSize: number | null;
}

export interface IssueMetrics {
  opened: number;
  closed: number;
  open: number;
  averageResolutionHours: number | null;
}

export interface RepositoryAnalyticsResult {
  commits: number;
  contributors: number;
  pullRequests: PullRequestMetrics;
  issues: IssueMetrics;
  commitFrequencyPerDay: number;
  stars: number;
  forks: number;
  watchers: number;
}

export async function getPullRequestMetrics(repoId: string, range: RangeKey): Promise<PullRequestMetrics> {
  const since = rangeStartDate(range);
  const [all, merged, closed] = await Promise.all([
    prisma.pullRequest.findMany({
      where: { repositoryId: repoId, createdAt: { gte: since } },
      select: { state: true, createdAt: true, mergedAt: true, closedAt: true },
    }),
    prisma.pullRequest.findMany({
      where: { repositoryId: repoId, mergedAt: { gte: since } },
      select: { createdAt: true, mergedAt: true },
    }),
    prisma.pullRequest.findMany({
      where: { repositoryId: repoId, closedAt: { gte: since }, mergedAt: null },
      select: { createdAt: true, closedAt: true },
    }),
  ]);

  const opened = all.length;
  const mergedCount = merged.length;
  const closedCount = closed.length;
  const open = all.filter((p) => p.state === 'OPEN').length;

  const mergeRate = opened > 0 ? round((mergedCount / opened) * 100) : null;
  const avgMergeTime = merged.length > 0
    ? round(merged.reduce((acc, p) => acc + (p.mergedAt!.getTime() - p.createdAt.getTime()) / 3_600_000, 0) / merged.length)
    : null;
  const avgClosedTime = closed.length > 0
    ? round(closed.reduce((acc, p) => acc + (p.closedAt!.getTime() - p.createdAt.getTime()) / 3_600_000, 0) / closed.length)
    : null;
  const cycleTimeHours = avgMergeTime !== null ? avgMergeTime : avgClosedTime;

  return {
    opened,
    merged: mergedCount,
    closed: closedCount,
    open,
    mergeRate,
    averageMergeTimeHours: avgMergeTime,
    reviewTimeHours: null,
    cycleTimeHours,
    averageSize: null,
  };
}

export async function getIssueMetrics(repoId: string, range: RangeKey): Promise<IssueMetrics> {
  const since = rangeStartDate(range);
  const issues = await prisma.issue.findMany({
    where: { repositoryId: repoId, createdAt: { gte: since } },
    select: { state: true, createdAt: true, closedAt: true },
  });
  const resolved = await prisma.issue.findMany({
    where: { repositoryId: repoId, closedAt: { gte: since } },
    select: { createdAt: true, closedAt: true },
  });

  const opened = issues.length;
  const closed = resolved.length;
  const open = issues.filter((i) => i.state === 'OPEN').length;
  const averageResolutionHours = resolved.length > 0
    ? round(resolved.reduce((acc, i) => acc + (i.closedAt!.getTime() - i.createdAt.getTime()) / 3_600_000, 0) / resolved.length)
    : null;

  return { opened, closed, open, averageResolutionHours };
}

export async function getContributorCount(repoId: string, range: RangeKey): Promise<number> {
  const since = rangeStartDate(range);
  const authors = await prisma.commit.findMany({
    where: { repositoryId: repoId, authoredAt: { gte: since }, authorId: { not: null } },
    select: { authorId: true },
    distinct: ['authorId'],
  });
  return authors.length;
}

/**
 * Compute repository analytics over the requested time range directly from
 * stored data, and persist a RepositoryMetric snapshot for caching/anomaly baselines.
 */
export async function computeRepositoryAnalytics(repoId: string, range: RangeKey): Promise<RepositoryAnalyticsResult> {
  const [pr, issues, authorCount, repo] = await Promise.all([
    getPullRequestMetrics(repoId, range),
    getIssueMetrics(repoId, range),
    getContributorCount(repoId, range),
    prisma.repository.findUnique({ where: { id: repoId } }),
  ]);

  let commitsCount = 0;
  try {
    commitsCount = await prisma.commit.count({
      where: { repositoryId: repoId, authoredAt: { gte: rangeStartDate(range) } },
    });
  } catch {
    commitsCount = 0;
  }

  // Average PR size from merged PRs in range.
  const sized = await prisma.pullRequest.findMany({
    where: { repositoryId: repoId, mergedAt: { gte: rangeStartDate(range) } },
    select: { additions: true, deletions: true },
  });
  pr.averageSize = sized.length > 0 ? round(sized.reduce((acc, p) => acc + p.additions + p.deletions, 0) / sized.length) : null;

  // Average review time (time from PR creation to first review) & average PR age.
  const reviewStats = await getReviewTimeStats(repoId, range);
  pr.reviewTimeHours = reviewStats.averageReviewTimeHours;
  pr.averageMergeTimeHours = reviewStats.averagePrAgeHours ?? pr.averageMergeTimeHours;

  const daysInRange = daysBetween(rangeStartDate(range), new Date());
  const commitFrequencyPerDay = round(commitsCount / Math.max(1, Math.min(daysInRange, 92)));

  await persistRepositoryMetric(repoId, range, {
    commits: commitsCount,
    contributors: authorCount,
    pr,
    issues,
    stars: repo?.stargazersCount ?? 0,
    forks: repo?.forksCount ?? 0,
    watchers: repo?.watchersCount ?? 0,
    commitFrequencyPerDay: commitFrequencyPerDay ?? 0,
  });

  return {
    commits: commitsCount,
    contributors: authorCount,
    pullRequests: pr,
    issues,
    commitFrequencyPerDay: commitFrequencyPerDay ?? 0,
    stars: repo?.stargazersCount ?? 0,
    forks: repo?.forksCount ?? 0,
    watchers: repo?.watchersCount ?? 0,
  };
}

interface ReviewTimeStats {
  averageReviewTimeHours: number | null;
  averagePrAgeHours: number | null;
}

async function getReviewTimeStats(repoId: string, range: RangeKey): Promise<ReviewTimeStats> {
  const since = rangeStartDate(range);
  const prRecords = await prisma.pullRequest.findMany({
    where: { repositoryId: repoId, createdAt: { gte: since } },
    select: { id: true, createdAt: true, closedAt: true, mergedAt: true, state: true },
    take: 500,
  });
  if (prRecords.length === 0) return { averageReviewTimeHours: null, averagePrAgeHours: null };

  const reviews = await prisma.pullRequestReview.findMany({
    where: { pullRequestId: { in: prRecords.map((p) => p.id) }, submittedAt: { not: null } },
    select: { pullRequestId: true, submittedAt: true },
    orderBy: { submittedAt: 'asc' },
  });

  const firstReviewByPr = new Map<string, Date>();
  for (const r of reviews) {
    if (!firstReviewByPr.has(r.pullRequestId) && r.submittedAt) firstReviewByPr.set(r.pullRequestId, r.submittedAt);
  }

  const reviewTimes: number[] = [];
  const prAges: number[] = [];
  for (const p of prRecords) {
    const firstReview = firstReviewByPr.get(p.id);
    if (firstReview) reviewTimes.push((firstReview.getTime() - p.createdAt.getTime()) / 3_600_000);
    if (p.state !== 'OPEN' && p.closedAt) prAges.push((p.closedAt.getTime() - p.createdAt.getTime()) / 3_600_000);
  }

  return {
    averageReviewTimeHours: reviewTimes.length > 0 ? round(reviewTimes.reduce((a, b) => a + b, 0) / reviewTimes.length) : null,
    averagePrAgeHours: prAges.length > 0 ? round(prAges.reduce((a, b) => a + b, 0) / prAges.length) : null,
  };
}

async function persistRepositoryMetric(
  repoId: string,
  range: RangeKey,
  input: {
    commits: number;
    contributors: number;
    pr: PullRequestMetrics;
    issues: IssueMetrics;
    stars: number;
    forks: number;
    watchers: number;
    commitFrequencyPerDay: number;
  },
): Promise<void> {
  await prisma.$transaction([
    prisma.repositoryMetric.upsert({
      where: { repositoryId_range: { repositoryId: repoId, range: toPrRange(range) } },
      update: {
        commits: input.commits,
        contributors: input.contributors,
        openedPullRequests: input.pr.opened,
        mergedPullRequests: input.pr.merged,
        closedPullRequests: input.pr.closed,
        openPullRequests: input.pr.open,
        openedIssues: input.issues.opened,
        closedIssues: input.issues.closed,
        openIssues: input.issues.open,
        stars: input.stars,
        forks: input.forks,
        watchers: input.watchers,
        commitFrequencyPerDay: input.commitFrequencyPerDay,
        prMergeRate: input.pr.mergeRate,
        averagePrAgeHours: input.pr.averageMergeTimeHours,
        averageReviewTimeHours: input.pr.reviewTimeHours,
        averagePrCycleTimeHours: input.pr.cycleTimeHours,
        averagePrSize: input.pr.averageSize,
        averageIssueResolutionTimeHours: input.issues.averageResolutionHours,
      },
      create: {
        repositoryId: repoId,
        range: toPrRange(range),
        commits: input.commits,
        contributors: input.contributors,
        openedPullRequests: input.pr.opened,
        mergedPullRequests: input.pr.merged,
        closedPullRequests: input.pr.closed,
        openPullRequests: input.pr.open,
        openedIssues: input.issues.opened,
        closedIssues: input.issues.closed,
        openIssues: input.issues.open,
        stars: input.stars,
        forks: input.forks,
        watchers: input.watchers,
        commitFrequencyPerDay: input.commitFrequencyPerDay,
        prMergeRate: input.pr.mergeRate,
        averagePrAgeHours: input.pr.averageMergeTimeHours,
        averageReviewTimeHours: input.pr.reviewTimeHours,
        averagePrCycleTimeHours: input.pr.cycleTimeHours,
        averagePrSize: input.pr.averageSize,
        averageIssueResolutionTimeHours: input.issues.averageResolutionHours,
      },
    }),
  ]);
}

export function formatDashboardNumber(n: number): string {
  return formatNumber(n);
}