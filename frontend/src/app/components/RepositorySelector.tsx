import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, GitFork, Star, AlertCircle, Lock, Globe, CheckCircle,
  Loader2, ArrowRight, Activity, LogOut, RefreshCw,
} from 'lucide-react';
import { useAuth, Repository } from '../context/AuthContext';

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572A5',
  Go: '#00ADD8',
  Rust: '#dea584',
  Shell: '#89e051',
  Java: '#b07219',
  Ruby: '#701516',
  CSS: '#563d7c',
};

function RepoCard({ repo, onSelect }: { repo: Repository; onSelect: () => void }) {
  const langColor = repo.language ? LANGUAGE_COLORS[repo.language] ?? '#8b5cf6' : '#9ca3af';
  const updatedDate = new Date(repo.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <button
      onClick={onSelect}
      className="group w-full text-left rounded-xl border border-white/[0.06] bg-[rgba(20,20,30,0.5)] hover:border-[#2ea043]/40 hover:bg-[rgba(20,20,30,0.8)] transition-all p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            {repo.private ? (
              <Lock className="size-3.5 text-[#9ca3af] flex-shrink-0" />
            ) : (
              <Globe className="size-3.5 text-[#9ca3af] flex-shrink-0" />
            )}
            <span className="text-[#e8e8f0] truncate">{repo.name}</span>
            {repo.private && (
              <span className="text-xs px-1.5 py-0.5 rounded border border-white/10 text-[#9ca3af]/60 flex-shrink-0">
                Private
              </span>
            )}
          </div>
          {repo.description && (
            <p className="text-sm text-[#9ca3af] line-clamp-2 mb-3">{repo.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-4 text-xs text-[#9ca3af]">
            {repo.language && (
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: langColor }} />
                {repo.language}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Star className="size-3" />
              {repo.stargazers_count.toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <GitFork className="size-3" />
              {repo.forks_count.toLocaleString()}
            </span>
            {repo.open_issues_count > 0 && (
              <span className="flex items-center gap-1">
                <AlertCircle className="size-3" />
                {repo.open_issues_count}
              </span>
            )}
            <span>Updated {updatedDate}</span>
          </div>
        </div>
        <div className="flex-shrink-0 flex items-center gap-2 mt-0.5">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs text-[#2ea043]">
            Select
            <ArrowRight className="size-3.5" />
          </div>
        </div>
      </div>
    </button>
  );
}

export function RepositorySelector() {
  const navigate = useNavigate();
  const { user, repositories, fetchRepositories, reposLoading, selectRepository, logout } = useAuth();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'public' | 'private'>('all');

  useEffect(() => {
    fetchRepositories();
  }, []);

  const filtered = repositories.filter(repo => {
    const matchesSearch = repo.name.toLowerCase().includes(search.toLowerCase()) ||
      (repo.description?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchesFilter = filter === 'all' || (filter === 'public' ? !repo.private : repo.private);
    return matchesSearch && matchesFilter;
  });

  const handleSelect = (repo: Repository) => {
    selectRepository(repo);
    navigate('/dashboard');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e8e8f0]">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[#2ea043]/[0.04] rounded-full blur-[100px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 border-b border-white/[0.06] bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-7 rounded-lg bg-gradient-to-br from-[#2ea043] to-[#06b6d4] flex items-center justify-center">
              <Activity className="size-4 text-white" />
            </div>
            <span className="text-sm text-[#e8e8f0]">GitPulse AI</span>
          </div>
          {user && (
            <div className="flex items-center gap-3">
              <img
                src={user.avatar_url}
                alt={user.name}
                className="size-7 rounded-full border border-white/10"
              />
              <span className="text-sm text-[#9ca3af]">{user.login}</span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-xs text-[#9ca3af] hover:text-[#e8e8f0] transition-colors pl-3 border-l border-white/10"
              >
                <LogOut className="size-3.5" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="size-5 text-[#2ea043]" />
            <span className="text-sm text-[#2ea043]">GitHub connected successfully</span>
          </div>
          <h1 className="text-3xl text-[#e8e8f0] mb-2">Select a repository</h1>
          <p className="text-[#9ca3af]">
            Choose the repository you'd like to analyze. You can switch repositories anytime from the dashboard.
          </p>
        </div>

        {/* Search & filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#9ca3af]" />
            <input
              type="text"
              placeholder="Search repositories..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-[#e8e8f0] placeholder:text-[#9ca3af]/50 focus:outline-none focus:border-[#2ea043]/40 focus:bg-white/[0.05] transition-all text-sm"
            />
          </div>
          <div className="flex rounded-xl border border-white/[0.08] overflow-hidden">
            {(['all', 'public', 'private'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2.5 text-sm capitalize transition-colors ${
                  filter === f
                    ? 'bg-white/[0.06] text-[#e8e8f0]'
                    : 'text-[#9ca3af] hover:text-[#e8e8f0] hover:bg-white/[0.02]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <button
            onClick={fetchRepositories}
            disabled={reposLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/[0.08] text-[#9ca3af] hover:text-[#e8e8f0] hover:border-white/20 transition-all text-sm"
          >
            <RefreshCw className={`size-4 ${reposLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Repo list */}
        {reposLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="size-8 text-[#2ea043] animate-spin" />
            <p className="text-sm text-[#9ca3af]">Fetching your repositories from GitHub...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Search className="size-10 text-[#9ca3af]/30 mx-auto mb-4" />
            <p className="text-[#9ca3af]">No repositories found</p>
            <p className="text-sm text-[#9ca3af]/50 mt-1">Try adjusting your search or filter</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-[#9ca3af]/50 mb-2">
              {filtered.length} repositor{filtered.length === 1 ? 'y' : 'ies'} found
            </p>
            {filtered.map(repo => (
              <RepoCard key={repo.id} repo={repo} onSelect={() => handleSelect(repo)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
