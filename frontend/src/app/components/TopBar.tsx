import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Settings, ChevronDown, Github, LogOut, SwitchCamera, Download, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getExportUrl } from '../../lib/api';

export function TopBar() {
  const { user, selectedRepo, logout, isDemoMode, toggleDemoMode } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSwitchRepo = () => {
    navigate('/select-repo');
  };

  const handleExport = () => {
    window.open(getExportUrl('csv'), '_blank');
  };

  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6 relative">
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search repositories, developers, insights..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Demo Mode Toggle Badge */}
        <button
          onClick={toggleDemoMode}
          className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
            isDemoMode
              ? 'bg-purple-accent/20 border-purple-accent/40 text-purple-accent hover:bg-purple-accent/30'
              : 'bg-github-green/20 border-github-green/40 text-github-green hover:bg-github-green/30'
          }`}
          title="Click to toggle between Demo Data and Live Telemetry"
        >
          <Sparkles className="size-3" />
          {isDemoMode ? 'Demo Telemetry' : 'Live Connected'}
        </button>

        {/* Export CSV Button */}
        <button
          onClick={handleExport}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-accent text-xs font-medium text-foreground transition-all"
          title="Export CSV metrics report"
        >
          <Download className="size-3.5 text-muted-foreground" />
          <span>Export Report</span>
        </button>

        {selectedRepo && (
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm">
            <Github className="size-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">{selectedRepo.full_name}</span>
            <button
              onClick={handleSwitchRepo}
              className="ml-1 text-[#2ea043] hover:text-[#3cb054] transition-colors"
              title="Switch repository"
            >
              <SwitchCamera className="size-3.5" />
            </button>
          </div>
        )}

        <button className="relative p-2 rounded-lg hover:bg-accent text-foreground">
          <Bell className="size-5" />
          <span className="absolute top-1 right-1 size-2 bg-[#2ea043] rounded-full"></span>
        </button>

        <button className="p-2 rounded-lg hover:bg-accent text-foreground">
          <Settings className="size-5" />
        </button>

        <div className="relative pl-3 border-l border-border">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
          >
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name}
                className="size-8 rounded-full border border-white/10"
              />
            ) : (
              <div className="size-8 rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#3b82f6] flex items-center justify-center">
                <Github className="size-5 text-white" />
              </div>
            )}
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium leading-none">{user?.name ?? 'User'}</p>
              <p className="text-xs text-muted-foreground leading-none mt-1">@{user?.login ?? 'octocat'}</p>
            </div>
            <ChevronDown className="size-4 text-muted-foreground" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-white/[0.08] bg-[#16161f] shadow-xl shadow-black/50 z-20 overflow-hidden py-1">
                <div className="px-4 py-3 border-b border-white/[0.06]">
                  <p className="text-sm text-[#e8e8f0] font-medium">{user?.name}</p>
                  <p className="text-xs text-[#9ca3af]">@{user?.login}</p>
                </div>
                <button
                  onClick={() => { handleSwitchRepo(); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#9ca3af] hover:text-[#e8e8f0] hover:bg-white/[0.04] transition-colors"
                >
                  <SwitchCamera className="size-4" />
                  Switch repository
                </button>
                <button
                  onClick={() => { handleExport(); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#9ca3af] hover:text-[#e8e8f0] hover:bg-white/[0.04] transition-colors"
                >
                  <Download className="size-4" />
                  Export metrics (CSV)
                </button>
                <button
                  onClick={() => { handleLogout(); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#9ca3af] hover:text-[#ef4444] hover:bg-white/[0.04] transition-colors"
                >
                  <LogOut className="size-4" />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}