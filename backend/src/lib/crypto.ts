import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { config } from '../config.js';

function keyBytes(): Buffer {
  return createHash('sha256').update(config.sessionSecret).digest();
}

/**
 * Encrypt a secret value with AES-256-GCM using a key derived from SESSION_SECRET.
 * Format: `gcm:<iv>:<authTag>:<cipherText>` (all base64url).
 */
export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', keyBytes(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `gcm:${iv.toString('base64url')}:${tag.toString('base64url')}:${encrypted.toString('base64url')}`;
}

export function decryptSecret(payload: string): string {
  const [scheme, ivB64, tagB64, dataB64] = payload.split(':');
  if (scheme !== 'gcm' || !ivB64 || !tagB64 || !dataB64) {
    throw new Error('Unsupported encrypted payload format');
  }
  const decipher = createDecipheriv('aes-256-gcm', keyBytes(), Buffer.from(ivB64, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64url'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataB64, 'base64url')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function secureCompare(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

/** Generate a cryptographically random session token. */
export function generateSessionToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = createHash('sha256').update(`${salt}:${password}`).digest('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, expectedHash] = stored.split(':');
  if (!salt || !expectedHash) return false;
  const hash = createHash('sha256').update(`${salt}:${password}`).digest('hex');
  return secureCompare(hash, expectedHash);
}