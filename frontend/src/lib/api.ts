let baseUrl = import.meta.env.VITE_API_URL;

if (!baseUrl) {
  // Development: Vite proxies /api/* to http://localhost:4000
  // In production, VITE_API_URL should be set to the deployed backend URL.
  baseUrl = '/api';
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const url = new URL(`${baseUrl}${path.startsWith('/') ? path : `/${path}`}`, window.location.origin);
  const headers = new Headers(init.headers ?? {});
  return fetch(url, {
    ...init,
    headers,
    credentials: 'include' as const,
  });
}

export async function jsonFetch<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await apiFetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  if (!response.ok) {
    const errData = await response.text().catch(() => 'Unknown error');
    throw new Error(`API ${response.status}: ${errData}`);
  }
  return response.json();
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export async function authMe(): Promise<{ user: any; account: any; sessionValid: boolean }> {
  return jsonFetch('/auth/me');
}

export async function authDemoLogin(): Promise<{ success: boolean; userId: string }> {
  return jsonFetch('/auth/demo', { method: 'POST' });
}

export async function authEmailLogin(email: string, password: string): Promise<{ success: boolean; user: any }> {
  return jsonFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function authEmailRegister(email: string, password: string, name?: string): Promise<{ success: boolean; user: any }> {
  return jsonFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  });
}

export async function authLogout(): Promise<{ success: boolean }> {
  return jsonFetch('/auth/logout', { method: 'POST' });
}

// ---------------------------------------------------------------------------
// Repositories
// ---------------------------------------------------------------------------

export interface RepositoryItem {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  updated_at: string;
  private: boolean;
  default_branch: string;
}

export async function fetchRepositories(): Promise<RepositoryItem[]> {
  return jsonFetch('/repositories');
}

export async function syncRepository(repoId: string | number): Promise<{ commits: number; prs: number; issues: number }> {
  return jsonFetch(`/repositories/${repoId}/sync`, { method: 'POST' });
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

export async function getDashboardData(range: string = '30d') {
  return jsonFetch(`/analytics/dashboard?range=${range}`);
}

export async function getRepositoriesOverview(range: string = '30d') {
  return jsonFetch(`/analytics/repositories?range=${range}`);
}

export async function getDevelopersOverview(range: string = '30d') {
  return jsonFetch(`/analytics/developers?range=${range}`);
}

export async function getTeamOverview(range: string = '30d') {
  return jsonFetch(`/analytics/team?range=${range}`);
}

export async function getAiOverview() {
  return jsonFetch('/ai');
}

export async function getContributionsData(repoId?: string, range: string = '1y') {
  const query = repoId ? `?repoId=${repoId}&range=${range}` : `?range=${range}`;
  return jsonFetch(`/analytics/contributions${query}`);
}

export async function getDoraMetrics(range: string = '30d') {
  return jsonFetch(`/analytics/dora?range=${range}`);
}

export async function getBurnoutMetrics(range: string = '30d') {
  return jsonFetch(`/analytics/burnout?range=${range}`);
}

export async function getPrRiskMetrics() {
  return jsonFetch('/analytics/pr-risk');
}

export function getExportUrl(format: 'json' | 'csv' = 'csv') {
  return `${baseUrl}/analytics/export?format=${format}`;
}

// ---------------------------------------------------------------------------
// AI Assistant / Copilot
// ---------------------------------------------------------------------------

export interface AiResponse {
  answer: string;
  reasons: string[];
  source: 'llm' | 'rule-based';
}

export async function aiQuery(question: string, repoFilter?: string): Promise<AiResponse> {
  return jsonFetch('/ai/query', {
    method: 'POST',
    body: JSON.stringify({ question, repoFilter }),
  });
}