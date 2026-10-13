import { prisma } from '../../db/client.js';
import { createLogger } from '../../lib/logger.js';
import { computeRepositoryAnalytics } from './repositoryMetrics.service.js';
import { computeHealthScore, computeBusFactor } from './health.service.js';
import { calculateDeveloperMetrics, getDeveloperLeaderboard } from './developerMetrics.service.js';
import { buildTeamCollaboration } from './team.service.js';
import { computeTechnicalDebt } from './technicalDebt.service.js';
import { detectAnomalies } from './anomaly.service.js';
import { generateRepositoryInsights } from './insights.service.js';
import { persistHealthScore } from './healthStore.service.js';
import type { RangeKey } from './utils.js';

const logger = createLogger('metrics-service');

export async function recalculateAllMetrics(repoId?: string): Promise<{ errors: number }> {
  let errors = 0;
  const repos = repoId
    ? await prisma.repository.findMany({ where: { id: repoId } })
    : await prisma.repository.findMany();

  for (const repo of repos) {
    try {
      await computeRepositoryAnalytics(repo.id, '30d');
      const health = await computeHealthScore(repo.id, '30d');
      await persistHealthScore(repo.id, '30d', health);
      const debt = await computeTechnicalDebt(repo.id);
      const busFactor = await computeBusFactor(repo.id);
      await buildTeamCollaboration(repo.id, '30d');
      await detectAnomalies(repo.id);
      await generateRepositoryInsights(repo.id);
      logger.info(`metrics recalculated for ${repo.fullName}`, { health: health.score, debt: debt.score, busFactor: busFactor.length });
    } catch (error) {
      errors++;
      logger.error(`metrics recalculation failed for ${repo.fullName}`, error);
    }
  }

  // Global developer & team metrics.
  try {
    await calculateDeveloperMetrics(null, '30d');
    await buildTeamCollaboration(null, '30d');
  } catch (error) {
    errors++;
    logger.error('global metrics recalculation failed', error);
  }

  return { errors };
}

export async function recalculateRepoMetrics(range: RangeKey = '30d', repoId?: string): Promise<void> {
  const repos = repoId
    ? await prisma.repository.findMany({ where: { id: repoId } })
    : await prisma.repository.findMany();

  for (const repo of repos) {
    await computeRepositoryAnalytics(repo.id, range);
    const health = await computeHealthScore(repo.id, range);
    await persistHealthScore(repo.id, range, health);
    await calculateDeveloperMetrics(repo.id, range);
    await calculateDeveloperMetrics(null, range);
    await buildTeamCollaboration(repo.id, range);
    await buildTeamCollaboration(null, range);
  }
}

export { getDeveloperLeaderboard };