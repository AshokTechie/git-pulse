import { Star, GitFork, Eye, GitCommit, TrendingUp } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function RepositoryAnalytics() {
  const repositories = [
    {
      name: 'web-platform',
      language: 'TypeScript',
      stars: 1247,
      forks: 234,
      commits: 3421,
      prs: 156,
      issues: 23,
      health: 92,
    },
    {
      name: 'api-gateway',
      language: 'Go',
      stars: 892,
      forks: 145,
      commits: 2108,
      prs: 98,
      issues: 12,
      health: 88,
    },
    {
      name: 'mobile-app',
      language: 'Swift',
      stars: 634,
      forks: 89,
      commits: 1876,
      prs: 76,
      issues: 18,
      health: 85,
    },
    {
      name: 'data-pipeline',
      language: 'Python',
      stars: 421,
      forks: 67,
      commits: 1543,
      prs: 54,
      issues: 8,
      health: 90,
    },
  ];

  const commitActivityData = [
    { week: 'Week 1', commits: 145 },
    { week: 'Week 2', commits: 189 },
    { week: 'Week 3', commits: 234 },
    { week: 'Week 4', commits: 198 },
  ];

  const languageData = [
    { language: 'TypeScript', percentage: 42, color: '#3b82f6' },
    { language: 'Go', percentage: 28, color: '#06b6d4' },
    { language: 'Python', percentage: 18, color: '#8b5cf6' },
    { language: 'Swift', percentage: 12, color: '#2ea043' },
  ];

  const prTrendData = [
    { month: 'Jan', merged: 23, open: 5 },
    { month: 'Feb', merged: 28, open: 7 },
    { month: 'Mar', merged: 35, open: 4 },
    { month: 'Apr', merged: 31, open: 6 },
    { month: 'May', merged: 42, open: 8 },
    { month: 'Jun', merged: 48, open: 5 },
  ];

  const getHealthColor = (health: number) => {
    if (health >= 90) return 'text-github-green';
    if (health >= 75) return 'text-cyan-glow';
    if (health >= 60) return 'text-purple-accent';
    return 'text-destructive';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Repository Analytics</h2>
        <p className="text-muted-foreground">Comprehensive insights into your repositories</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl bg-card border border-card-border backdrop-blur-sm shadow-lg">
          <h3 className="text-lg font-semibold mb-6">Repository Overview</h3>
          <div className="space-y-3">
            {repositories.map((repo, i) => (
              <div
                key={i}
                className="p-4 rounded-lg bg-accent hover:bg-accent/80 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold mb-1">{repo.name}</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-mono">
                        {repo.language}
                      </span>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1 ${getHealthColor(repo.health)}`}>
                    <span className="text-sm font-semibold">{repo.health}%</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Star className="size-3 text-github-green" />
                    <span className="text-muted-foreground">{repo.stars}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <GitFork className="size-3 text-purple-accent" />
                    <span className="text-muted-foreground">{repo.forks}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <GitCommit className="size-3 text-cyan-glow" />
                    <span className="text-muted-foreground">{repo.commits}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-xl bg-card border border-card-border backdrop-blur-sm shadow-lg">
          <h3 className="text-lg font-semibold mb-6">Language Distribution</h3>
          <div className="space-y-4">
            {languageData.map((lang, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-2">
                  <span>{lang.language}</span>
                  <span className="font-mono text-muted-foreground">{lang.percentage}%</span>
                </div>
                <div className="h-3 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${lang.percentage}%`,
                      backgroundColor: lang.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 rounded-lg bg-accent">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="size-4 text-github-green" />
              <span className="text-sm font-medium">Most Active</span>
            </div>
            <p className="text-2xl font-semibold">TypeScript</p>
            <p className="text-sm text-muted-foreground mt-1">Used in 12 repositories</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl bg-card border border-card-border backdrop-blur-sm shadow-lg">
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-1">Commit Activity</h3>
            <p className="text-sm text-muted-foreground">Last 4 weeks</p>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={commitActivityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="week" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#16161f',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#e8e8f0',
                }}
              />
              <Bar dataKey="commits" fill="#2ea043" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="p-6 rounded-xl bg-card border border-card-border backdrop-blur-sm shadow-lg">
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-1">Pull Request Trends</h3>
            <p className="text-sm text-muted-foreground">Merged vs Open PRs</p>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={prTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="month" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#16161f',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#e8e8f0',
                }}
              />
              <Line type="monotone" dataKey="merged" stroke="#2ea043" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="open" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-xl bg-gradient-to-br from-github-green/10 to-cyan-glow/10 border border-github-green/20 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-2">
            <Star className="size-5 text-github-green" />
            <span className="text-sm text-muted-foreground">Total Stars</span>
          </div>
          <p className="text-3xl font-semibold">3,194</p>
          <p className="text-sm text-github-green mt-1">+234 this month</p>
        </div>

        <div className="p-6 rounded-xl bg-gradient-to-br from-purple-accent/10 to-blue-accent/10 border border-purple-accent/20 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-2">
            <GitFork className="size-5 text-purple-accent" />
            <span className="text-sm text-muted-foreground">Total Forks</span>
          </div>
          <p className="text-3xl font-semibold">535</p>
          <p className="text-sm text-purple-accent mt-1">+42 this month</p>
        </div>

        <div className="p-6 rounded-xl bg-gradient-to-br from-cyan-glow/10 to-blue-accent/10 border border-cyan-glow/20 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="size-5 text-cyan-glow" />
            <span className="text-sm text-muted-foreground">Total Watchers</span>
          </div>
          <p className="text-3xl font-semibold">1,089</p>
          <p className="text-sm text-cyan-glow mt-1">+67 this month</p>
        </div>
      </div>
    </div>
  );
}
