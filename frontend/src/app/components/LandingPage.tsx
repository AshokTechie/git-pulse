import { useNavigate } from 'react-router-dom';
import { Activity, BarChart3, GitBranch, Shield, Sparkles, Users, Zap, ArrowRight, Github, Star, TrendingUp, Code2, CheckCircle } from 'lucide-react';

const features = [
  {
    icon: BarChart3,
    title: 'Dashboard & KPIs',
    description: 'Real-time KPI cards, activity charts, and productivity scores in one unified view.',
    color: 'from-[#2ea043] to-[#06b6d4]',
    glow: 'rgba(46,160,67,0.2)',
  },
  {
    icon: Activity,
    title: 'Contribution Analytics',
    description: 'GitHub-style heatmaps, monthly trends, and peak coding hours analysis.',
    color: 'from-[#3b82f6] to-[#6e56cf]',
    glow: 'rgba(59,130,246,0.2)',
  },
  {
    icon: GitBranch,
    title: 'Repository Analytics',
    description: 'Health scores, language distribution, and commit activity across all repos.',
    color: 'from-[#8b5cf6] to-[#06b6d4]',
    glow: 'rgba(139,92,246,0.2)',
  },
  {
    icon: Shield,
    title: 'Repository Health',
    description: 'Comprehensive scoring system with radar charts and actionable recommendations.',
    color: 'from-[#06b6d4] to-[#3b82f6]',
    glow: 'rgba(6,182,212,0.2)',
  },
  {
    icon: Users,
    title: 'Developer Insights',
    description: 'Leaderboards, skills breakdown, and individual developer performance metrics.',
    color: 'from-[#f59e0b] to-[#ef4444]',
    glow: 'rgba(245,158,11,0.2)',
  },
  {
    icon: Code2,
    title: 'Team Collaboration',
    description: 'Collaboration metrics, review networks, and sprint velocity analytics.',
    color: 'from-[#2ea043] to-[#8b5cf6]',
    glow: 'rgba(46,160,67,0.2)',
  },
  {
    icon: Sparkles,
    title: 'AI Insights',
    description: 'Predictive analytics, anomaly detection, and intelligent recommendations.',
    color: 'from-[#6e56cf] to-[#3b82f6]',
    glow: 'rgba(110,86,207,0.2)',
  },
];

const stats = [
  { value: '50K+', label: 'Developers' },
  { value: '2M+', label: 'Repos Analyzed' },
  { value: '99.9%', label: 'Uptime' },
  { value: '< 100ms', label: 'Avg Response' },
];

