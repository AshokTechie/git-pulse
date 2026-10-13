import 'dotenv/config';

export function env(name: string, fallback = ''): string {
  const value = process.env[name];
  if (value === undefined || value === '') {
    if (fallback !== '') return fallback;
    if (name.startsWith('OPTIONAL_')) return '';
    return fallback;
  }
  return value;
}

export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isDev: (process.env.NODE_ENV ?? 'development') !== 'production',

  port: Number.parseInt(env('PORT', '4000'), 10),
  host: env('HOST', '0.0.0.0'),
  frontendUrl: env('FRONTEND_URL', 'http://localhost:5173'),

  databaseUrl: env('DATABASE_URL_SQLITE', 'file:./dev.db'),
  redisUrl: env('REDIS_URL', ''),

  github: {
    clientId: env('GITHUB_CLIENT_ID'),
    clientSecret: env('GITHUB_CLIENT_SECRET'),
    callbackUrl: env('GITHUB_CALLBACK_URL', 'http://localhost:4000/api/auth/github/callback'),
    scopes: env('GITHUB_SCOPES', 'read:user user:email repo read:org'),
  },

  sessionSecret: env('SESSION_SECRET', 'insecure-dev-secret-change-me'),
  cookieName: env('COOKIE_NAME', 'gitpulse.session'),

  corsOrigins: env('CORS_ORIGINS', 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),

  ai: {
    apiKey: env('OPTIONAL_AI_API_KEY', process.env.AI_API_KEY ?? ''),
    apiBase: env('AI_API_BASE', 'https://api.openai.com/v1'),
    model: env('AI_MODEL', 'gpt-4o-mini'),
  },

  allowDevAuth: process.env.ALLOW_DEV_AUTH === 'true',
} as const;

export function isGitHubConfigured(): boolean {
  return Boolean(config.github.clientId && config.github.clientSecret);
}

// Sentinels for module-level defaults that distinguish unset from empty.
export const SETTINGS = {
  // How many recent commits to fan out for per-file stats (bus factor / debt).
  commitDetailSample: Number.parseInt(env('COMMIT_DETAIL_SAMPLE', '300'), 10),
  // Sync cadence: active repos every 10m, less active every 30m.
  activeSyncIntervalDays: Number.parseFloat(env('ACTIVE_SYNC_MINUTES', '10')) / 1440,
  inactiveSyncIntervalDays: Number.parseFloat(env('INACTIVE_SYNC_MINUTES', '30')) / 1440,
  // Default first full sync window (days of history to pull initially).
  initialHistoryDays: Number.parseInt(env('INITIAL_HISTORY_DAYS', '365'), 10),
};