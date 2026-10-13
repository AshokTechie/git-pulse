import { Router, type Request, type Response } from 'express';
import { config, isGitHubConfigured } from '../config.js';
import {
  completeOAuthCallback,
  destroySession,
  getSessionUser,
  createDevSession,
  createSession,
} from '../services/auth.service.js';
import { prisma } from '../db/client.js';
import { hashPassword, verifyPassword } from '../lib/crypto.js';
import { createLogger } from '../lib/logger.js';

const logger = createLogger('auth-routes');
const router = Router();

// --- Email & Password Registration ---
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await prisma.user.findFirst({
      where: { email: cleanEmail },
    });
    if (existing) {
      return res.status(400).json({ error: 'User with this email already exists. Please sign in.' });
    }

    const username = cleanEmail.split('@')[0];
    const passwordHash = hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email: cleanEmail,
        name: name || username,
        githubLogin: username,
        passwordHash,
      },
    });

    const sessionToken = await createSession(user.id);
    res.cookie('gitpulse_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        login: user.githubLogin,
      },
    });
  } catch (error: any) {
    logger.error('Registration error', error);
    res.status(500).json({ error: error.message || 'Registration failed' });
  }
});

// --- Email & Password Login ---
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanInput = email.toLowerCase().trim();
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: cleanInput }, { githubLogin: cleanInput }],
      },
    });

    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid email or password. If you registered previously, please try again or use Demo Login.' });
    }

    const isValid = verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const sessionToken = await createSession(user.id);
    res.cookie('gitpulse_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        login: user.githubLogin,
      },
    });
  } catch (error: any) {
    logger.error('Login error', error);
    res.status(500).json({ error: error.message || 'Login failed' });
  }
});

// --- Initiate OAuth ---
router.get('/github', (_req: Request, res: Response) => {
  if (!isGitHubConfigured()) {
    return res.redirect('/login?error=oauth_not_configured');
  }

  const state = Math.random().toString(36).substring(2, 16);
  const authorizeUrl = `https://github.com/login/oauth/authorize?client_id=${config.github.clientId}&redirect_uri=${encodeURIComponent(config.github.callbackUrl)}&scope=${encodeURIComponent(config.github.scopes)}&state=${state}`;

  res.cookie('gitpulse_oauth_state', state, { httpOnly: true, maxAge: 10 * 60 * 1000 });
  res.redirect(authorizeUrl);
});

// --- OAuth Callback ---
router.get('/github/callback', async (req: Request, res: Response) => {
  const { code } = req.query as { code: string };
  if (!code) {
    return res.status(400).json({ error: 'Missing code parameter' });
  }

  try {
    const result = await completeOAuthCallback(code);
    res.cookie('gitpulse_session', result.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    res.redirect('/select-repo');
  } catch (error: any) {
    logger.error('OAuth callback error', error);
    res.status(500).json({ error: error.message ?? 'OAuth callback failed' });
  }
});

// --- Demo / Dev Login (Instant 1-Click Access) ---
router.post('/demo', async (_req: Request, res: Response) => {
  try {
    const result = await createDevSession('octocat');
    res.cookie('gitpulse_session', result.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    res.json({ success: true, userId: result.userId });
  } catch (error: any) {
    logger.error('Demo login error', error);
    res.status(500).json({ error: error.message ?? 'Demo login failed' });
  }
});

// --- Logout ---
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.['gitpulse_session'];
    if (token) {
      await destroySession(token);
    }
    res.clearCookie('gitpulse_session');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Logout failed' });
  }
});

// --- Current User ---
router.get('/me', async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.['gitpulse_session'];
    if (!token) {
      return res.json({ user: null, account: null, sessionValid: false });
    }
    const sessionInfo = await getSessionUser(token);
    if (!sessionInfo) {
      return res.json({ user: null, account: null, sessionValid: false });
    }
    res.json({
      user: sessionInfo.user,
      account: sessionInfo.account,
      sessionValid: true,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user' });
  }
});

export { router as authRoutes };