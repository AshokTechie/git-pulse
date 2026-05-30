import { Users, GitPullRequest, MessageSquare, Network } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function TeamCollaboration() {
  const collaborationMetrics = [
    { label: 'Active Collaborations', value: '48', change: '+8', color: 'from-github-green to-cyan-glow' },
    { label: 'Code Reviews', value: '234', change: '+12%', color: 'from-purple-accent to-blue-accent' },
    { label: 'Team Members', value: '12', change: '+2', color: 'from-cyan-glow to-blue-accent' },
  ];

  const reviewNetworkData = [
    { from: 'Sarah Chen', to: 'Alex Kumar', reviews: 23 },
    { from: 'Alex Kumar', to: 'Jamie Lee', reviews: 18 },
    { from: 'Jamie Lee', to: 'Morgan Taylor', reviews: 15 },
    { from: 'Morgan Taylor', to: 'Sarah Chen', reviews: 20 },
    { from: 'Riley Park', to: 'Alex Kumar', reviews: 12 },
  ];

  const sprintData = [
    { sprint: 'Sprint 1', planned: 45, completed: 42 },
    { sprint: 'Sprint 2', planned: 48, completed: 46 },
    { sprint: 'Sprint 3', planned: 52, completed: 50 },
    { sprint: 'Sprint 4', planned: 50, completed: 48 },
  ];

  const teamMembers = [
    {
      name: 'Sarah Chen',
      role: 'Senior Engineer',
      avatar: '🦄',
      contributions: 342,
      reviews: 67,
      collaboration: 95,
    },
    {
      name: 'Alex Kumar',
      role: 'Tech Lead',
      avatar: '🚀',
      contributions: 298,
      reviews: 59,
      collaboration: 92,
    },
    {
      name: 'Jamie Lee',
      role: 'Engineer',
      avatar: '⭐',
      contributions: 267,
      reviews: 52,
      collaboration: 88,
    },
    {
      name: 'Morgan Taylor',
      role: 'Engineer',
      avatar: '💎',
      contributions: 234,
      reviews: 48,
      collaboration: 85,
    },
  ];

  const ownershipMap = [
    { module: 'Authentication', owner: 'Sarah Chen', health: 92 },
    { module: 'API Gateway', owner: 'Alex Kumar', health: 88 },
    { module: 'Data Pipeline', owner: 'Jamie Lee', health: 90 },
    { module: 'Frontend UI', owner: 'Morgan Taylor', health: 86 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Team Collaboration</h2>
        <p className="text-muted-foreground">Analyze team dynamics and collaboration patterns</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {collaborationMetrics.map((metric, i) => (
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
            <Users className="size-5 text-github-green" />
            <h3 className="text-lg font-semibold">Team Members</h3>
          </div>
          <div className="space-y-3">
            {teamMembers.map((member, i) => (
              <div
                key={i}
                className="p-4 rounded-lg bg-accent hover:bg-accent/80 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="size-12 rounded-full bg-gradient-to-br from-purple-accent to-blue-accent flex items-center justify-center text-xl">
                      {member.avatar}
                    </div>
                    <div>
                      <p className="font-semibold">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-github-green">{member.collaboration}%</p>
                    <p className="text-xs text-muted-foreground">collaboration</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded bg-muted text-center">
                    <p className="font-mono">{member.contributions}</p>
                    <p className="text-muted-foreground">Contributions</p>
                  </div>
                  <div className="p-2 rounded bg-muted text-center">
                    <p className="font-mono">{member.reviews}</p>
                    <p className="text-muted-foreground">Reviews</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 rounded-xl bg-card border border-card-border backdrop-blur-sm shadow-lg">
            <div className="flex items-center gap-2 mb-6">
              <Network className="size-5 text-purple-accent" />
              <h3 className="text-lg font-semibold">Review Network</h3>
            </div>
            <div className="space-y-3">
              {reviewNetworkData.map((connection, i) => (
                <div key={i} className="p-3 rounded-lg bg-accent">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{connection.from}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="text-sm font-medium">{connection.to}</span>
                    </div>
                    <span className="text-xs font-mono text-purple-accent">{connection.reviews} reviews</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-purple-accent transition-all"
                      style={{ width: `${(connection.reviews / 25) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-xl bg-gradient-to-br from-github-green/10 to-cyan-glow/10 border border-github-green/20 backdrop-blur-sm shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <GitPullRequest className="size-5 text-github-green" />
              <h3 className="text-lg font-semibold">Team Efficiency</h3>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>PR Merge Rate</span>
                  <span className="font-mono text-github-green">94%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-github-green" style={{ width: '94%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Avg Review Time</span>
                  <span className="font-mono text-cyan-glow">2.3h</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-cyan-glow" style={{ width: '78%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl bg-card border border-card-border backdrop-blur-sm shadow-lg">
          <div className="flex items-center gap-2 mb-6">
            <MessageSquare className="size-5 text-cyan-glow" />
            <h3 className="text-lg font-semibold">Sprint Analytics</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={sprintData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="sprint" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#16161f',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#e8e8f0',
                }}
              />
              <Bar dataKey="planned" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="completed" fill="#2ea043" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="p-6 rounded-xl bg-card border border-card-border backdrop-blur-sm shadow-lg">
          <h3 className="text-lg font-semibold mb-6">Ownership Mapping</h3>
          <div className="space-y-3">
            {ownershipMap.map((item, i) => (
              <div key={i} className="p-4 rounded-lg bg-accent">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold">{item.module}</p>
                    <p className="text-xs text-muted-foreground">{item.owner}</p>
                  </div>
                  <span className="text-sm font-semibold text-github-green">{item.health}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-github-green transition-all"
                    style={{ width: `${item.health}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
