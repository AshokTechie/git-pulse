import { config } from '../config.js';
import { decryptSecret } from '../lib/crypto.js';
import { prisma } from '../db/client.js';
import { GitHubClient, type GhUser } from '../lib/githubClient.js';

const MAX_PAGES = 60; // 60 * 100 = 6000 items cap per resource.

/**
 * Factory for GitHubClient instances bound to a GitHubAccount's decrypted token.
 */
export async function githubClientForAccount(accountId: string): Promise<GitHubClient> {
  const account = await prisma.gitHubAccount.findUnique({ where: { id: accountId } });
  if (!account) throw new Error('GitHub account not found');
  const token = decryptSecret(account.accessTokenEncrypted);
  return new GitHubClient(token);
}

export async function githubClientForUser(userId: string): Promise<GitHubClient> {
  const account = await prisma.gitHubAccount.findFirst({ where: { userId } });
  if (!account) throw new Error('No GitHub account linked to user');
  return githubClientForAccount(account.id);
}

export function getInitialHistoryStart(): Date {
  const days = 365;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

/** OAuth helpers ---------------------------------------------------------- */

export function buildAuthorizeUrl(state: string): string {
  const query = new URLSearchParams({
    client_id: config.github.clientId,
    redirect_uri: config.github.callbackUrl,
    scope: config.github.scopes,
    state,
    allow_signup: 'false',
  });
  return `https://github.com/login/oauth/authorize?${query.toString()}`;
}

export async function exchangeCodeForToken(code: string): Promise<{
  accessToken: string;
  tokenType: string;
  scope: string;
}> {
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'gitpulse-ai/1.0',
    },
    body: JSON.stringify({
      client_id: config.github.clientId,
      client_secret: config.github.clientSecret,
      code,
      redirect_uri: config.github.callbackUrl,
    }),
  });

  if (!response.ok) {
    throw new Error(`GitHub token exchange failed with status ${response.status}`);
  }
  const body = (await response.json()) as {
    access_token?: string;
    token_type?: string;
    scope?: string;
    error?: string;
    error_description?: string;
  };
  if (!body.access_token) {
    throw new Error(`GitHub token exchange error: ${body.error} ${body.error_description ?? ''}`.trim());
  }
  return {
    accessToken: body.access_token,
    tokenType: body.token_type ?? 'bearer',
    scope: body.scope ?? '',
  };
}

export async function fetchGitHubUser(client: GitHubClient): Promise<GhUser> {
  return client.request<GhUser>('/user');
}

export async function fetchGitHubUserEmails(client: GitHubClient): Promise<string[]> {
  const emails = await client.request<{ email: string }[]>('/user/emails');
  return emails.filter((e) => e.email).map((e) => e.email);
}

/** Repository / org discovery --------------------------------------------- */

export async function fetchRepositories(client: GitHubClient): Promise<import('../lib/githubClient.js').GhRepository[]> {
  return client.paginate<import('../lib/githubClient.js').GhRepository>(
    '/user/repos?sort=updated&affiliation=owner,collaborator,organization_member&visibility=all',
    { maxPages: MAX_PAGES, perPage: 100 },
  );
}

export async function fetchOrganization(client: GitHubClient, name: string) {
  return client.request<{ id: number; login: string; name: string | null; description: string | null; avatar_url: string | null; html_url: string }>(
    `/orgs/${name}`,
  );
}

/** Repository details ------------------------------------------------------ */

export async function fetchRepositoryDetail(client: GitHubClient, owner: string, repo: string) {
  return client.request<import('../lib/githubClient.js').GhRepository>(
    `/repos/${owner}/${repo}`,
    {
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    },
  );
}

export async function fetchLanguages(client: GitHubClient, owner: string, repo: string) {
  try {
    return await client.request<Record<string, number>>(`/repos/${owner}/${repo}/languages`);
  } catch {
    return {};
  }
}

export async function fetchContributors(client: GitHubClient, owner: string, repo: string) {
  return client.paginate<import('../lib/githubClient.js').GhContributor>(
    `/repos/${owner}/${repo}/contributors?anon=false`,
    { maxPages: MAX_PAGES, perPage: 100 },
  );
}

export async function fetchCommits(
  client: GitHubClient,
  owner: string,
  repo: string,
  opts: { since?: Date; maxPages?: number } = {},
) {
  let url = `/repos/${owner}/${repo}/commits`;
  const params: string[] = [];
  if (opts.since) params.push(`since=${opts.since.toISOString()}`);
  if (params.length) url += `?${params.join('&')}`;
  return client.paginate<import('../lib/githubClient.js').GhCommit>(url, {
    maxPages: opts.maxPages ?? MAX_PAGES,
    perPage: 100,
  });
}

export async function fetchCommitDetail(client: GitHubClient, owner: string, repo: string, sha: string) {
  return client.request<import('../lib/githubClient.js').GhCommit>(`/repos/${owner}/${repo}/commits/${sha}`);
}

export async function fetchPullRequests(
  client: GitHubClient,
  owner: string,
  repo: string,
  opts: { state?: 'open' | 'closed' | 'all'; since?: Date; maxPages?: number } = {},
) {
  let url = `/repos/${owner}/${repo}/pulls`;
  const params: string[] = [];
  if (opts.state) params.push(`state=${opts.state}`);
  if (opts.since) params.push(`since=${opts.since.toISOString()}`);
  if (params.length) url += `?${params.join('&')}`;
  return client.paginate<import('../lib/githubClient.js').GhPullRequest>(url, {
    maxPages: opts.maxPages ?? MAX_PAGES,
    perPage: 100,
  });
}

