import { prisma } from '../db/client.js';
import { encryptSecret, generateSessionToken, hashToken } from '../lib/crypto.js';
import { createLogger } from '../lib/logger.js';
import { exchangeCodeForToken, fetchGitHubUser, githubClientForAccount } from './github.service.js';
import { GitHubClient } from '../lib/githubClient.js';

const logger = createLogger('auth-service');

const SESSION_TTL_DAYS = 30;

export async function completeOAuthCallback(code: string): Promise<{ sessionToken: string; user: { id: string; githubId?: number | null; login?: string | null } }> {
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
  return { sessionToken, user: { id: user.id, githubId: user.githubId, login: user.githubLogin } };
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
 * Development-only login: creates or retrieves a User with a GitHubAccount.
 */
export async function createDevSession(login: string): Promise<{ sessionToken: string; userId: string }> {
  let user = await prisma.user.findFirst({
    where: {
      OR: [{ githubLogin: login }, { email: `${login}@github.com` }],
    },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        githubLogin: login,
        name: 'The Octocat',
        email: `${login}@github.com`,
        avatarUrl: 'https://avatars.githubusercontent.com/u/583231?v=4',
      },
    });
  }

  const exists = await prisma.gitHubAccount.findFirst({ where: { userId: user.id } });
  if (!exists) {
    await prisma.gitHubAccount.create({
      data: {
        userId: user.id,
        githubId: user.githubId || 583231,
        login: user.githubLogin || login,
        name: user.name || 'The Octocat',
        accessTokenEncrypted: encryptSecret('dev-no-op'),
        tokenType: 'dev',
        scope: 'dev',
      },
    });
  }

  const sessionToken = await createSession(user.id);
  logger.info('dev session created', { login, userId: user.id });
  return { sessionToken, userId: user.id };
}

export { githubClientForAccount };