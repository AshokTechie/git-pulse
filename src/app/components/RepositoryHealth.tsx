import { Shield, AlertTriangle, CheckCircle2, TrendingUp, Activity } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';

export function RepositoryHealth() {
  const healthMetrics = [
    { metric: 'Code Quality', score: 92 },
    { metric: 'Test Coverage', score: 85 },
    { metric: 'Security', score: 88 },
    { metric: 'Documentation', score: 78 },
    { metric: 'Performance', score: 90 },
    { metric: 'Maintainability', score: 87 },
  ];

  const repositories = [
    {
      name: 'web-platform',
      overallScore: 92,
      metrics: {
        quality: 94,
        cicd: 90,
        prTime: 88,
        techDebt: 92,
        security: 95,
        coverage: 87,
      },
      status: 'excellent',
    },
    {
      name: 'api-gateway',
      overallScore: 88,
      metrics: {
        quality: 89,
        cicd: 92,
        prTime: 85,
        techDebt: 88,
        security: 90,
        coverage: 84,
      },
      status: 'good',
    },
    {
      name: 'mobile-app',
      overallScore: 75,
      metrics: {
        quality: 78,
        cicd: 80,
        prTime: 72,
        techDebt: 70,
        security: 82,
        coverage: 68,
      },
      status: 'needs-attention',
    },
  ];

  const recommendations = [
    {
      repo: 'mobile-app',
      type: 'critical',
      icon: AlertTriangle,
      title: 'Low Test Coverage',
      description: 'Test coverage is at 68%. Recommend increasing to 80% minimum.',
      priority: 'High',
    },
    {
      repo: 'api-gateway',
      type: 'warning',
      icon: Shield,
      title: 'Outdated Dependencies',
      description: '5 dependencies have security updates available.',
      priority: 'Medium',
    },
    {
      repo: 'web-platform',
      type: 'success',
      icon: CheckCircle2,
      title: 'Excellent Health',
      description: 'All metrics are performing well. Keep up the good work!',
      priority: 'Low',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'text-github-green';
      case 'good':
        return 'text-cyan-glow';
      case 'needs-attention':
        return 'text-purple-accent';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'from-github-green/10 to-cyan-glow/10 border-github-green/30';
      case 'good':
        return 'from-cyan-glow/10 to-blue-accent/10 border-cyan-glow/30';
      case 'needs-attention':
        return 'from-purple-accent/10 to-blue-accent/10 border-purple-accent/30';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Repository Health Score</h2>
        <p className="text-muted-foreground">Comprehensive health analysis and scoring</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {repositories.map((repo, i) => (
          <div
            key={i}
            className={`p-6 rounded-xl bg-gradient-to-br ${getStatusBg(repo.status)} border backdrop-blur-sm shadow-lg`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">{repo.name}</h3>
                <p className="text-xs text-muted-foreground capitalize">{repo.status.replace('-', ' ')}</p>
              </div>
              <div className={`text-right ${getStatusColor(repo.status)}`}>
                <p className="text-3xl font-semibold">{repo.overallScore}</p>
                <p className="text-xs">Health Score</p>
              </div>
            </div>
            <div className="space-y-2 text-xs">
              {Object.entries(repo.metrics).map(([key, value]) => (
                <div key={key}>
                  <div className="flex justify-between mb-1">
                    <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span className="font-mono">{value}%</span>
                  </div>
                  <div className="h-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        value >= 90
                          ? 'bg-github-green'
                          : value >= 75
                          ? 'bg-cyan-glow'
                          : 'bg-purple-accent'
                      }`}
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl bg-card border border-card-border backdrop-blur-sm shadow-lg">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="size-5 text-github-green" />
            <h3 className="text-lg font-semibold">Overall Health Breakdown</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={healthMetrics}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="metric" stroke="#9ca3af" />
              <PolarRadiusAxis stroke="#9ca3af" />
              <Radar
                name="Health Metrics"
                dataKey="score"
                stroke="#2ea043"
                fill="#2ea043"
                fillOpacity={0.3}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="p-6 rounded-xl bg-card border border-card-border backdrop-blur-sm shadow-lg">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="size-5 text-cyan-glow" />
            <h3 className="text-lg font-semibold">AI Recommendations</h3>
          </div>
          <div className="space-y-3">
            {recommendations.map((rec, i) => {
              const Icon = rec.icon;
              return (
                <div key={i} className="p-4 rounded-lg bg-accent hover:bg-accent/80 transition-all cursor-pointer">
                  <div className="flex items-start gap-3">
                    <Icon
                      className={`size-5 flex-shrink-0 ${
                        rec.type === 'critical'
                          ? 'text-destructive'
                          : rec.type === 'warning'
                          ? 'text-purple-accent'
                          : 'text-github-green'
                      }`}
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="font-semibold text-sm">{rec.title}</h4>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            rec.priority === 'High'
                              ? 'bg-destructive/20 text-destructive'
                              : rec.priority === 'Medium'
                              ? 'bg-purple-accent/20 text-purple-accent'
                              : 'bg-github-green/20 text-github-green'
                          }`}
                        >
                          {rec.priority}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">{rec.repo}</p>
                      <p className="text-sm text-muted-foreground">{rec.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-6 rounded-xl bg-gradient-to-br from-github-green/10 to-cyan-glow/10 border border-github-green/20 backdrop-blur-sm shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="size-4 text-github-green" />
            <span className="text-sm text-muted-foreground">Passing Tests</span>
          </div>
          <p className="text-3xl font-semibold">98.5%</p>
          <div className="flex items-center gap-1 mt-1">
            <TrendingUp className="size-3 text-github-green" />
            <span className="text-xs text-github-green">+2.3%</span>
          </div>
        </div>

        <div className="p-6 rounded-xl bg-gradient-to-br from-purple-accent/10 to-blue-accent/10 border border-purple-accent/20 backdrop-blur-sm shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="size-4 text-purple-accent" />
            <span className="text-sm text-muted-foreground">Security Score</span>
          </div>
          <p className="text-3xl font-semibold">92/100</p>
          <p className="text-xs text-muted-foreground mt-1">0 critical issues</p>
        </div>

        <div className="p-6 rounded-xl bg-gradient-to-br from-cyan-glow/10 to-blue-accent/10 border border-cyan-glow/20 backdrop-blur-sm shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="size-4 text-cyan-glow" />
            <span className="text-sm text-muted-foreground">Uptime</span>
          </div>
          <p className="text-3xl font-semibold">99.9%</p>
          <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
        </div>

        <div className="p-6 rounded-xl bg-gradient-to-br from-blue-accent/10 to-github-green/10 border border-blue-accent/20 backdrop-blur-sm shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="size-4 text-blue-accent" />
            <span className="text-sm text-muted-foreground">Performance</span>
          </div>
          <p className="text-3xl font-semibold">A+</p>
          <p className="text-xs text-muted-foreground mt-1">Excellent rating</p>
        </div>
      </div>

      <div className="p-6 rounded-xl bg-card border border-card-border backdrop-blur-sm shadow-lg">
        <h3 className="text-lg font-semibold mb-4">Detailed Metrics Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: 'Code Quality', value: 92, max: 100 },
            { label: 'CI/CD Health', value: 88, max: 100 },
            { label: 'PR Response Time', value: 2.3, max: 24, unit: 'hours' },
            { label: 'Technical Debt', value: 18, max: 100, inverse: true },
            { label: 'Test Coverage', value: 85, max: 100 },
            { label: 'Documentation', value: 78, max: 100 },
          ].map((metric, i) => (
            <div key={i} className="p-4 rounded-lg bg-accent">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">{metric.label}</span>
                <span className="text-sm font-mono text-github-green">
                  {metric.value}{metric.unit || '%'}
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full ${metric.inverse ? 'bg-purple-accent' : 'bg-github-green'} transition-all`}
                  style={{ width: `${(metric.value / metric.max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
