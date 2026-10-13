import { prisma } from '../db/client.js';
import { encryptSecret, generateSessionToken, hashToken } from '../lib/crypto.js';
import { createLogger } from '../lib/logger.js';
import { exchangeCodeForToken, fetchGitHubUser, githubClientForAccount } from './github.service.js';
import { GitHubClient } from '../lib/githubClient.js';

const logger = createLogger('auth-service');

const SESSION_TTL_DAYS = 30;

export async function completeOAuthCallback(code: string): Promise<{ sessionToken: string; user: { id: string; githubId: number; login: string } }> {
  const { accessToken } = await exchangeCodeForToken(code);
  const client = new GitHubClient(accessToken);
  const ghUser = await fetchGitHubUser(client);

  const user = await prisma.user.upsert({
    where: { githubId: ghUser.id },
    update: {
      githubLogin: ghUser.login,
      name: ghUser.name,
      email: ghUser.email,
      avatarUrl: ghUser.avatar_url,
    },
    create: {
      githubId: ghUser.id,
      githubLogin: ghUser.login,
      name: ghUser.name,
      email: ghUser.email,
      avatarUrl: ghUser.avatar_url,
    },
  });

  await prisma.gitHubAccount.upsert({
    where: { githubId: ghUser.id },
    update: {
      userId: user.id,
      login: ghUser.login,
      name: ghUser.name,
      email: ghUser.email,
      avatarUrl: ghUser.avatar_url,
      accessTokenEncrypted: encryptSecret(accessToken),
      tokenType: 'bearer',
      scope: 'read:user user:email repo read:org',
    },
    create: {
      userId: user.id,
      githubId: ghUser.id,
      login: ghUser.login,
      name: ghUser.name,
      email: ghUser.email,
      avatarUrl: ghUser.avatar_url,
      accessTokenEncrypted: encryptSecret(accessToken),
      tokenType: 'bearer',
      scope: 'read:user user:email repo read:org',
    },
  });

  const sessionToken = await createSession(user.id);
  return { sessionToken, user: { id: user.id, githubId: user.githubId, login: user.login } };
}

export async function createSession(userId: string): Promise<string> {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt,
    },
  });
  return token;
}

export async function destroySession(token: string): Promise<void> {
  await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
}

export async function getSessionUser(token: string | undefined) {
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { include: { accounts: true } } },
  });
  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }
  return {
    session,
    user: session.user,
    account: session.user.accounts[0] ?? null,
  };
}

export async function getCurrentUser(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: { accounts: true },
  });
}

/**
 * Development-only login: creates a User with a GitHubAccount backed by an
 * empty token and kicks off seeding for the demo repositories. Enabled only
 * when ALLOW_DEV_AUTH=true.
 */
export async function createDevSession(login: string): Promise<{ sessionToken: string; userId: string }> {
  const ghId = 61781234; // deterministic pseudo id for dev accounts
  const user = await prisma.user.upsert({
    where: { githubId: ghId },
    update: { githubLogin: login, name: 'Dev Operator', avatarUrl: null },
    create: {
      githubId: ghId,
      githubLogin: login,
      name: 'Dev Operator',
      email: null,
      avatarUrl: null,
    },
  });

  const exists = await prisma.gitHubAccount.findUnique({ where: { githubId: ghId } });
  if (!exists) {
    await prisma.gitHubAccount.create({
      data: {
        userId: user.id,
        githubId: ghId,
        login,
        name: 'Dev Operator',
        accessTokenEncrypted: encryptSecret('dev-no-op'),
        tokenType: 'dev',
        scope: 'dev',
      },
    });
  } else {
    await prisma.gitHubAccount.update({
      where: { githubId: ghId },
      data: { userId: user.id, login },
    });
  }

  const sessionToken = await createSession(user.id);
  logger.info('dev session created', { login, userId: user.id });
  return { sessionToken, userId: user.id };
}

export { githubClientForAccount };