import { Router, type Request, type Response } from 'express';
import { prisma } from '../db/client.js';
import { decryptSecret } from '../lib/crypto.js';
import { GitHubClient } from '../lib/githubClient.js';
import { createLogger } from '../lib/logger.js';
import { syncFullRepository } from '../services/sync.service.js';

const logger = createLogger('repository-routes');
const router = Router();

/**
 * GET /api/repositories
 * Returns all repositories accessible to the user, or local database repositories.
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const sessionToken = req.cookies?.['gitpulse_session'];
    let sessionUser: any = null;
    if (sessionToken) {
      const session = await prisma.session.findFirst({
        where: { tokenHash: sessionToken },
        include: { user: { include: { accounts: true } } },
      });
      sessionUser = session?.user;
    }

    const account = sessionUser?.accounts?.[0] || await prisma.gitHubAccount.findFirst();

    if (account && account.accessTokenEncrypted && account.tokenType !== 'dev') {
      try {
        const token = decryptSecret(account.accessTokenEncrypted);
        const client = new GitHubClient(token);
        const ghRepos = await client.paginate('/user/repos?sort=updated&visibility=all', {
          maxPages: 5,
          perPage: 30,
        });

        const repos = ghRepos.map((ghe) => ({
          id: ghe.id,
          name: ghe.name,
          full_name: ghe.full_name,
          description: ghe.description,
          language: ghe.language,
          stargazers_count: ghe.stargazers_count,
          forks_count: ghe.forks_count,
          open_issues_count: ghe.open_issues_count,
          updated_at: ghe.updated_at,
          private: ghe.private,
          default_branch: ghe.default_branch,
        }));

        if (repos.length > 0) {
          return res.json(repos);
        }
      } catch (ghErr) {
        logger.warn('GitHub API fetch failed, falling back to database repositories', ghErr);
      }
    }

    // Fallback to database repositories
    const dbRepos = await prisma.repository.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });

    const repos = dbRepos.map((r) => ({
      id: r.githubId,
      name: r.name,
      full_name: r.fullName,
      description: r.description,
      language: r.primaryLanguage,
      stargazers_count: r.stars,
      forks_count: r.forksCount,
      open_issues_count: r.openIssuesCount,
      updated_at: r.updatedAt.toISOString(),
      private: r.private,
      default_branch: r.defaultBranch,
    }));

    res.json(repos);
  } catch (error: any) {
    logger.error('Failed to fetch repositories', error);
    res.status(500).json({ error: error.message || 'Failed to fetch repositories' });
  }
});

/**
 * POST /api/repositories/:id/sync
 * Syncs pull requests, commits, issues, and metrics for a repository
 */
router.post('/:id/sync', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let repo = await prisma.repository.findFirst({
      where: { OR: [{ id }, { githubId: Number(id) || -1 }] },
    });

    if (!repo) {
      return res.status(404).json({ error: 'Repository not found in GitPulse' });
    }

    const result = await syncFullRepository(repo.id);
    res.json(result);
  } catch (error: any) {
    logger.error('Failed to sync repository', error);
    res.status(500).json({ error: error.message || 'Failed to sync repository' });
  }
});

export { router as repositoryRouter };