import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface GitHubUser {
  id: number;
  login: string;
  name: string;
  avatar_url: string;
  bio: string;
  public_repos: number;
  followers: number;
  following: number;
  email: string | null;
}

export interface Repository {
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

interface AuthState {
  user: GitHubUser | null;
  token: string | null;
  selectedRepo: Repository | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: () => Promise<void>;
  logout: () => void;
  selectRepository: (repo: Repository) => void;
  repositories: Repository[];
  fetchRepositories: () => Promise<void>;
  reposLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const MOCK_USER: GitHubUser = {
  id: 1,
  login: 'octocat',
  name: 'The Octocat',
  avatar_url: 'https://avatars.githubusercontent.com/u/583231?v=4',
  bio: 'A mysterious developer from GitHub HQ',
  public_repos: 8,
  followers: 14204,
  following: 9,
  email: null,
};

const MOCK_REPOS: Repository[] = [
  {
    id: 1,
    name: 'gitpulse-core',
    full_name: 'octocat/gitpulse-core',
    description: 'Core analytics engine for GitPulse AI platform',
    language: 'TypeScript',
    stargazers_count: 1842,
    forks_count: 234,
    open_issues_count: 12,
    updated_at: '2026-05-29T14:32:00Z',
    private: false,
    default_branch: 'main',
  },
  {
    id: 2,
    name: 'react-dashboard',
    full_name: 'octocat/react-dashboard',
    description: 'A beautiful React dashboard component library',
    language: 'TypeScript',
    stargazers_count: 3201,
    forks_count: 581,
    open_issues_count: 5,
    updated_at: '2026-05-28T09:15:00Z',
    private: false,
    default_branch: 'main',
  },
  {
    id: 3,
    name: 'api-gateway',
    full_name: 'octocat/api-gateway',
    description: 'High-performance API gateway with rate limiting and auth',
    language: 'Go',
    stargazers_count: 892,
    forks_count: 101,
    open_issues_count: 23,
    updated_at: '2026-05-27T18:44:00Z',
    private: false,
    default_branch: 'main',
  },
  {
    id: 4,
    name: 'ml-pipeline',
    full_name: 'octocat/ml-pipeline',
    description: 'Automated ML training and deployment pipeline',
    language: 'Python',
    stargazers_count: 562,
    forks_count: 78,
    open_issues_count: 8,
    updated_at: '2026-05-26T11:20:00Z',
    private: false,
    default_branch: 'main',
  },
  {
    id: 5,
    name: 'design-system',
    full_name: 'octocat/design-system',
    description: 'Company-wide design system and component library',
    language: 'TypeScript',
    stargazers_count: 421,
    forks_count: 44,
    open_issues_count: 3,
    updated_at: '2026-05-25T16:00:00Z',
    private: true,
    default_branch: 'main',
  },
  {
    id: 6,
    name: 'devops-toolkit',
    full_name: 'octocat/devops-toolkit',
    description: 'Collection of DevOps scripts and automation tools',
    language: 'Shell',
    stargazers_count: 189,
    forks_count: 32,
    open_issues_count: 6,
    updated_at: '2026-05-24T08:30:00Z',
    private: false,
    default_branch: 'main',
  },
  {
    id: 7,
    name: 'auth-service',
    full_name: 'octocat/auth-service',
    description: 'OAuth 2.0 and JWT authentication microservice',
    language: 'Rust',
    stargazers_count: 731,
    forks_count: 88,
    open_issues_count: 14,
    updated_at: '2026-05-23T20:10:00Z',
    private: true,
    default_branch: 'main',
  },
  {
    id: 8,
    name: 'data-lake',
    full_name: 'octocat/data-lake',
    description: 'Scalable data lake infrastructure on AWS S3 and Glue',
    language: 'Python',
    stargazers_count: 294,
    forks_count: 41,
    open_issues_count: 9,
    updated_at: '2026-05-22T13:45:00Z',
    private: false,
    default_branch: 'main',
  },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    selectedRepo: null,
    isAuthenticated: false,
    isLoading: true,
  });
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [reposLoading, setReposLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('gitpulse_auth');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setState({ ...parsed, isLoading: false });
      } catch {
        setState(s => ({ ...s, isLoading: false }));
      }
    } else {
      setState(s => ({ ...s, isLoading: false }));
    }
  }, []);

  const login = async () => {
    setState(s => ({ ...s, isLoading: true }));
    // Simulate OAuth redirect + token exchange delay
    await new Promise(res => setTimeout(res, 1800));
    const token = 'ghp_mock_token_' + Math.random().toString(36).slice(2);
    const newState = {
      user: MOCK_USER,
      token,
      selectedRepo: null,
      isAuthenticated: true,
      isLoading: false,
    };
    setState(newState);
    localStorage.setItem('gitpulse_auth', JSON.stringify(newState));
  };

  const logout = () => {
    const reset = { user: null, token: null, selectedRepo: null, isAuthenticated: false, isLoading: false };
    setState(reset);
    setRepositories([]);
    localStorage.removeItem('gitpulse_auth');
  };

  const selectRepository = (repo: Repository) => {
    setState(s => {
      const next = { ...s, selectedRepo: repo };
      localStorage.setItem('gitpulse_auth', JSON.stringify(next));
      return next;
    });
  };

  const fetchRepositories = async () => {
    setReposLoading(true);
    // Simulate GitHub API call
    await new Promise(res => setTimeout(res, 1200));
    setRepositories(MOCK_REPOS);
    setReposLoading(false);
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, selectRepository, repositories, fetchRepositories, reposLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
