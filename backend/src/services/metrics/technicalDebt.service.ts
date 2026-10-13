import { prisma } from '../../db/client.js';
import { clamp } from './utils.js';

export interface TechnicalDebtResult {
  score: number;
  criticalFiles: number;
  largeFiles: number;
  todoCount: number;
  fixmeCount: number;
  staleIssues: number;
  stalePrs: number;
  staleBranches: number;
  outdatedDependencies: number;
  frequentlyModifiedFiles: number;
  highRiskFiles: string[];
  staleBranchNames: string[];
}

const MAX_CHURNED_FILES = 50;

export async function computeTechnicalDebt(repoId: string): Promise<TechnicalDebtResult> {
  const [openIssues, openPrs, branches, commitHints, bubbles, commitFiles, dependabot] = await Promise.all([
    prisma.issue.findMany({ where: { repositoryId: repoId, state: 'OPEN' }, select: { updatedAt: true } }),
    prisma.pullRequest.findMany({ where: { repositoryId: repoId, state: 'OPEN' }, select: { updatedAt: true, createdAt: true } }),
    prisma.branch.findMany({ where: { repositoryId: repoId }, select: { name: true, headSha: true, isDefault: true, updatedAt: true } }),
    prisma.commit.findMany({
      where: { repositoryId: repoId },
      select: { message: true, authoredAt: true },
      orderBy: { authoredAt: 'desc' },
      take: 4000,
    }),
    prisma.repository.findUnique({ where: { id: repoId }, select: { defaultBranch: true } }),
    prisma.commitFile.findMany({ where: { repositoryId: repoId }, select: { path: true, additions: true, deletions: true }, take: 5000 }),
    prisma.securityAlert.findMany({ where: { repositoryId: repoId, type: 'DEPENDABOT', state: 'OPEN' }, select: { id: true } }),
  ]);

  const todoCount = commitHints.filter((c) => /TODO|TODO\(/i.test(c.message)).length;
  const fixmeCount = commitHints.filter((c) => /FIXME|HACK|XXX/i.test(c.message)).length;

  const staleIssues = openIssues.filter((i) => Date.now() - i.updatedAt.getTime() > 30 * 86_400_000).length;
  const stalePrs = openPrs.filter((p) => Date.now() - p.updatedAt.getTime() > 14 * 86_400_000).length;

  // Stale branches: non-default branches whose head hasn't changed in 60 days.
  const defaultBranch = bubbles?.defaultBranch;
  const now = Date.now();
  const staleBranches = branches.filter((b) => {
    if (b.isDefault || b.name === defaultBranch) return false;
    if (b.name.startsWith('dependabot/') || b.name.startsWith('renovate/')) return true;
    const updated = b.updatedAt.getTime();
    return now - updated > 60 * 86_400_000;
  });
  const staleBranchNames = staleBranches.map((b) => b.name).slice(0, 20);

  const outdatedDependencies = dependabot.length;

  // Large files: sampled commits indicate files with massive churn; also detect
  // high-risk extensions (minified bundles, lockfiles, giant generated files).
  const churnByPath = new Map<string, number>();
  const changeCountByPath = new Map<string, number>();
  for (const f of commitFiles) {
    churnByPath.set(f.path, (churnByPath.get(f.path) ?? 0) + f.additions + f.deletions);
    changeCountByPath.set(f.path, (changeCountByPath.get(f.path) ?? 0) + 1);
  }

  const highRiskFiles: string[] = [];
  const largeFiles: string[] = [];
  for (const [path, churn] of churnByPath) {
    if (churn > 2000 && !/\.min\.|lock$|\.lock|\.svg$|vendor\//.test(path)) largeFiles.push(path);
    if (/\.min\.js$|\.lock$|\.min\.css$|generated|pb\.ts|pb\.js|\.map$/.test(path)) highRiskFiles.push(path);
  }

  const frequentlyModified = [...changeCountByPath.entries()]
    .filter(([, count]) => count >= 8)
    .sort((a, b) => b[1] - a[1])
    .map(([path]) => path)
    .slice(0, MAX_CHURNED_FILES);
  const frequentlyModifiedFiles = frequentlyModified.length;

  const criticalFiles = largeFiles.length + highRiskFiles.length + (stalePrs > 5 ? Math.ceil(stalePrs / 2) : 0);

  // Weighted 0-100 debt score: 0 = no debt, 100 = heavy debt.
  const components = [
    clamp(todoCount * 0.4 + fixmeCount * 0.6, 0, 100),
    clamp(criticalFiles * 8, 0, 100),
    clamp(staleIssues * 1.5 + stalePrs * 2 + staleBranches.length * 1.5, 0, 100),
    clamp(outdatedDependencies * 4, 0, 100),
    clamp(Math.log2(frequentlyModifiedFiles + 1) * 12, 0, 60),
  ];
  const score = Math.round(components.reduce((a, b) => a + b, 0) / components.length);

  return {
    score,
    criticalFiles,
    largeFiles: largeFiles.length,
    todoCount,
    fixmeCount,
    staleIssues,
    stalePrs,
    staleBranches: staleBranches.length,
    outdatedDependencies,
    frequentlyModifiedFiles,
    highRiskFiles: highRiskFiles.slice(0, 20),
    staleBranchNames,
  };
}