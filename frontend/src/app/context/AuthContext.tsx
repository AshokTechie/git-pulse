import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  fetchRepositories as apiFetchRepos,
  authDemoLogin,
  authEmailLogin,
  authEmailRegister,
  authMe,
  authLogout,
} from '../../lib/api';

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
  isDemoMode: boolean;
}

interface AuthContextType extends AuthState {
  login: () => Promise<void>;
  loginDemo: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name?: string) => Promise<void>;
  logout: () => void;
  selectRepository: (repo: Repository) => void;
  repositories: Repository[];
  fetchRepositories: () => Promise<void>;
  reposLoading: boolean;
  toggleDemoMode: () => void;
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
  email: 'octocat@github.com',
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
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    selectedRepo: null,
    isAuthenticated: false,
    isLoading: true,
    isDemoMode: true,
  });
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [reposLoading, setReposLoading] = useState(false);

  useEffect(() => {
    async function initAuth() {
      try {
        const me = await authMe().catch(() => null);
        if (me && me.sessionValid && me.user) {
          const user: GitHubUser = {
            id: me.user.githubId || 101,
            login: me.user.githubLogin || me.user.name || 'user',
            name: me.user.name || me.user.githubLogin || 'User',
            avatar_url: me.user.avatarUrl || MOCK_USER.avatar_url,
            bio: 'GitPulse Connected Developer',
            public_repos: 12,
            followers: 120,
            following: 15,
            email: me.user.email,
          };
          setState((s) => ({
            ...s,
            user,
            isAuthenticated: true,
            isLoading: false,
            isDemoMode: false,
          }));
          return;
        }
      } catch {
        // Fallback to local storage
      }

      const stored = localStorage.getItem('gitpulse_auth');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setState({ ...parsed, isLoading: false });
        } catch {
          setState((s) => ({ ...s, isLoading: false }));
        }
      } else {
        setState((s) => ({ ...s, isLoading: false }));
      }
    }

    initAuth();
  }, []);

  const login = async () => {
    setState((s) => ({ ...s, isLoading: true }));
    try {
      window.location.href = '/api/auth/github';
    } catch {
      await loginDemo();
    }
  };

  const loginDemo = async () => {
    setState((s) => ({ ...s, isLoading: true }));
    try {
      await authDemoLogin().catch(() => null);
    } catch {
      // Ignore if offline
    }
    const token = 'ghp_demo_token_' + Math.random().toString(36).slice(2);
    const newState: AuthState = {
      user: MOCK_USER,
      token,
      selectedRepo: null,
      isAuthenticated: true,
      isLoading: false,
      isDemoMode: true,
    };
    setState(newState);
    localStorage.setItem('gitpulse_auth', JSON.stringify(newState));
  };

  const loginWithEmail = async (email: string, pass: string) => {
    setState((s) => ({ ...s, isLoading: true }));
    const res = await authEmailLogin(email, pass);
    const user: GitHubUser = {
      id: 999,
      login: res.user?.login || email.split('@')[0],
      name: res.user?.name || email.split('@')[0],
      avatar_url: MOCK_USER.avatar_url,
      bio: 'GitPulse Registered Engineer',
      public_repos: 8,
      followers: 12,
      following: 5,
      email: res.user?.email || email,
    };
    const newState: AuthState = {
      user,
      token: 'session_token',
      selectedRepo: null,
      isAuthenticated: true,
      isLoading: false,
      isDemoMode: false,
    };
    setState(newState);
    localStorage.setItem('gitpulse_auth', JSON.stringify(newState));
  };

  const registerWithEmail = async (email: string, pass: string, name?: string) => {
    setState((s) => ({ ...s, isLoading: true }));
    const res = await authEmailRegister(email, pass, name);
    const user: GitHubUser = {
      id: 999,
      login: res.user?.login || email.split('@')[0],
      name: res.user?.name || name || email.split('@')[0],
      avatar_url: MOCK_USER.avatar_url,
      bio: 'GitPulse Registered Engineer',
      public_repos: 8,
      followers: 12,
      following: 5,
      email: res.user?.email || email,
    };
    const newState: AuthState = {
      user,
      token: 'session_token',
      selectedRepo: null,
      isAuthenticated: true,
      isLoading: false,
      isDemoMode: false,
    };
    setState(newState);
    localStorage.setItem('gitpulse_auth', JSON.stringify(newState));
  };

  const logout = () => {
    authLogout().catch(() => null);
    const reset: AuthState = {
      user: null,
      token: null,
      selectedRepo: null,
      isAuthenticated: false,
      isLoading: false,
      isDemoMode: false,
    };
    setState(reset);
    setRepositories([]);
    localStorage.removeItem('gitpulse_auth');
  };

  const selectRepository = (repo: Repository) => {
    setState((s) => {
      const next = { ...s, selectedRepo: repo };
      localStorage.setItem('gitpulse_auth', JSON.stringify(next));
      return next;
    });
  };

  const toggleDemoMode = () => {
    setState((s) => {
      const next = { ...s, isDemoMode: !s.isDemoMode };
      localStorage.setItem('gitpulse_auth', JSON.stringify(next));
      return next;
    });
  };

  const fetchRepositories = async () => {
    setReposLoading(true);
    try {
      const serverRepos = await apiFetchRepos();
      if (serverRepos && serverRepos.length > 0) {
        setRepositories(serverRepos as unknown as Repository[]);
        setReposLoading(false);
        return;
      }
    } catch {
      // Fallback
    }
    await new Promise((res) => setTimeout(res, 400));
    setRepositories(MOCK_REPOS);
    setReposLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        loginDemo,
        loginWithEmail,
        registerWithEmail,
        logout,
        selectRepository,
        repositories,
        fetchRepositories,
        reposLoading,
        toggleDemoMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
