import { Router, type Request, type Response } from 'express';
import { getAiOverview } from '../services/analytics-assembly.service.js';
import { queryAi } from '../services/ai.service.js';
import { createLogger } from '../lib/logger.js';

const logger = createLogger('ai-routes');
const router = Router();

// GET /api/ai - AI Overview, recommendations, insights
router.get('/', async (_req: Request, res: Response) => {
  try {
    const data = await getAiOverview();
    res.json(data);
  } catch (error: any) {
    logger.error('Failed to get AI overview', error);
    res.status(500).json({ error: error.message || 'Failed to fetch AI overview' });
  }
});

// POST /api/ai/query - Interactive GitPulse Copilot Q&A
router.post('/query', async (req: Request, res: Response) => {
  try {
    const { question, repoFilter } = req.body;
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Question is required' });
    }

    const result = await queryAi(question, repoFilter);
    res.json(result);
  } catch (error: any) {
    logger.error('Failed to answer AI query', error);
    res.status(500).json({ error: error.message || 'Failed to process AI query' });
  }
});

export { router as aiRoutes };
