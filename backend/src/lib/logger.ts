type Level = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_ORDER: Record<Level, number> = { debug: 0, info: 1, warn: 2, error: 3 };

function ts(): string {
  return new Date().toISOString();
}

function emit(level: Level, scope: string, message: string, meta?: unknown): void {
  const prefix = `[${ts()}] [${level.toUpperCase()}] [${scope}]`;
  if (meta !== undefined) {
    const str = typeof meta === 'string' ? meta : safeJson(meta);
    const line = `${prefix} ${message} ${str}`;
    if (level === 'error') console.error(line);
    else if (level === 'warn') console.warn(line);
    else console.log(line);
  } else {
    const line = `${prefix} ${message}`;
    if (level === 'error') console.error(line);
    else if (level === 'warn') console.warn(line);
    else console.log(line);
  }
}

function safeJson(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export interface Logger {
  debug(message: string, meta?: unknown): void;
  info(message: string, meta?: unknown): void;
  warn(message: string, meta?: unknown): void;
  error(message: string, meta?: unknown): void;
  child(scope: string): Logger;
}

export function createLogger(scope: string): Logger {
  const minLevel: Level = process.env.LOG_LEVEL === 'debug' ? 'debug' : 'info';
  const log = (level: Level, message: string, meta?: unknown) => {
    if (LEVEL_ORDER[level] < LEVEL_ORDER[minLevel]) return;
    emit(level, scope, message, meta);
  };
  return {
    debug: (m, meta) => log('debug', m, meta),
    info: (m, meta) => log('info', m, meta),
    warn: (m, meta) => log('warn', m, meta),
    error: (m, meta) => log('error', m, meta),
    child: (childScope) => createLogger(`${scope}:${childScope}`),
  };
}

export const logger = createLogger('gitpulse');

// Never log GitHub tokens / secrets — redact common sensitive keys.
export function redact(value: unknown): unknown {
  if (!value || typeof value !== 'object') return value;
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (/token|secret|password|authorization|cookie/i.test(key)) {
      out[key] = '[REDACTED]';
    } else if (typeof val === 'object') {
      out[key] = redact(val);
    } else {
      out[key] = val;
    }
  }
  return out;
}