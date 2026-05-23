import { Search, Bell, Settings, ChevronDown, Github } from 'lucide-react';

export function TopBar() {
  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6">
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search repositories, developers, insights..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-lg hover:bg-accent text-foreground">
          <Bell className="size-5" />
          <span className="absolute top-1 right-1 size-2 bg-github-green rounded-full"></span>
        </button>

        <button className="p-2 rounded-lg hover:bg-accent text-foreground">
          <Settings className="size-5" />
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-border">
          <div className="size-8 rounded-full bg-gradient-to-br from-purple-accent to-blue-accent flex items-center justify-center">
            <Github className="size-5 text-white" />
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium">Octocat</p>
            <p className="text-xs text-muted-foreground">@octocat</p>
          </div>
          <ChevronDown className="size-4 text-muted-foreground" />
        </div>
      </div>
    </header>
  );
}