const trustedBy = ['Linear', 'Vercel', 'Supabase', 'GitHub', 'Figma', 'Notion'];

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e8e8f0] overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-gradient-to-br from-[#2ea043] to-[#06b6d4] flex items-center justify-center shadow-lg shadow-[rgba(46,160,67,0.3)]">
              <Activity className="size-5 text-white" />
            </div>
            <span className="font-semibold tracking-tight">GitPulse AI</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 rounded-lg text-sm text-[#e8e8f0]/70 hover:text-[#e8e8f0] transition-colors"
            >
              Sign in
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 rounded-lg text-sm bg-[#2ea043] text-white hover:bg-[#3cb054] transition-colors font-medium shadow-lg shadow-[rgba(46,160,67,0.3)]"
            >
              Get started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6">
        {/* Background glow orbs */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#2ea043]/[0.06] rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-40 left-1/4 w-[300px] h-[300px] bg-[#6e56cf]/[0.08] rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-[300px] h-[300px] bg-[#06b6d4]/[0.08] rounded-full blur-[80px] pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#2ea043]/30 bg-[#2ea043]/10 text-[#2ea043] text-sm mb-8">
            <Sparkles className="size-3.5" />
            <span>AI-Powered GitHub Analytics</span>
          </div>

          <h1 className="text-5xl md:text-7xl tracking-tight mb-6 leading-[1.05]">
            <span className="text-[#e8e8f0]">Understand your</span>
            <br />
            <span className="bg-gradient-to-r from-[#2ea043] via-[#06b6d4] to-[#8b5cf6] bg-clip-text text-transparent">
              GitHub data deeply
            </span>
          </h1>

          <p className="text-xl text-[#9ca3af] max-w-2xl mx-auto mb-10 leading-relaxed">
            GitPulse AI turns your repositories into actionable intelligence — contribution heatmaps,
            health scores, team velocity, and AI-powered predictions all in one premium dashboard.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/login')}
              className="group flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#2ea043] text-white hover:bg-[#3cb054] transition-all font-medium shadow-xl shadow-[rgba(46,160,67,0.3)] hover:shadow-[rgba(46,160,67,0.5)] hover:-translate-y-0.5"
            >
              <Github className="size-5" />
              Continue with GitHub
              <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-3.5 rounded-xl border border-white/10 text-[#e8e8f0]/80 hover:text-[#e8e8f0] hover:border-white/20 hover:bg-white/[0.03] transition-all font-medium"
            >
              View demo
            </button>
          </div>

          <p className="mt-4 text-sm text-[#9ca3af]/60">Free to start · No credit card required</p>
        </div>

        {/* Dashboard preview */}
        <div className="max-w-5xl mx-auto mt-16 relative">
          <div className="relative rounded-2xl border border-white/[0.08] overflow-hidden shadow-2xl shadow-black/50">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0a0a0f] z-10 pointer-events-none" />
            <div className="bg-[#0f0f14] p-6">
              {/* Mock dashboard preview */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Total Commits', value: '12,847', change: '+12%', color: '#2ea043' },
                  { label: 'Active Repos', value: '34', change: '+3', color: '#3b82f6' },
                  { label: 'Team Members', value: '28', change: '+2', color: '#8b5cf6' },
                  { label: 'PR Merge Rate', value: '94.2%', change: '+1.8%', color: '#06b6d4' },
                ].map((kpi) => (
                  <div key={kpi.label} className="bg-[rgba(20,20,30,0.6)] border border-white/[0.06] rounded-xl p-4">
                    <p className="text-xs text-[#9ca3af] mb-2">{kpi.label}</p>
                    <p className="text-2xl text-[#e8e8f0] mb-1">{kpi.value}</p>
                    <p className="text-xs" style={{ color: kpi.color }}>{kpi.change}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 35 }).map((_, i) => {
                  const intensity = Math.random();
                  const opacity = intensity < 0.3 ? 0.08 : intensity < 0.6 ? 0.3 : intensity < 0.8 ? 0.6 : 1;
                  return (
                    <div
                      key={i}
                      className="h-6 rounded-sm"
                      style={{ backgroundColor: `rgba(46,160,67,${opacity})` }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 border-y border-white/[0.05]">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-4xl text-[#e8e8f0] mb-1">{stat.value}</p>
              <p className="text-sm text-[#9ca3af]">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl text-[#e8e8f0] mb-4 tracking-tight">Everything you need to ship faster</h2>
            <p className="text-[#9ca3af] text-lg max-w-xl mx-auto">
              Seven powerful analytics modules, all connected and talking to each other.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.slice(0, 6).map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group relative rounded-2xl border border-white/[0.06] bg-[rgba(20,20,30,0.4)] p-6 hover:border-white/[0.12] transition-all hover:-translate-y-0.5"
                  style={{ boxShadow: `0 0 0 0 ${feature.glow}` }}
                >
                  <div
                    className={`size-10 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg`}
                  >
                    <Icon className="size-5 text-white" />
                  </div>
                  <h3 className="text-[#e8e8f0] mb-2">{feature.title}</h3>
                  <p className="text-sm text-[#9ca3af] leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>

          {/* AI Insights - full width spotlight */}
          <div className="mt-5 rounded-2xl border border-[#6e56cf]/30 bg-gradient-to-br from-[#6e56cf]/10 to-[#3b82f6]/10 p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[300px] h-[200px] bg-[#6e56cf]/10 blur-[60px] pointer-events-none" />
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="size-12 rounded-2xl bg-gradient-to-br from-[#6e56cf] to-[#3b82f6] flex items-center justify-center flex-shrink-0 shadow-xl shadow-[rgba(110,86,207,0.3)]">
                <Sparkles className="size-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-[#e8e8f0] text-lg mb-1">AI Insights</h3>
                <p className="text-[#9ca3af] text-sm">
                  Powered by machine learning to detect anomalies, predict burnout risks, forecast sprint completion, and surface intelligent recommendations tailored to your team.
                </p>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6e56cf] text-white hover:bg-[#7c6bdb] transition-colors text-sm font-medium flex-shrink-0"
              >
                Try AI Insights <ArrowRight className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="py-16 px-6 border-t border-white/[0.05]">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-[#9ca3af]/60 uppercase tracking-widest mb-8">Trusted by teams at</p>
          <div className="flex flex-wrap items-center justify-center gap-8">
            {trustedBy.map((company) => (
              <span key={company} className="text-[#9ca3af]/40 text-lg font-semibold tracking-tight hover:text-[#9ca3af]/70 transition-colors cursor-default">
                {company}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center relative">
          <div className="absolute inset-0 bg-[#2ea043]/[0.04] rounded-3xl blur-[60px] pointer-events-none" />
          <div className="relative rounded-3xl border border-[#2ea043]/20 bg-[rgba(46,160,67,0.04)] p-12">
            <div className="flex justify-center mb-6">
              {[Star, TrendingUp, CheckCircle, Zap].map((Icon, i) => (
                <div key={i} className="size-10 rounded-full bg-[rgba(46,160,67,0.1)] border border-[#2ea043]/20 flex items-center justify-center -ml-2 first:ml-0">
                  <Icon className="size-4 text-[#2ea043]" />
                </div>
              ))}
            </div>
            <h2 className="text-4xl text-[#e8e8f0] mb-4 tracking-tight">Start analyzing in minutes</h2>
            <p className="text-[#9ca3af] mb-8 max-w-md mx-auto">
              Connect your GitHub account and get instant analytics on your repositories, team, and code quality.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="group flex items-center gap-2 px-8 py-4 rounded-xl bg-[#2ea043] text-white hover:bg-[#3cb054] transition-all font-medium shadow-xl shadow-[rgba(46,160,67,0.3)] hover:-translate-y-0.5 mx-auto"
            >
              <Github className="size-5" />
              Connect GitHub for free
              <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.05] py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded bg-gradient-to-br from-[#2ea043] to-[#06b6d4] flex items-center justify-center">
              <Activity className="size-3.5 text-white" />
            </div>
            <span className="text-sm text-[#9ca3af]">GitPulse AI</span>
          </div>
          <p className="text-xs text-[#9ca3af]/40">© 2026 GitPulse AI. Not affiliated with GitHub, Inc.</p>
        </div>
      </footer>
    </div>
  );
}
