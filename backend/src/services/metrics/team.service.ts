import { prisma } from '../../db/client.js';
import { round, type RangeKey, toPrRange, rangeStartDate } from './utils.js';

export interface ReviewEdge {
  from: string; // reviewer login
  fromName: string | null;
  to: string; // PR author login
  toName: string | null;
  reviews: number;
}

export interface TeamCollaborationResult {
  activeCollaborations: number;
  totalReviews: number;
  totalMembers: number;
  crossTeamReviews: number;
  reviewNetwork: ReviewEdge[];
  bottlenecks: { reviewer: string; concentration: number; detail: string }[];
}

export async function buildTeamCollaboration(repoId: string | null, range: RangeKey): Promise<TeamCollaborationResult> {
  const since = rangeStartDate(range);
  const repoFilter = repoId ? { repositoryId: repoId } : {};

  const reviewsWithPrs = await prisma.pullRequestReview.findMany({
    where: { submittedAt: { gte: since }, reviewerId: { not: null }, ...repoFilter },
    include: {
      pullRequest: {
        select: {
          id: true,
          authorId: true,
          repository: { select: { id: true, name: true } },
          author: { select: { id: true, login: true, name: true } },
        },
      },
      reviewer: { select: { id: true, login: true, name: true } },
    },
    take: 5000,
  });

  const validReviews = reviewsWithPrs.filter((r) => r.pullRequest && r.reviewer);

  // reviewer login -> pr author id -> review count
  const edgeMap = new Map<string, Map<string, number>>();
  const reviewsGivenBy = new Map<string, number>();
  const reviewsReceivedBy = new Map<string, number>();
  const repositoriesSeen = new Set<string>();
  let crossTeamReviews = 0;

  for (const r of validReviews) {
    const reviewerId = r.reviewerId!;
    const authorId = r.pullRequest.author?.id ?? 'ghost';
    const key = `${reviewerId}::${authorId}`;
    edgeMap.set(key, (edgeMap.get(key) ?? 0) + 1);
    reviewsGivenBy.set(reviewerId, (reviewsGivenBy.get(reviewerId) ?? 0) + 1);
    reviewsReceivedBy.set(authorId, (reviewsReceivedBy.get(authorId) ?? 0) + 1);
    repositoriesSeen.add(r.pullRequest.repository.id);
    if (repoId !== null) crossTeamReviews++; // placeholder, refined below
  }

  const reviewNetwork: ReviewEdge[] = [];
  for (const [key, count] of edgeMap) {
    const [reviewerId, authorId] = key.split('::');
    const reviewer = validReviews.find((r) => r.reviewer?.id === reviewerId)?.reviewer;
    const author = validReviews.find((r) => r.pullRequest.author?.id === authorId)?.pullRequest.author;
    if (!reviewer) continue;
    reviewNetwork.push({
      from: reviewer.login,
      fromName: reviewer.name,
      to: author?.login ?? 'ghost',
      toName: author?.name ?? null,
      reviews: count,
    });
  }
  reviewNetwork.sort((a, b) => b.reviews - a.reviews);

  // Cross-team: PR authored in one repo, reviewed by someone whose own PRs are mostly in other repos.
  // Approximate: reviews where the reviewer's authored PRs (in range) are distributed across >1 repos.
  const authorRepoIds = await prisma.pullRequest.findMany({
    where: { createdAt: { gte: since }, authorId: { not: null } },
    select: { authorId: true, repositoryId: true },
    take: 5000,
  });
  const authorRepos = new Map<string, Set<string>>();
  for (const pr of authorRepoIds) {
    if (!pr.authorId) continue;
    const set = authorRepos.get(pr.authorId) ?? new Set<string>();
    set.add(pr.repositoryId);
    authorRepos.set(pr.authorId, set);
  }
  for (const r of validReviews) {
    const reviewerId = r.reviewerId!;
    const reviewerRepos = authorRepos.get(reviewerId);
    const prRepos = r.pullRequest.repository.id;
    if (reviewerRepos && reviewerRepos.size > 1 && !reviewerRepos.has(prRepos)) {
      crossTeamReviews++;
    }
  }

  // Review concentration / bottlenecks
  const totalReviews = validReviews.length;
  const bottlenecks: TeamCollaborationResult['bottlenecks'] = [];
  for (const [reviewerId, count] of [...reviewsGivenBy.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)) {
    const concentration = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
    const reviewer = validReviews.find((r) => r.reviewer?.id === reviewerId)?.reviewer;
    if (!reviewer) continue;
    bottlenecks.push({
      reviewer: reviewer.login,
      concentration,
      detail: `${reviewer.login} performs ${concentration}% of reviews`,
    });
  }

  const memberIds = new Set<string>();
  for (const r of validReviews) {
    if (r.reviewerId) memberIds.add(r.reviewerId);
    if (r.pullRequest.author?.id) memberIds.add(r.pullRequest.author.id);
  }
  const totalMembers = memberIds.size;
  const activeCollaborations = reviewNetwork.filter((e) => e.reviews >= 3).length;

  await prisma.teamMetric.upsert({
    where: { scope_repositoryId_range: { scope: repoId ? 'REPOSITORY' : 'GLOBAL', repositoryId: repoId ?? null, range: toPrRange(range) } },
    update: {
      activeCollaborations,
      totalReviews,
      totalMembers,
      crossTeamReviews,
      reviewNetwork,
      bottlenecks,
      reviewConcentration: bottlenecks.slice(0, 3),
    },
    create: {
      scope: repoId ? 'REPOSITORY' : 'GLOBAL',
      repositoryId: repoId ?? null,
      range: toPrRange(range),
      activeCollaborations,
      totalReviews,
      totalMembers,
      crossTeamReviews,
      reviewNetwork,
      bottlenecks,
      reviewConcentration: bottlenecks.slice(0, 3),
    },
  });

  return {
    activeCollaborations,
    totalReviews,
    totalMembers,
    crossTeamReviews,
    reviewNetwork,
    bottlenecks,
  };
}

export async function getTeamCollaboration(repoId: string | null, range: RangeKey): Promise<TeamCollaborationResult | null> {
  const row = await prisma.teamMetric.findUnique({
    where: {
      scope_repositoryId_range: {
        scope: repoId ? 'REPOSITORY' : 'GLOBAL',
        repositoryId: repoId ?? null,
        range: toPrRange(range),
      },
    },
  });
  if (!row) return null;
  return {
    activeCollaborations: row.activeCollaborations,
    totalReviews: row.totalReviews,
    totalMembers: row.totalMembers,
    crossTeamReviews: row.crossTeamReviews,
    reviewNetwork: (row.reviewNetwork as ReviewEdge[]) ?? [],
    bottlenecks: (row.bottlenecks as TeamCollaborationResult['bottlenecks']) ?? [],
  };
}

export function avgReviewTurnaroundHours(edges: ReviewEdge[]): number | null {
  if (edges.length === 0) return null;
  return round(edges.reduce((a, b) => a + b.reviews, 0) / edges.length);
}