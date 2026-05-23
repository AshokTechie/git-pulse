import { Trophy, TrendingUp, Clock, Code2 } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export function DeveloperInsights() {
  const leaderboard = [
    { rank: 1, name: 'Sarah Chen', avatar: '🦄', commits: 342, prs: 48, reviews: 67, score: 95 },
    { rank: 2, name: 'Alex Kumar', avatar: '🚀', commits: 298, prs: 42, reviews: 59, score: 91 },
    { rank: 3, name: 'Jamie Lee', avatar: '⭐', commits: 267, prs: 38, reviews: 52, score: 88 },
    { rank: 4, name: 'Morgan Taylor', avatar: '💎', commits: 234, prs: 35, reviews: 48, score: 85 },
    { rank: 5, name: 'Riley Park', avatar: '🎯', commits: 189, prs: 28, reviews: 41, score: 80 },
  ];

  const skillsData = [
    { skill: 'Code Quality', value: 92 },
    { skill: 'Collaboration', value: 88 },
    { skill: 'Velocity', value: 85 },
    { skill: 'Review Quality', value: 90 },
    { skill: 'Documentation', value: 78 },
    { skill: 'Testing', value: 82 },
  ];

  const productivityData = [
    { day: 'Mon', hours: 7.2 },
    { day: 'Tue', hours: 8.1 },
    { day: 'Wed', hours: 6.8 },
    { day: 'Thu', hours: 7.9 },
    { day: 'Fri', hours: 7.5 },
  ];

  const codeMetrics = [
    { label: 'Lines of Code', value: '45,234', change: '+12%', color: 'from-github-green to-cyan-glow' },
    { label: 'Code Reviews', value: '234', change: '+18%', color: 'from-purple-accent to-blue-accent' },
    { label: 'Avg Response Time', value: '2.3h', change: '-15%', color: 'from-cyan-glow to-blue-accent' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Developer Insights</h2>
        <p className="text-muted-foreground">Analyze team productivity and individual contributions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {codeMetrics.map((metric, i) => (
          <div
            key={i}
            className={`p-6 rounded-xl bg-gradient-to-br ${metric.color} bg-opacity-10 border border-white/10 backdrop-blur-sm shadow-lg`}
          >
            <p className="text-sm text-muted-foreground mb-1">{metric.label}</p>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-semibold">{metric.value}</p>
              <span className="text-sm text-github-green">{metric.change}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl bg-card border border-card-border backdrop-blur-sm shadow-lg">
          <div className="flex items-center gap-2 mb-6">
            <Trophy className="size-5 text-github-green" />
            <h3 className="text-lg font-semibold">Contributor Leaderboard</h3>
          </div>
          <div className="space-y-3">
            {leaderboard.map((dev) => (
              <div
                key={dev.rank}
                className="p-4 rounded-lg bg-accent hover:bg-accent/80 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center size-8 rounded-full bg-gradient-to-br from-purple-accent to-blue-accent text-lg">
                    {dev.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{dev.name}</span>
                      {dev.rank <= 3 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-github-green/20 text-github-green">
                          #{dev.rank}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Score: {dev.score}/100</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono text-github-green">{dev.commits}</p>
                    <p className="text-xs text-muted-foreground">commits</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2 rounded bg-muted text-center">
                    <p className="font-mono">{dev.prs}</p>
                    <p className="text-muted-foreground">PRs</p>
                  </div>
                  <div className="p-2 rounded bg-muted text-center">
                    <p className="font-mono">{dev.reviews}</p>
                    <p className="text-muted-foreground">Reviews</p>
                  </div>
                  <div className="p-2 rounded bg-muted text-center">
                    <p className="font-mono">{dev.score}%</p>
                    <p className="text-muted-foreground">Score</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 rounded-xl bg-card border border-card-border backdrop-blur-sm shadow-lg">
            <h3 className="text-lg font-semibold mb-6">Skills Breakdown</h3>
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={skillsData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="skill" stroke="#9ca3af" />
                <PolarRadiusAxis stroke="#9ca3af" />
                <Radar name="Skills" dataKey="value" stroke="#2ea043" fill="#2ea043" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="p-6 rounded-xl bg-card border border-card-border backdrop-blur-sm shadow-lg">
            <div className="flex items-center gap-2 mb-6">
              <Clock className="size-5 text-cyan-glow" />
              <h3 className="text-lg font-semibold">Active Coding Hours</h3>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={productivityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="day" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#16161f',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#e8e8f0',
                  }}
                />
                <Bar dataKey="hours" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl bg-card border border-card-border backdrop-blur-sm shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <Code2 className="size-5 text-purple-accent" />
            <h3 className="text-lg font-semibold">Coding Consistency</h3>
          </div>
          <div className="space-y-4">
            {[
              { name: 'Sarah Chen', consistency: 95, color: 'bg-github-green' },
              { name: 'Alex Kumar', consistency: 88, color: 'bg-cyan-glow' },
              { name: 'Jamie Lee', consistency: 82, color: 'bg-purple-accent' },
            ].map((dev, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-2">
                  <span>{dev.name}</span>
                  <span className="font-mono text-muted-foreground">{dev.consistency}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full ${dev.color} transition-all`} style={{ width: `${dev.consistency}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-xl bg-gradient-to-br from-purple-accent/10 to-blue-accent/10 border border-purple-accent/20 backdrop-blur-sm shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="size-5 text-purple-accent" />
            <h3 className="text-lg font-semibold">Team Velocity</h3>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-4xl font-semibold mb-1">87.5</p>
              <p className="text-sm text-muted-foreground">Average velocity score</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-card">
                <p className="text-2xl font-semibold text-github-green">+12%</p>
                <p className="text-xs text-muted-foreground">vs last month</p>
              </div>
              <div className="p-3 rounded-lg bg-card">
                <p className="text-2xl font-semibold text-cyan-glow">342</p>
                <p className="text-xs text-muted-foreground">tasks completed</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
