import { prisma } from '../../db/client.js';
import { clamp, round, type RangeKey, toPrRange, rangeStartDate } from './utils.js';

export interface DeveloperMetricsResult {
  developerId: string;
  login: string;
  name: string | null;
  avatarUrl: string | null;
  commits: number;
  pullRequests: number;
  mergedPullRequests: number;
  reviews: number;
  approvals: number;
  changeRequests: number;
  issuesClosed: number;
  linesAdded: number;
  linesRemoved: number;
  activeDays: number;
  averagePrSize: number | null;
  averageReviewTimeHours: number | null;
  collaborationCount: number;
  reviewQuality: number;
  consistency: number;
  collaboration: number;
  delivery: number;
  score: number;
  scoreBreakdown: {
    contributionQuality: number;
    reviewContribution: number;
    consistency: number;
    collaboration: number;
    delivery: number;
  };
}

/**
 * Recalculate DeveloperMetric rows for the given time range. When `repositoryId`
 * is provided the scope is REPOSITORY, otherwise GLOBAL.
 */
export async function calculateDeveloperMetrics(repoId: string | null, range: RangeKey): Promise<DeveloperMetricsResult[]> {
  const since = rangeStartDate(range);
  const daysInRange = Math.max(1, Math.round((Date.now() - since.getTime()) / 86_400_000));
  const repoFilter = repoId ? { repositoryId: repoId } : {};

  const developers = await prisma.developer.findMany({
    where: { login: { not: null } },
    select: { id: true, login: true, name: true, avatarUrl: true },
  });

  const results: DeveloperMetricsResult[] = [];

  for (const dev of developers) {
    const [commits, authoredPrs, reviews, prReviews, issuesResolved] = await Promise.all([
      prisma.commit.findMany({
        where: { authorId: dev.id, authoredAt: { gte: since }, ...repoFilter },
        select: { authoredAt: true, additions: true, deletions: true },
        take: 2000,
      }),
      prisma.pullRequest.findMany({
        where: { authorId: dev.id, createdAt: { gte: since }, ...repoFilter },
        select: { state: true, additions: true, deletions: true, createdAt: true, mergedAt: true, id: true },
        take: 1000,
      }),
      prisma.pullRequestReview.findMany({
        where: { reviewerId: dev.id, submittedAt: { gte: since }, ...repoFilter },
        select: { state: true, submittedAt: true, pullRequestId: true },
        take: 1000,
      }),
      prisma.pullRequest.findMany({
        where: { ...repoFilter, createdAt: { gte: since } },
        select: { id: true, createdAt: true, reviews: { where: { reviewerId: dev.id }, select: { state: true, submittedAt: true } } },
        take: 1000,
      }),
      prisma.issue.findMany({
        where: { repositoryId: repoId ?? undefined, authorId: dev.id, closedAt: { gte: since }, state: 'CLOSED' },
        select: { id: true },
      }),
    ]);

    const commitsCount = commits.length;
    const mergedPrs = authoredPrs.filter((p) => p.state === 'MERGED');
    const prsOpened = authoredPrs.length;
    const linesAdded = commits.reduce((a, c) => a + c.additions, 0);
    const linesRemoved = commits.reduce((a, c) => a + c.deletions, 0);
    const activeDays = new Set(commits.map((c) => c.authoredAt.toISOString().slice(0, 10))).size;
    const approvals = reviews.filter((r) => r.state === 'APPROVED').length;
    const changeRequests = reviews.filter((r) => r.state === 'CHANGES_REQUESTED').length;

    // Collaboration = distinct authors of PRs that this developer reviewed.
    const reviewerPrIds = prReviews.map((p) => p.id);
    const reviewedPrs = reviewerPrIds.length > 0
      ? await prisma.pullRequest.findMany({
        where: { id: { in: reviewerPrIds } },
        select: { authorId: true },
        take: 500,
      })
      : [];
    const collaboratedIds = new Set(reviewedPrs.map((p) => p.authorId).filter((x): x is string => Boolean(x)));
    for (const pr of authoredPrs) {
      // Anyone who reviewed this developer's PRs is a collaborator too.
      const reviewedBy = await prisma.pullRequestReview.findMany({
        where: { pullRequestId: pr.id, reviewerId: { not: null } },
        select: { reviewerId: true },
        take: 50,
      });
      reviewedBy.forEach((r) => { if (r.reviewerId) collaboratedIds.add(r.reviewerId); });
    }
    const collaborationCount = collaboratedIds.size;

    // Average PR size of this developer's merged PRs.
    const mergedSizes = mergedPrs.map((p) => p.additions + p.deletions);
    const averagePrSize = mergedSizes.length > 0 ? Math.round(mergedSizes.reduce((a, b) => a + b, 0) / mergedSizes.length) : null;

    // Average review time: time from PR creation to this developer's first review.
    const reviewTimes: number[] = [];
    for (const pr of prReviews) {
      const firstOfMine = pr.reviews
        .filter((r) => r.submittedAt)
        .map((r) => r.submittedAt!.getTime())
        .sort((a, b) => a - b)[0];
      if (firstOfMine) reviewTimes.push((firstOfMine - pr.createdAt.getTime()) / 3_600_000);
    }
    const averageReviewTimeHours = reviewTimes.length > 0 ? round(reviewTimes.reduce((a, b) => a + b, 0) / reviewTimes.length) : null;

    // ----- Balanced scoring (never rank purely by commit count) -----
    const contributionQuality = Math.round(
      clamp(Math.log2(commitsCount + 1) * 12, 0, 60) +
      clamp(mergedPrs.length * 3, 0, 20) +
      clamp(averagePrSize !== null ? (averagePrSize < 800 ? 20 - averagePrSize / 100 : 10) : 10, 0, 20),
    );

    const reviewContribution = Math.round(
      clamp(reviews.length * 3, 0, 50) +
      clamp(approvals * 4, 0, 30) +
      clamp(averageReviewTimeHours !== null && averageReviewTimeHours <= 24 ? 20 : 5, 0, 20),
    );

    const consistency = Math.round(clamp((activeDays / daysInRange) * 100, 0, 100) * 0.7 + clamp(commitsCount / Math.max(1, activeDays), 0, 10) * 3);

    const collaboration = Math.round(clamp(collaborationCount * 8, 0, 90) + clamp(approvals * 1.5, 0, 10));

    const delivery = Math.round(
      clamp(mergedPrs.length * 4, 0, 40) +
      clamp(issuesResolved.length * 2, 0, 20) +
      clamp(activeDays >= 5 ? 20 : activeDays * 2, 0, 20) +
      clamp(averageReviewTimeHours !== null && averageReviewTimeHours <= 24 ? 20 : 5, 0, 20),
    );

    const scoreBreakdown = {
      contributionQuality: clamp(contributionQuality, 0, 100),
      reviewContribution: clamp(reviewContribution, 0, 100),
      consistency: clamp(consistency, 0, 100),
      collaboration: clamp(collaboration, 0, 100),
      delivery: clamp(delivery, 0, 100),
    };

    const score = clamp(Math.round(
      scoreBreakdown.contributionQuality * 0.25 +
      scoreBreakdown.reviewContribution * 0.2 +
      scoreBreakdown.consistency * 0.2 +
      scoreBreakdown.collaboration * 0.15 +
      scoreBreakdown.delivery * 0.2,
    ), 0, 100);

    const scope = repoId ? 'REPOSITORY' : 'GLOBAL';
    await prisma.developerMetric.upsert({
      where: {
        developerId_scope_repositoryId_range: {
          developerId: dev.id,
          scope,
          repositoryId: repoId ?? null,
          range: toPrRange(range),
        },
      },
      update: {
        commits: commitsCount,
        pullRequests: prsOpened,
        mergedPullRequests: mergedPrs.length,
        reviews: reviews.length,
        approvals,
        changeRequests,
        issuesClosed: issuesResolved.length,
        linesAdded,
        linesRemoved,
        activeDays,
        averagePrSize,
        averageReviewTimeHours,
        collaborationCount,
        score,
        scoreBreakdown,
      },
      create: {
        developerId: dev.id,
        repositoryId: repoId ?? null,
        scope,
        range: toPrRange(range),
        commits: commitsCount,
        pullRequests: prsOpened,
        mergedPullRequests: mergedPrs.length,
        reviews: reviews.length,
        approvals,
        changeRequests,
        issuesClosed: issuesResolved.length,
        linesAdded,
        linesRemoved,
        activeDays,
        averagePrSize,
        averageReviewTimeHours,
        collaborationCount,
        score,
        scoreBreakdown,
      },
    });

    results.push({
      developerId: dev.id,
      login: dev.login,
      name: dev.name,
      avatarUrl: dev.avatarUrl,
      commits: commitsCount,
      pullRequests: prsOpened,
      mergedPullRequests: mergedPrs.length,
      reviews: reviews.length,
      approvals,
      changeRequests,
      issuesClosed: issuesResolved.length,
      linesAdded,
      linesRemoved,
      activeDays,
      averagePrSize,
      averageReviewTimeHours,
      collaborationCount,
      reviewQuality: reviewContribution,
      consistency: scoreBreakdown.consistency,
      collaboration: scoreBreakdown.collaboration,
      delivery: scoreBreakdown.delivery,
      score,
      scoreBreakdown,
    });
  }

  return results.filter((r) => r.commits > 0 || r.pullRequests > 0 || r.reviews > 0);
}

