import { prisma } from '../../db/client.js';

export interface StaleDetectionResult {
  warningPrs: { number: number; title: string; daysOpen: number }[];
  criticalPrs: { number: number; title: string; daysOpen: number }[];
  staleIssues: { number: number; title: string; daysInactive: number }[];
  staleBranches: string[];
}

const PR_WARNING_DAYS = 7;
const PR_CRITICAL_DAYS = 14;
const ISSUE_STALE_DAYS = 30;
const BRANCH_STALE_DAYS = 60;

export async function detectStale(repoId: string): Promise<StaleDetectionResult> {
  const now = Date.now();
  const [openPrs, openIssues, branches, repo] = await Promise.all([
    prisma.pullRequest.findMany({ where: { repositoryId: repoId, state: 'OPEN' }, select: { number: true, title: true, createdAt: true } }),
    prisma.issue.findMany({ where: { repositoryId: repoId, state: 'OPEN' }, select: { number: true, title: true, updatedAt: true } }),
    prisma.branch.findMany({ where: { repositoryId: repoId }, select: { name: true, isDefault: true, headSha: true } }),
    prisma.repository.findUnique({ where: { id: repoId }, select: { defaultBranch: true } }),
  ]);

  const warningPrs = openPrs
    .filter((p) => {
      const days = (now - p.createdAt.getTime()) / 86_400_000;
      return days > PR_WARNING_DAYS && days <= PR_CRITICAL_DAYS;
    })
    .map((p) => ({ number: p.number, title: p.title, daysOpen: Math.round((now - p.createdAt.getTime()) / 86_400_000) }));

  const criticalPrs = openPrs
    .filter((p) => (now - p.createdAt.getTime()) / 86_400_000 > PR_CRITICAL_DAYS)
    .map((p) => ({ number: p.number, title: p.title, daysOpen: Math.round((now - p.createdAt.getTime()) / 86_400_000) }));

  const staleIssues = openIssues
    .filter((i) => (now - i.updatedAt.getTime()) / 86_400_000 > ISSUE_STALE_DAYS)
    .map((i) => ({ number: i.number, title: i.title, daysInactive: Math.round((now - i.updatedAt.getTime()) / 86_400_000) }));

  const rawBranches = await prisma.branch.findMany({ where: { repositoryId: repoId }, select: { name: true, isDefault: true } });
  let staleBranches: string[] = [];
  try {
    staleBranches = rawBranches
      .filter((b) => !b.isDefault && b.name !== repo?.defaultBranch)
      .map((b) => b.name)
      .slice(0, 20);
  } catch {
    staleBranches = [];
  }

  return { warningPrs, criticalPrs, staleIssues, staleBranches };
}