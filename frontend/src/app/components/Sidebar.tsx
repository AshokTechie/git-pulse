import { LayoutDashboard, Activity, FolderGit2, Users, Sparkles, GitBranch, Shield, ChevronLeft, ChevronRight } from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ currentView, onViewChange, collapsed, onToggleCollapse }: SidebarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'contributions', label: 'Contributions', icon: Activity },
    { id: 'repositories', label: 'Repositories', icon: FolderGit2 },
    { id: 'health', label: 'Repo Health', icon: Shield },
    { id: 'developers', label: 'Developer Insights', icon: Users },
    { id: 'team', label: 'Team Collaboration', icon: GitBranch },
    { id: 'ai-insights', label: 'AI Insights', icon: Sparkles },
  ];

  return (
    <aside
      className={`h-full bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="p-4 flex items-center justify-between border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-gradient-to-br from-[#2ea043] to-[#06b6d4] flex items-center justify-center">
              <Activity className="size-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-sidebar-foreground">GitPulse AI</h1>
              <p className="text-xs text-muted-foreground">Analytics Platform</p>
            </div>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-md hover:bg-sidebar-accent text-sidebar-foreground"
        >
          {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-lg'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent'
              }`}
            >
              <Icon className={`size-5 ${collapsed ? '' : 'flex-shrink-0'}`} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        {!collapsed && (
          <div className="p-3 rounded-lg bg-gradient-to-br from-purple-accent/10 to-blue-accent/10 border border-purple-accent/20">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="size-4 text-purple-accent" />
              <span className="text-sm font-medium">AI Assistant</span>
            </div>
            <p className="text-xs text-muted-foreground">Get instant insights powered by AI</p>
          </div>
        )}
      </div>
    </aside>
  );
}
