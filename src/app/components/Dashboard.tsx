import { GitCommit, GitPullRequest, FolderGit2, AlertCircle, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function Dashboard() {
  const kpis = [
    {
      label: 'Total Contributions',
      value: '1,247',
      change: '+12.5%',
      trend: 'up',
      icon: GitCommit,
      color: 'from-github-green to-cyan-glow',
    },
    {
      label: 'Pull Requests Merged',
      value: '89',
      change: '+8.2%',
      trend: 'up',
      icon: GitPullRequest,
      color: 'from-purple-accent to-blue-accent',
    },
    {
      label: 'Active Repositories',
      value: '24',
      change: '+3',
      trend: 'up',
      icon: FolderGit2,
      color: 'from-blue-accent to-cyan-glow',
    },
    {
      label: 'Open Issues',
      value: '156',
      change: '-5.3%',
      trend: 'down',
      icon: AlertCircle,
      color: 'from-purple-accent to-github-green',
    },
  ];

  const contributionData = [
    { date: 'Mon', commits: 45, prs: 12, reviews: 8 },
    { date: 'Tue', commits: 52, prs: 15, reviews: 10 },
    { date: 'Wed', commits: 38, prs: 9, reviews: 6 },
    { date: 'Thu', commits: 61, prs: 18, reviews: 12 },
    { date: 'Fri', commits: 44, prs: 14, reviews: 9 },
    { date: 'Sat', commits: 22, prs: 5, reviews: 3 },
    { date: 'Sun', commits: 18, prs: 4, reviews: 2 },
  ];

  const activityData = [
    { month: 'Jan', activity: 320 },
    { month: 'Feb', activity: 380 },
    { month: 'Mar', activity: 420 },
    { month: 'Apr', activity: 490 },
    { month: 'May', activity: 550 },
    { month: 'Jun', activity: 630 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Analytics Dashboard</h2>
        <p className="text-muted-foreground">Comprehensive overview of your engineering team's performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          const TrendIcon = kpi.trend === 'up' ? TrendingUp : TrendingDown;
          return (
            <div
              key={index}
              className="p-6 rounded-xl bg-card border border-card-border backdrop-blur-sm shadow-lg hover:shadow-xl transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg bg-gradient-to-br ${kpi.color} bg-opacity-10`}>
                  <Icon className="size-5 text-white" />
                </div>
                <div className={`flex items-center gap-1 text-sm ${kpi.trend === 'up' ? 'text-github-green' : 'text-cyan-glow'}`}>
                  <TrendIcon className="size-4" />
                  <span>{kpi.change}</span>
                </div>
              </div>
              <div>
                <p className="text-muted-foreground text-sm mb-1">{kpi.label}</p>
                <p className="text-3xl font-semibold">{kpi.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl bg-card border border-card-border backdrop-blur-sm shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold">Weekly Activity</h3>
              <p className="text-sm text-muted-foreground">Commits, PRs, and Reviews</p>
            </div>
            <Activity className="size-5 text-github-green" />
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={contributionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#16161f',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#e8e8f0',
                }}
              />
              <Bar dataKey="commits" fill="#2ea043" radius={[4, 4, 0, 0]} />
              <Bar dataKey="prs" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="reviews" fill="#06b6d4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="p-6 rounded-xl bg-card border border-card-border backdrop-blur-sm shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold">Activity Trend</h3>
              <p className="text-sm text-muted-foreground">Last 6 months</p>
            </div>
            <TrendingUp className="size-5 text-cyan-glow" />
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={activityData}>
              <defs>
                <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
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
              <Area type="monotone" dataKey="activity" stroke="#06b6d4" fillOpacity={1} fill="url(#activityGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="p-6 rounded-xl bg-card border border-card-border backdrop-blur-sm shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Team Productivity Score</h3>
          <div className="flex items-center justify-center">
            <div className="relative size-40">
              <svg className="size-full -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="12"
                  fill="none"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="#2ea043"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${(85 / 100) * 440} 440`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-3xl font-bold">85</span>
                <span className="text-sm text-muted-foreground">Score</span>
              </div>
            </div>
          </div>
          <p className="text-center text-sm text-muted-foreground mt-4">Excellent performance this month</p>
        </div>

        <div className="p-6 rounded-xl bg-card border border-card-border backdrop-blur-sm shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Top Contributors</h3>
          <div className="space-y-3">
            {[
              { name: 'Sarah Chen', commits: 234, avatar: '🦄' },
              { name: 'Alex Kumar', commits: 189, avatar: '🚀' },
              { name: 'Jamie Lee', commits: 156, avatar: '⭐' },
            ].map((contributor, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-accent">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-gradient-to-br from-purple-accent to-blue-accent flex items-center justify-center text-lg">
                    {contributor.avatar}
                  </div>
                  <div>
                    <p className="font-medium">{contributor.name}</p>
                    <p className="text-xs text-muted-foreground">{contributor.commits} commits</p>
                  </div>
                </div>
                <TrendingUp className="size-4 text-github-green" />
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-xl bg-gradient-to-br from-purple-accent/10 to-blue-accent/10 border border-purple-accent/20 backdrop-blur-sm shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-purple-accent/20">
              <Activity className="size-5 text-purple-accent" />
            </div>
            <h3 className="text-lg font-semibold">AI Engineering Score</h3>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Code Quality</span>
                <span className="text-github-green">92%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-github-green" style={{ width: '92%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Velocity</span>
                <span className="text-purple-accent">88%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-purple-accent" style={{ width: '88%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Collaboration</span>
                <span className="text-cyan-glow">95%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-cyan-glow" style={{ width: '95%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
