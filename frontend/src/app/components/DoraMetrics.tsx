import { useState, useEffect } from 'react';
import { Rocket, Clock, AlertTriangle, RefreshCw, TrendingUp, TrendingDown, Award } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getDoraMetrics } from '../../lib/api';

export function DoraMetrics() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await getDoraMetrics('30d');
        setData(res);
      } catch {
        // Fallback demo data
        setData({
          deploymentFrequency: {
            value: '4.8 / week',
            rating: 'Elite',
            trend: '+14%',
            history: [{ week: 'W1', value: 3.2 }, { week: 'W2', value: 4.1 }, { week: 'W3', value: 4.5 }, { week: 'W4', value: 4.8 }],
          },
          leadTimeForChanges: {
            value: '14.2h',
            rating: 'Elite',
            trend: '-18%',
            history: [{ week: 'W1', value: 22 }, { week: 'W2', value: 18 }, { week: 'W3', value: 16 }, { week: 'W4', value: 14.2 }],
          },
          changeFailureRate: {
            value: '3.8%',
            rating: 'Elite',
            trend: '-2.1%',
            history: [{ week: 'W1', value: 6.2 }, { week: 'W2', value: 4.9 }, { week: 'W3', value: 4.1 }, { week: 'W4', value: 3.8 }],
          },
          timeToRestoreService: {
            value: '35m',
            rating: 'Elite',
            trend: '-10m',
            history: [{ week: 'W1', value: 55 }, { week: 'W2', value: 45 }, { week: 'W3', value: 40 }, { week: 'W4', value: 35 }],
          },
        });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="size-8 border-2 border-purple-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const cards = [
    {
      title: 'Deployment Frequency',
      subtitle: 'How often code is deployed to production',
      metric: data.deploymentFrequency.value,
      rating: data.deploymentFrequency.rating,
      trend: data.deploymentFrequency.trend,
      icon: Rocket,
      color: '#2ea043',
      data: data.deploymentFrequency.history,
    },
    {
      title: 'Lead Time for Changes',
      subtitle: 'Time from commit to production merge',
      metric: data.leadTimeForChanges.value,
      rating: data.leadTimeForChanges.rating,
      trend: data.leadTimeForChanges.trend,
      icon: Clock,
      color: '#3b82f6',
      data: data.leadTimeForChanges.history,
    },
    {
      title: 'Change Failure Rate',
      subtitle: 'Percentage of deployments causing failures',
      metric: data.changeFailureRate.value,
      rating: data.changeFailureRate.rating,
      trend: data.changeFailureRate.trend,
      icon: AlertTriangle,
      color: '#f59e0b',
      data: data.changeFailureRate.history,
    },
    {
      title: 'Time to Restore Service',
      subtitle: 'Mean time to recover (MTTR) from incidents',
      metric: data.timeToRestoreService.value,
      rating: data.timeToRestoreService.rating,
      trend: data.timeToRestoreService.trend,
      icon: RefreshCw,
      color: '#8b5cf6',
      data: data.timeToRestoreService.history,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2.5">
            DORA Engineering Metrics
            <span className="text-xs px-2.5 py-1 rounded-full bg-github-green/20 text-github-green border border-github-green/30 font-medium flex items-center gap-1">
              <Award className="size-3" /> Overall Elite Tier
            </span>
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            DevOps Research and Assessment (DORA) benchmarks measuring software delivery velocity and stability.
          </p>
        </div>
      </div>

      {/* DORA 4 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div
              key={i}
              className="p-5 rounded-xl bg-card border border-card-border backdrop-blur-sm shadow-lg hover:shadow-xl transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="p-2.5 rounded-lg"
                  style={{ backgroundColor: `${c.color}20`, color: c.color }}
                >
                  <Icon className="size-5" />
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 font-semibold text-foreground">
                  {c.rating}
                </span>
              </div>

              <div className="mb-2">
                <span className="text-2xl font-bold text-foreground">{c.metric}</span>
                <span className="ml-2 text-xs text-github-green font-medium">{c.trend}</span>
              </div>
              <p className="text-xs font-medium text-foreground">{c.title}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{c.subtitle}</p>

              {/* Sparkline chart */}
              <div className="h-14 mt-3">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={c.data}>
                    <defs>
                      <linearGradient id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={c.color} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={c.color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="value" stroke={c.color} strokeWidth={2} fill={`url(#grad-${i})`} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </div>

      {/* Industry Benchmarks Reference */}
      <div className="p-6 rounded-xl bg-card border border-card-border">
        <h3 className="text-base font-semibold mb-3">DORA Industry Standards Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-muted-foreground">
            <thead>
              <tr className="border-b border-card-border text-foreground">
                <th className="py-2.5 px-3">Metric</th>
                <th className="py-2.5 px-3 text-github-green">Elite (Your Team)</th>
                <th className="py-2.5 px-3">High</th>
                <th className="py-2.5 px-3">Medium</th>
                <th className="py-2.5 px-3">Low</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border/50">
              <tr>
                <td className="py-2.5 px-3 font-medium text-foreground">Deployment Frequency</td>
                <td className="py-2.5 px-3 font-semibold text-github-green">On demand (multiple/day)</td>
                <td className="py-2.5 px-3">Once per week - month</td>
                <td className="py-2.5 px-3">Once per month - 6 months</td>
                <td className="py-2.5 px-3">Fewer than once every 6 mos</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-foreground">Lead Time for Changes</td>
                <td className="py-2.5 px-3 font-semibold text-github-green">&lt; 1 day</td>
                <td className="py-2.5 px-3">1 day - 1 week</td>
                <td className="py-2.5 px-3">1 week - 1 month</td>
                <td className="py-2.5 px-3">&gt; 1 month</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-foreground">Change Failure Rate</td>
                <td className="py-2.5 px-3 font-semibold text-github-green">0% - 5%</td>
                <td className="py-2.5 px-3">5% - 15%</td>
                <td className="py-2.5 px-3">15% - 30%</td>
                <td className="py-2.5 px-3">&gt; 30%</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-foreground">Time to Restore Service</td>
                <td className="py-2.5 px-3 font-semibold text-github-green">&lt; 1 hour</td>
                <td className="py-2.5 px-3">&lt; 1 day</td>
                <td className="py-2.5 px-3">1 day - 1 week</td>
                <td className="py-2.5 px-3">&gt; 1 week</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