export async function getDeveloperLeaderboard(range: RangeKey, repoId?: string): Promise<DeveloperMetricsResult[]> {
  const scope = repoId ? 'REPOSITORY' : 'GLOBAL';
  const rows = await prisma.developerMetric.findMany({
    where: { scope, repositoryId: repoId ?? null, range: toPrRange(range) },
    include: { developer: { select: { id: true, login: true, name: true, avatarUrl: true } } },
    orderBy: { score: 'desc' },
  });
  return rows.map((r) => ({
    developerId: r.developer.id,
    login: r.developer.login,
    name: r.developer.name,
    avatarUrl: r.developer.avatarUrl,
    commits: r.commits,
    pullRequests: r.pullRequests,
    mergedPullRequests: r.mergedPullRequests,
    reviews: r.reviews,
    approvals: r.approvals,
    changeRequests: r.changeRequests,
    issuesClosed: r.issuesClosed,
    linesAdded: r.linesAdded,
    linesRemoved: r.linesRemoved,
    activeDays: r.activeDays,
    averagePrSize: r.averagePrSize,
    averageReviewTimeHours: r.averageReviewTimeHours,
    collaborationCount: r.collaborationCount,
    reviewQuality: (r.scoreBreakdown as { reviewContribution?: number })?.reviewContribution ?? 0,
    consistency: (r.scoreBreakdown as { consistency?: number })?.consistency ?? 0,
    collaboration: (r.scoreBreakdown as { collaboration?: number })?.collaboration ?? 0,
    delivery: (r.scoreBreakdown as { delivery?: number })?.delivery ?? 0,
    score: r.score,
    scoreBreakdown: r.scoreBreakdown as DeveloperMetricsResult['scoreBreakdown'],
  }));
}