import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { createLogger } from './logger.js';

const logger = createLogger('github-client');

export class GitHubRateLimitError extends Error {
  resetAt: number;
  constructor(message: string, resetAt: number) {
    super(message);
    this.name = 'GitHubRateLimitError';
    this.resetAt = resetAt;
  }
}

export class GitHubApiError extends Error {
  status: number;
  detail?: string;
  constructor(message: string, status: number, detail?: string) {
    super(message);
    this.name = 'GitHubApiError';
    this.status = status;
    this.detail = detail;
  }
}

interface PaginateOptions {
  /** Maximum number of pages to fetch. */
  maxPages?: number;
  perPage?: number;
  /** If provided, stops paginating once items older than `since` are seen. */
  since?: Date;
  /** Field index inspected for the `since` cut-off (e.g. `created_at`). */
  sinceField?: string;
}

export class GitHubClient {
  private http: AxiosInstance;
  private lastResponseLink = '';

  constructor(private accessToken: string) {
    this.http = axios.create({
      baseURL: 'https://api.github.com',
      timeout: 30000,
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'gitpulse-ai/1.0',
      },
    });
  }

  /**
   * Call a GitHub REST endpoint.
   * Throws GitHubRateLimitError when the rate limit is exhausted.
   * Throws GitHubApiError for any failing response.
   */
  async request<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.http.request<T>({ url, ...config });
      this.observeRateLimit(response.headers);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.observeRateLimit(error.response?.headers);
        const status = error.response?.status ?? 0;
        const headers = (error.response?.headers ?? {}) as Record<string, unknown>;
        const resetAt = Number.parseInt(String(headers['x-ratelimit-reset'] ?? '0'), 10) * 1000;
        const remaining = Number.parseInt(String(headers['x-ratelimit-remaining'] ?? '-1'), 10);
        if (status === 403 && remaining <= 0) {
          throw new GitHubRateLimitError('GitHub API rate limit exceeded', resetAt || Date.now() + 60_000);
        }
        const detail = (error.response?.data as { message?: string } | undefined)?.message;
        throw new GitHubApiError(`GitHub API ${status}`, status, detail);
      }
      throw error;
    }
  }

  /** REST pagination driven by the `Link` header. */
  async paginate<T>(
    url: string,
    options: PaginateOptions = {},
  ): Promise<T[]> {
    const perPage = options.perPage ?? 100;
    const maxPages = options.maxPages ?? Infinity;
    const since = options.since;
    const out: T[] = [];
    let page = 0;
    let cursor = url.includes('?') ? `${url}&per_page=${perPage}` : `${url}?per_page=${perPage}`;

    while (cursor && page < maxPages) {
      logger.debug('paginate', { url, page: page + 1 });
      const data = await this.request<T[]>(cursor, {
        headers: {
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      });
      out.push(...data);
      // Early exit when the requested `since` cut-off is reached.
      if (since && options.sinceField && data.length > 0) {
        const newest = data[data.length - 1] as Record<string, unknown>;
        if (newest[options.sinceField]) {
          const itemDate = new Date(newest[options.sinceField] as string);
          if (itemDate.getTime() < since.getTime()) break;
        }
      }
      const nextLink = parseNextLink(this.lastResponseLink);
      if (!nextLink) break;
      cursor = nextLink;
      page += 1;
    }
    return out;
  }

  private observeRateLimit(headers: unknown): void {
    if (!headers || typeof headers !== 'object') return;
    const h = headers as Record<string, unknown>;
    this.lastResponseLink = String(h['link'] ?? '');
    const remaining = Number.parseInt(String(h['x-ratelimit-remaining'] ?? '-1'), 10);
    if (remaining === 0) {
      const resetAt = Number.parseInt(String(h['x-ratelimit-reset'] ?? '0'), 10) * 1000;
      throw new GitHubRateLimitError('GitHub API rate limit exhausted', resetAt || Date.now() + 60_000);
    }
    if (remaining > 0 && remaining <= 5) {
      logger.warn(`GitHub rate limit nearly exhausted (remaining=${remaining})`);
    }
  }
}

