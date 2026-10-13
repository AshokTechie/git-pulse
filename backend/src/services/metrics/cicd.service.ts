import { prisma } from '../../db/client.js';
import { round, type RangeKey, rangeStartDate } from './utils.js';

export interface CicdAnalytics {
  totalRuns: number;
  successRate: number | null;
  failureRate: number | null;
  averageBuildTimeSeconds: number | null;
  failedRuns: number;
  successfulRuns: number;
  deployments: number;
  deploymentFailures: number;
  testFailures: number;
  recentRuns: { name: string | null; conclusion: string | null; createdAt: Date }[];
}

export async function getCicdAnalytics(repoId: string, range: RangeKey): Promise<CicdAnalytics> {
  const since = rangeStartDate(range);
  const [runs, deployments] = await Promise.all([
    prisma.workflowRun.findMany({
      where: { repositoryId: repoId, createdAt: { gte: since } },
      select: { conclusion: true, startedAt: true, completedAt: true, failedJobs: true, name: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 300,
    }),
    prisma.deployment.findMany({
      where: { repositoryId: repoId, createdAt: { gte: since } },
      select: { state: true },
    }),
  ]);

  const decided = runs.filter((r) => r.conclusion === 'SUCCESS' || r.conclusion === 'FAILURE' || r.conclusion === 'CANCELLED' || r.conclusion === 'TIMED_OUT' || r.conclusion === 'STARTUP_FAILURE');
  const successfulRuns = runs.filter((r) => r.conclusion === 'SUCCESS').length;
  const failedRuns = runs.filter((r) => r.conclusion === 'FAILURE' || r.conclusion === 'STARTUP_FAILURE').length;
  const successRate = decided.length > 0 ? round((decided.filter((r) => r.conclusion === 'SUCCESS').length / decided.length) * 100) : null;
  const failureRate = decided.length > 0 ? round((decided.filter((r) => r.conclusion === 'FAILURE' || r.conclusion === 'STARTUP_FAILURE').length / decided.length) * 100) : null;

  const durations = runs
    .filter((r) => r.startedAt && r.completedAt)
    .map((r) => (r.completedAt!.getTime() - r.startedAt!.getTime()) / 1000);
  const averageBuildTimeSeconds = durations.length > 0 ? round(durations.reduce((a, b) => a + b, 0) / durations.length) : null;

  const testFailures = runs.reduce((a, r) => a + r.failedJobs, 0);
  const deploymentsCount = deployments.length;
  const deploymentFailures = deployments.filter((d) => d.state === 'failure' || d.state === 'error').length;

  return {
    totalRuns: runs.length,
    successRate,
    failureRate,
    averageBuildTimeSeconds,
    failedRuns,
    successfulRuns,
    deployments: deploymentsCount,
    deploymentFailures,
    testFailures,
    recentRuns: runs.slice(0, 20).map((r) => ({ name: r.name, conclusion: r.conclusion, createdAt: r.createdAt })),
  };
}