import 'dotenv/config';
import { prisma } from './db/client.js';
import { createLogger } from './lib/logger.js';
import { syncFullRepository } from './services/sync.service.js';
import { config } from './config.js';

const logger = createLogger('sync-worker');

async function syncAllActiveRepositories() {
  try {
    const repos = await prisma.repository.findMany({
      where: { archived: false, disabled: false },
      select: { id: true, fullName: true },
      take: 20,
    });

    if (repos.length === 0) {
      logger.info('No active repositories found to sync.');
      return;
    }

    logger.info(`Starting sync cycle for ${repos.length} repositories...`);
    for (const repo of repos) {
      try {
        logger.info(`Syncing ${repo.fullName}...`);
        const result = await syncFullRepository(repo.id);
        logger.info(`Completed sync for ${repo.fullName}`, result);
      } catch (err: any) {
        logger.warn(`Failed to sync ${repo.fullName}`, { message: err?.message });
      }
    }
  } catch (err: any) {
    logger.error('Error during repository sync cycle', err);
  }
}

async function startWorker() {
  logger.info('GitPulse Sync Worker started.');

  // Run initial sync check
  await syncAllActiveRepositories();

  // Schedule periodic sync (every 10 minutes)
  const INTERVAL_MS = 10 * 60 * 1000;
  setInterval(async () => {
    logger.info('Periodic sync trigger fired.');
    await syncAllActiveRepositories();
  }, INTERVAL_MS);
}

startWorker().catch((err) => {
  logger.error('Fatal worker error', err);
  process.exit(1);
});