export async function fetchPullRequestReviews(client: GitHubClient, owner: string, repo: string, prNumber: number) {
  return client.paginate<import('../lib/githubClient.js').GhReview>(
    `/repos/${owner}/${repo}/pulls/${prNumber}/reviews`,
    { maxPages: 10, perPage: 100 },
  );
}

export async function fetchPullRequestComments(client: GitHubClient, owner: string, repo: string, prNumber: number) {
  return client.paginate<import('../lib/githubClient.js').GhIssueComment>(
    `/repos/${owner}/${repo}/issues/${prNumber}/comments`,
    { maxPages: 10, perPage: 100 },
  );
}

export async function fetchIssues(
  client: GitHubClient,
  owner: string,
  repo: string,
  opts: { state?: 'open' | 'closed' | 'all'; since?: Date; maxPages?: number } = {},
) {
  let url = `/repos/${owner}/${repo}/issues`;
  const params: string[] = [];
  if (opts.state) params.push(`state=${opts.state}`);
  if (opts.since) params.push(`since=${opts.since.toISOString()}`);
  if (params.length) url += `?${params.join('&')}`;
  return client.paginate<import('../lib/githubClient.js').GhIssue>(url, {
    maxPages: opts.maxPages ?? MAX_PAGES,
    perPage: 100,
  });
}

export async function fetchIssueComments(client: GitHubClient, owner: string, repo: string, issueNumber: number) {
  return client.paginate<import('../lib/githubClient.js').GhIssueComment>(
    `/repos/${owner}/${repo}/issues/${issueNumber}/comments`,
    { maxPages: 15, perPage: 100 },
  );
}

export async function fetchBranches(client: GitHubClient, owner: string, repo: string) {
  return client.paginate<import('../lib/githubClient.js').GhBranch>(
    `/repos/${owner}/${repo}/branches?per_page=100`,
    { maxPages: 10, perPage: 100 },
  );
}

export async function fetchReleases(client: GitHubClient, owner: string, repo: string) {
  return client.paginate<import('../lib/githubClient.js').GhRelease | {
    id: number;
    name: string | null;
    tag_name: string;
    published_at: string | null;
    created_at: string;
  }>(`/repos/${owner}/${repo}/releases?per_page=100`, { maxPages: 10, perPage: 100 });
}

export async function fetchDeployments(client: GitHubClient, owner: string, repo: string) {
  return client.paginate<import('../lib/githubClient.js').GhDeployment>(
    `/repos/${owner}/${repo}/deployments?per_page=100`,
    { maxPages: 10, perPage: 100 },
  );
}

export async function fetchWorkflowRuns(client: GitHubClient, owner: string, repo: string) {
  try {
    const data = await client.request<{ workflow_runs: import('../lib/githubClient.js').GhWorkflowRun[] }>(
      `/repos/${owner}/${repo}/actions/runs?per_page=100`,
    );
    return data.workflow_runs ?? [];
  } catch (error) {
    return [];
  }
}

export async function fetchWorkflowRunJobs(client: GitHubClient, owner: string, repo: string, runId: number) {
  try {
    const data = await client.request<{ jobs: { status: string; conclusion: string | null }[] }>(
      `/repos/${owner}/${repo}/actions/runs/${runId}/jobs?per_page=100`,
    );
    return data.jobs ?? [];
  } catch {
    return [];
  }
}

/** Security ---------------------------------------------------------------- */

export async function fetchDependabotAlerts(client: GitHubClient, owner: string, repo: string) {
  try {
    return await client.paginate<import('../lib/githubClient.js').GhAlert>(
      `/repos/${owner}/${repo}/dependabot/alerts?per_page=100`,
      {
        maxPages: 10,
        perPage: 100,
      },
    );
  } catch {
    return [];
  }
}

export async function fetchCodeScanningAlerts(client: GitHubClient, owner: string, repo: string) {
  try {
    const data = await client.request<import('../lib/githubClient.js').GhAlert[]>(
      `/repos/${owner}/${repo}/code-scanning/alerts?per_page=100`,
      { headers: { Accept: 'application/vnd.github+json' } },
    );
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function fetchSecretScanningAlerts(client: GitHubClient, owner: string, repo: string) {
  try {
    const data = await client.request<import('../lib/githubClient.js').GhAlert[]>(
      `/repos/${owner}/${repo}/secret-scanning/alerts?per_page=100`,
      { headers: { Accept: 'application/vnd.github+json' } },
    );
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/**
 * Fetches the git tree (files + sizes) for the default branch of a repository.
 * Public repos use the unauthenticated raw URL; private repos use the REST tree API.
 */
export async function fetchRepositoryTree(client: GitHubClient, owner: string, repo: string, isPrivate: boolean, branch: string) {
  try {
    if (!isPrivate) {
      const response = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/`, {
        headers: { 'User-Agent': 'gitpulse-ai/1.0' },
      });
      if (!response.ok) throw new Error(`raw fetch ${response.status}`);
    }
  } catch {
    // fall through to REST tree API
  }

  try {
    const ref = await client.request<{ object?: { sha?: string; tree?: import('../lib/githubClient.js').GhTreeEntry[] } }>(
      `/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
      { headers: { Accept: 'application/vnd.github+json' } },
    );
    return ref?.object?.tree ?? [];
  } catch {
    return [];
  }
}