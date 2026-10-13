import 'dotenv/config';

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { prisma } from './db/client.js';
import { createLogger } from './lib/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authRoutes } from './routes/auth.routes.js';
import { repositoryRouter } from './routes/repository.routes.js';
import { analyticsRoutes, metricsRoutes } from './routes/analytics.routes.js';
import { aiRoutes } from './routes/ai.routes.js';
import { userRoutes } from './routes/user.routes.js';

const logger = createLogger('app');

const app = express();

// --- Middleware ---

// Security headers
app.use(helmet());

// CORS - allow frontend origin
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(cors({
  origin: frontendUrl,
  credentials: true,
}));

// Parse JSON bodies and cookies
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// Rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per window
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', globalLimiter);

// --- Health check ---
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/repositories', repositoryRouter);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/ai', aiRoutes);

// --- 404 ---
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// --- Error handler ---
app.use(errorHandler);

// --- Start Server ---
const port = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(port, () => {
  logger.info(`GitPulse API listening on http://0.0.0.0:${port}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});