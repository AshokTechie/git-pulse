import { Sparkles, Brain, AlertTriangle, CheckCircle2, TrendingUp, Lightbulb } from 'lucide-react';

export function AIInsights() {
  const aiInsights = [
    {
      type: 'success',
      icon: CheckCircle2,
      title: 'High Quality Code Detected',
      description: 'Your team has maintained a 92% code quality score this month with consistent test coverage.',
      confidence: 95,
      color: 'from-github-green to-cyan-glow',
      borderColor: 'border-github-green/30',
    },
    {
      type: 'warning',
      icon: AlertTriangle,
      title: 'PR Review Bottleneck Detected',
      description: 'Average PR review time has increased by 23% in the past week. Consider redistributing review load.',
      confidence: 88,
      color: 'from-purple-accent to-blue-accent',
      borderColor: 'border-purple-accent/30',
    },
    {
      type: 'info',
      icon: Lightbulb,
      title: 'Refactoring Opportunity',
      description: 'AI detected 3 files with high complexity in the authentication module. Recommended for refactoring.',
      confidence: 82,
      color: 'from-cyan-glow to-blue-accent',
      borderColor: 'border-cyan-glow/30',
    },
  ];

  const predictions = [
    { label: 'Sprint Completion', prediction: '95%', trend: 'up', color: 'text-github-green' },
    { label: 'Code Quality Next Week', prediction: '91%', trend: 'stable', color: 'text-cyan-glow' },
    { label: 'Bug Detection Risk', prediction: 'Low', trend: 'down', color: 'text-purple-accent' },
  ];

  const recommendations = [
    {
      title: 'Optimize CI/CD Pipeline',
      description: 'Reduce build time by 30% by parallelizing test suites',
      impact: 'High',
      effort: 'Medium',
    },
    {
      title: 'Improve Documentation',
      description: 'Add inline comments to 12 complex functions in core modules',
      impact: 'Medium',
      effort: 'Low',
    },
    {
      title: 'Reduce Technical Debt',
      description: 'Refactor legacy authentication system',
      impact: 'High',
      effort: 'High',
    },
  ];

  const anomalies = [
    { time: '2 hours ago', event: 'Unusual commit pattern detected in data-pipeline repo', severity: 'medium' },
    { time: '5 hours ago', event: 'Spike in failing tests in web-platform', severity: 'high' },
    { time: '1 day ago', event: 'Decreased activity from top contributor Sarah Chen', severity: 'low' },
  ];

  const getSeverityColor = (severity: string) => {
    if (severity === 'high') return 'text-destructive';
    if (severity === 'medium') return 'text-purple-accent';
    return 'text-cyan-glow';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">AI Insights & Predictions</h2>
        <p className="text-muted-foreground">Intelligent analytics powered by machine learning</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {predictions.map((pred, i) => (
          <div key={i} className="p-6 rounded-xl bg-card border border-card-border backdrop-blur-sm shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <Brain className={`size-4 ${pred.color}`} />
              <span className="text-sm text-muted-foreground">{pred.label}</span>
            </div>
            <p className="text-3xl font-semibold mb-1">{pred.prediction}</p>
            <div className="flex items-center gap-1 text-xs">
              {pred.trend === 'up' && <TrendingUp className="size-3 text-github-green" />}
              <span className="text-muted-foreground">AI Prediction</span>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {aiInsights.map((insight, i) => {
          const Icon = insight.icon;
          return (
            <div
              key={i}
              className={`p-6 rounded-xl bg-gradient-to-br ${insight.color} bg-opacity-5 border ${insight.borderColor} backdrop-blur-sm shadow-lg`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg bg-gradient-to-br ${insight.color} bg-opacity-10`}>
                  <Icon className="size-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold">{insight.title}</h3>
                    <div className="flex items-center gap-2">
                      <Sparkles className="size-4 text-purple-accent" />
                      <span className="text-sm text-muted-foreground">{insight.confidence}% confidence</span>
                    </div>
                  </div>
                  <p className="text-muted-foreground">{insight.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl bg-card border border-card-border backdrop-blur-sm shadow-lg">
          <div className="flex items-center gap-2 mb-6">
            <Lightbulb className="size-5 text-github-green" />
            <h3 className="text-lg font-semibold">AI Recommendations</h3>
          </div>
          <div className="space-y-3">
            {recommendations.map((rec, i) => (
              <div key={i} className="p-4 rounded-lg bg-accent hover:bg-accent/80 transition-all cursor-pointer">
                <h4 className="font-semibold mb-2">{rec.title}</h4>
                <p className="text-sm text-muted-foreground mb-3">{rec.description}</p>
                <div className="flex gap-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-github-green/20 text-github-green">
                    Impact: {rec.impact}
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-purple-accent/20 text-purple-accent">
                    Effort: {rec.effort}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-xl bg-card border border-card-border backdrop-blur-sm shadow-lg">
          <div className="flex items-center gap-2 mb-6">
            <AlertTriangle className="size-5 text-purple-accent" />
            <h3 className="text-lg font-semibold">Anomaly Detection</h3>
          </div>
          <div className="space-y-3">
            {anomalies.map((anomaly, i) => (
              <div key={i} className="p-4 rounded-lg bg-accent">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs text-muted-foreground">{anomaly.time}</span>
                  <span className={`text-xs font-mono ${getSeverityColor(anomaly.severity)}`}>
                    {anomaly.severity.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm">{anomaly.event}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 rounded-xl bg-gradient-to-br from-purple-accent/10 to-blue-accent/10 border border-purple-accent/20 backdrop-blur-sm shadow-lg">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-purple-accent/20">
            <Brain className="size-6 text-purple-accent" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">Ask AI Assistant</h3>
            <div className="relative">
              <input
                type="text"
                placeholder="Ask anything about your repositories, team performance, or code quality..."
                className="w-full px-4 py-3 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-accent/50"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-md bg-gradient-to-r from-purple-accent to-blue-accent text-white text-sm font-medium hover:opacity-90 transition-opacity">
                Ask AI
              </button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                'How can we improve code review time?',
                'Which repositories need attention?',
                'Predict next sprint velocity',
              ].map((suggestion, i) => (
                <button
                  key={i}
                  className="text-xs px-3 py-1.5 rounded-full bg-accent hover:bg-accent/80 text-muted-foreground transition-all"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
