import { Router, type Request, type Response } from 'express';
import { prisma } from '../db/client.js';
import { getSessionUser } from '../services/auth.service.js';

const router = Router();

// GET /api/user/profile
router.get('/profile', async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.['gitpulse_session'];
    const sessionInfo = await getSessionUser(token);
    if (!sessionInfo) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    res.json(sessionInfo.user);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch user profile' });
  }
});

export { router as userRoutes };
