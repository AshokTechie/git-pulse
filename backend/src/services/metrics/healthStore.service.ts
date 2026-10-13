import { prisma } from '../../db/client.js';
import type { HealthResult } from './health.service.js';
import type { RangeKey, RangeKey as RangeKeyT } from './utils.js';
import { round, toPrRange } from './utils.js';

/**
 * Persist the latest HealthScore snapshot (with technical debt & bus factor)
 * for a repository / range so API reads stay cheap.
 */
export async function persistHealthScore(repoId: string, range: RangeKey, health: HealthResult) {
  await prisma.healthScore.upsert({
    where: { id: `${repoId}-${toPrRange(range)}` },
    update: {
      score: health.score,
      breakdown: health.breakdown,
      technicalDebt: health.technicalDebt,
      criticalFiles: health.criticalFiles,
      staleIssues: health.staleIssues,
      outdatedDependencies: health.outdatedDependencies,
      busFactor: health.busFactor,
    },
    create: {
      id: `${repoId}-${toPrRange(range)}`,
      repositoryId: repoId,
      range: toPrRange(range),
      score: health.score,
      breakdown: health.breakdown,
      technicalDebt: health.technicalDebt,
      criticalFiles: health.criticalFiles,
      staleIssues: health.staleIssues,
      outdatedDependencies: health.outdatedDependencies,
      busFactor: health.busFactor,
    },
  });
}

export async function getStoredHealth(repoId: string, range: RangeKey): Promise<HealthResult | null> {
  const row = await prisma.healthScore.findUnique({
    where: { id: `${repoId}-${toPrRange(range)}` },
  });
  if (!row) return null;
  return {
    score: row.score,
    breakdown: row.breakdown as HealthResult['breakdown'],
    technicalDebt: row.technicalDebt,
    criticalFiles: row.criticalFiles,
    staleIssues: row.staleIssues,
    outdatedDependencies: row.outdatedDependencies,
    busFactor: (row.busFactor as HealthResult['busFactor']) ?? [],
  };
}