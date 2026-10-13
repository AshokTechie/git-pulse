import { useState, useEffect } from 'react';
import { HeartPulse, Moon, Sun, AlertCircle, ShieldAlert, CheckCircle, Clock, GitPullRequest } from 'lucide-react';
import { getBurnoutMetrics, getPrRiskMetrics } from '../../lib/api';

export function BurnoutAnalytics() {
  const [data, setData] = useState<any>(null);
  const [prRisks, setPrRisks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [burnoutRes, prRes] = await Promise.all([
          getBurnoutMetrics('30d').catch(() => null),
          getPrRiskMetrics().catch(() => []),
        ]);
        if (burnoutRes) setData(burnoutRes);
        if (prRes) setPrRisks(prRes);
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const fallbackDevs = [
    {
      login: 'alex-engineer',
      name: 'Alex Rivera',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      afterHoursPercent: 42,
      lateNightCommits: 14,
      weekendCommits: 8,
      reviewsConducted: 26,
      riskLevel: 'HIGH',
      recommendation: 'Off-hours commit frequency is elevated (>40%). Reallocate code review queue to alleviate burnout risk.',
    },
    {
      login: 'sarah-dev',
      name: 'Sarah Chen',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      afterHoursPercent: 18,
      lateNightCommits: 4,
      weekendCommits: 2,
      reviewsConducted: 14,
      riskLevel: 'MEDIUM',
      recommendation: 'Moderate sprint workload. Review turnaround is consistent and healthy.',
    },
    {
      login: 'priya-tech',
      name: 'Priya Sharma',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      afterHoursPercent: 6,
      lateNightCommits: 1,
      weekendCommits: 0,
      reviewsConducted: 12,
      riskLevel: 'LOW',
      recommendation: 'Sustainable pace. Contributions fall consistently within normal working hours.',
    },
  ];

  const developers = data?.developers?.length ? data.developers : fallbackDevs;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2.5">
          Developer Workload & Burnout Telemetry
          <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-glow/20 text-cyan-glow border border-cyan-glow/30 font-medium flex items-center gap-1">
            <HeartPulse className="size-3" /> Predictive Wellbeing
          </span>
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Detects irregular contribution hours, review fatigue, and excessive sprint pressure to maintain a sustainable engineering velocity.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-card border border-card-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Team Sustainable Pace Index</span>
            <CheckCircle className="size-4 text-github-green" />
          </div>
          <span className="text-3xl font-bold text-foreground">84 / 100</span>
          <p className="text-xs text-github-green mt-1">Sustainable & balanced pace across 82% of contributors</p>
        </div>

        <div className="p-5 rounded-xl bg-card border border-card-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">After-Hours Commits</span>
            <Moon className="size-4 text-purple-accent" />
          </div>
          <span className="text-3xl font-bold text-foreground">16.4%</span>
          <p className="text-xs text-muted-foreground mt-1">Pushes between 9 PM and 6 AM</p>
        </div>

        <div className="p-5 rounded-xl bg-card border border-card-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Review Queue Concentration</span>
            <AlertCircle className="size-4 text-cyan-glow" />
          </div>
          <span className="text-3xl font-bold text-foreground">1 Key Reviewer</span>
          <p className="text-xs text-muted-foreground mt-1">Alex reviews 46% of all incoming pull requests</p>
        </div>
      </div>

      {/* Developer Breakdown */}
      <div className="p-6 rounded-xl bg-card border border-card-border space-y-4">
        <h3 className="text-base font-semibold">Contributor Workload & Risk Indicators</h3>
        <div className="grid grid-cols-1 gap-3">
          {developers.map((dev: any, i: number) => {
            const isHigh = dev.riskLevel === 'HIGH';
            const isMed = dev.riskLevel === 'MEDIUM';
            return (
              <div
                key={i}
                className="p-4 rounded-xl border border-card-border/60 bg-white/[0.01] hover:bg-white/[0.03] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={dev.avatarUrl}
                    alt={dev.name}
                    className="size-11 rounded-full object-cover border border-card-border"
                  />
                  <div>
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      {dev.name}
                      <span className="text-xs text-muted-foreground font-normal">@{dev.login}</span>
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{dev.recommendation}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-xs">
                  <div className="text-right">
                    <span className="text-muted-foreground block text-[11px]">Off-Hours Work</span>
                    <span className="font-semibold text-foreground">{dev.afterHoursPercent}%</span>
                  </div>

                  <div className="text-right">
                    <span className="text-muted-foreground block text-[11px]">Review Load</span>
                    <span className="font-semibold text-foreground">{dev.reviewsConducted} PRs</span>
                  </div>

                  <div className="text-right min-w-[90px]">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                      isHigh
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : isMed
                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        : 'bg-github-green/20 text-github-green border border-github-green/30'
                    }`}>
                      {dev.riskLevel} RISK
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Automated PR Risk Scorer Section */}
      <div className="p-6 rounded-xl bg-card border border-card-border space-y-4">
        <h3 className="text-base font-semibold flex items-center gap-2">
          <GitPullRequest className="size-4 text-purple-accent" />
          Automated Pull Request Risk Telemetry
        </h3>
        <p className="text-xs text-muted-foreground">
          Identifies pull requests with high architectural impact, review latency, or missing validation.
        </p>

        <div className="divide-y divide-card-border/50">
          {(prRisks.length ? prRisks : [
            { number: 42, title: 'feat(auth): refactor session management & tokens', repository: 'gitpulse-core', daysOpen: 8, riskLevel: 'HIGH', riskScore: 78, flags: ['Open for 8 days', 'High-impact core change'] },
            { number: 39, title: 'ui: update dashboard metrics cards styling', repository: 'react-dashboard', daysOpen: 2, riskLevel: 'LOW', riskScore: 18, flags: ['Clean UI change', 'Reviewed by 2 peers'] },
          ]).map((pr, i) => (
            <div key={i} className="py-3 flex items-center justify-between gap-4">
              <div>
                <span className="text-sm font-medium text-foreground">
                  #{pr.number} {pr.title}
                </span>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <span className="px-1.5 py-0.5 rounded bg-white/5">{pr.repository}</span>
                  <span>{pr.daysOpen} days open</span>
                  {pr.flags?.map((f: string, fi: number) => (
                    <span key={fi} className="text-yellow-400/80">• {f}</span>
                  ))}
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                pr.riskLevel === 'HIGH' ? 'bg-red-500/20 text-red-400' : 'bg-github-green/20 text-github-green'
              }`}>
                Risk {pr.riskScore}/100
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