function parseNextLink(linkHeader: string): string | null {
  if (!linkHeader) return null;
  const match = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
  if (!match) return null;
  const next = match[1];
  if (!next.startsWith('https://api.github.com/')) return null;
  return next;
}

// ---------------------------------------------------------------------------
// GitHub API DTO shapes (snake_case as returned by the REST API)
// ---------------------------------------------------------------------------

export interface GhUser {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  bio: string | null;
  company: string | null;
  location: string | null;
  blog: string | null;
}

export interface GhRepository {
  id: number;
  name: string;
  full_name: string;
  owner: { login: string; type?: string };
  organization?: { login: string; id: number } | null;
  description: string | null;
  homepage: string | null;
  language: string | null;
  private: boolean;
  fork: boolean;
  archived: boolean;
  template: boolean;
  default_branch: string;
  license?: { spdx_id: string | null } | null;
  topics: string[];
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  open_issues_count: number;
  pushed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  size: number;
}

export interface GhLanguages {
  [language: string]: number;
}

export interface GhCommit {
  sha: string;
  commit: {
    message: string;
    author: { name: string | null; email: string | null; date: string } | null;
    committer: { name: string | null; email: string | null; date: string } | null;
  };
  author: { login: string | null; id: number | null } | null;
  committer: { login: string | null; id: number | null } | null;
  parents: unknown[];
  stats?: { additions: number; deletions: number; total: number };
  files?: { filename: string; status: string; additions: number; deletions: number }[];
}

export interface GhPullRequest {
  id: number;
  number: number;
  title: string;
  body: string | null;
  html_url: string;
  state: 'open' | 'closed';
  draft: boolean;
  user: { login: string; id: number } | null;
  base: { ref: string; sha: string };
  head: { ref: string; sha: string };
  labels: { name: string }[];
  assignees: { login: string }[] | null;
  additions: number;
  deletions: number;
  changed_files: number;
  review_comments: number;
  comments: number;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  merged_at: string | null;
  merged_by: { login: string; id: number } | null;
  merge_commit_sha: string | null;
  author_association: string;
}

export interface GhReview {
  id: number;
  user: { login: string; id: number } | null;
  state: string;
  body: string | null;
  commit_id: string | null;
  submitted_at: string | null;
  author_association: string;
}

export interface GhIssue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  html_url: string;
  state: 'open' | 'closed';
  user: { login: string; id: number } | null;
  labels: { name: string }[];
  assignees: { login: string }[] | null;
  comments: number;
  pull_request?: { url: string } | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  author_association: string;
}

export interface GhIssueComment {
  id: number;
  body: string | null;
  user: { login: string; id: number } | null;
  html_url: string;
  created_at: string;
  updated_at: string;
}

export interface GhBranch {
  name: string;
  commit: { sha: string };
  protected?: boolean;
}

export interface GhDeployment {
  id: number;
  ref: string;
  sha?: string;
  task: string | null;
  environment: string | null;
  description: string | null;
  state: string | null;
  creator: { login: string; id: number } | null;
  created_at: string;
}

export interface GhWorkflowRun {
  id: number;
  name: string | null;
  workflow_id: number;
  head_branch: string | null;
  head_sha: string;
  event: string | null;
  status: string;
  conclusion: string | null;
  run_number: number;
  created_at: string;
  updated_at: string;
}

export interface GhAlert {
  id?: number;
  number?: number;
  state: string;
  severity: string | null;
  html_url?: string;
  security_advisory?: {
    summary: string | null;
    severity: string;
    ghsa_id: string | null;
    cve_id: string | null;
  } | null;
  dependency?: {
    package?: { name: string | null; ecosystem: string | null };
    manifest_path?: string;
  } | null;
  dismissed_reason?: string | null;
  dismissed_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  rule?: { description: string | null } | null;
  most_recent_instance?: { ref: string | null } | null;
}

export interface GhContributor {
  login: string;
  id: number;
  contributions: number;
  avatar_url?: string | null;
  name?: string | null;
  type?: string;
}

export interface GhRelease {
  id: number;
  name: string | null;
  tag_name: string;
  published_at: string | null;
  created_at: string;
}

export interface GhTreeEntry {
  path: string;
  mode: string;
  type: string;
  size?: number;
}