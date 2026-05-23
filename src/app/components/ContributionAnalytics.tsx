import { Calendar, Flame, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function ContributionAnalytics() {
  const generateHeatmapData = () => {
    const data = [];
    for (let week = 0; week < 52; week++) {
      for (let day = 0; day < 7; day++) {
        data.push({
          week,
          day,
          count: Math.floor(Math.random() * 20),
        });
      }
    }
    return data;
  };

  const heatmapData = generateHeatmapData();

  const getHeatmapColor = (count: number) => {
    if (count === 0) return 'rgba(255, 255, 255, 0.05)';
    if (count < 5) return 'rgba(46, 160, 67, 0.3)';
    if (count < 10) return 'rgba(46, 160, 67, 0.5)';
    if (count < 15) return 'rgba(46, 160, 67, 0.7)';
    return '#2ea043';
  };

  const monthlyData = [
    { month: 'Jan', commits: 145, prs: 23, reviews: 34 },
    { month: 'Feb', commits: 189, prs: 28, reviews: 41 },
    { month: 'Mar', commits: 234, prs: 35, reviews: 52 },
    { month: 'Apr', commits: 198, prs: 31, reviews: 45 },
    { month: 'May', commits: 256, prs: 42, reviews: 58 },
    { month: 'Jun', commits: 312, prs: 48, reviews: 67 },
  ];

  const streakData = [
    { label: 'Current Streak', value: '23 days', icon: Flame, color: 'text-github-green' },
    { label: 'Longest Streak', value: '67 days', icon: TrendingUp, color: 'text-purple-accent' },
    { label: 'Total Contributions', value: '1,247', icon: Calendar, color: 'text-cyan-glow' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Contribution Analytics</h2>
        <p className="text-muted-foreground">Track your coding activity and contribution patterns</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {streakData.map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="p-6 rounded-xl bg-card border border-card-border backdrop-blur-sm shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <Icon className={`size-5 ${item.color}`} />
                <span className="text-sm text-muted-foreground">{item.label}</span>
              </div>
              <p className="text-3xl font-semibold">{item.value}</p>
            </div>
          );
        })}
      </div>

      <div className="p-6 rounded-xl bg-card border border-card-border backdrop-blur-sm shadow-lg">
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-1">Contribution Heatmap</h3>
          <p className="text-sm text-muted-foreground">Your activity over the past year</p>
        </div>

        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            <div className="flex gap-1 mb-2 text-xs text-muted-foreground pl-6">
              <div className="w-3"></div>
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, i) => (
                <div key={i} className="w-12 text-center">
                  {month}
                </div>
              ))}
            </div>

            <div className="flex gap-1">
              <div className="flex flex-col gap-1 text-xs text-muted-foreground pr-2">
                <div className="h-3">Mon</div>
                <div className="h-3"></div>
                <div className="h-3">Wed</div>
                <div className="h-3"></div>
                <div className="h-3">Fri</div>
                <div className="h-3"></div>
                <div className="h-3">Sun</div>
              </div>

              <div className="flex gap-1">
                {Array.from({ length: 52 }).map((_, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-1">
                    {Array.from({ length: 7 }).map((_, dayIndex) => {
                      const dataPoint = heatmapData.find((d) => d.week === weekIndex && d.day === dayIndex);
                      return (
                        <div
                          key={dayIndex}
                          className="size-3 rounded-sm transition-all hover:ring-2 hover:ring-github-green cursor-pointer"
                          style={{ backgroundColor: getHeatmapColor(dataPoint?.count || 0) }}
                          title={`${dataPoint?.count || 0} contributions`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
              <span>Less</span>
              <div className="flex gap-1">
                {[0, 5, 10, 15, 20].map((count, i) => (
                  <div
                    key={i}
                    className="size-3 rounded-sm"
                    style={{ backgroundColor: getHeatmapColor(count) }}
                  />
                ))}
              </div>
              <span>More</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-xl bg-card border border-card-border backdrop-blur-sm shadow-lg">
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-1">Monthly Trends</h3>
          <p className="text-sm text-muted-foreground">Commits, pull requests, and code reviews</p>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={monthlyData}>
            <defs>
              <linearGradient id="commitsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2ea043" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#2ea043" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="prsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="reviewsGradient" x1="0" y1="0" x2="0" y2="1">
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
            <Area type="monotone" dataKey="commits" stroke="#2ea043" fillOpacity={1} fill="url(#commitsGradient)" />
            <Area type="monotone" dataKey="prs" stroke="#8b5cf6" fillOpacity={1} fill="url(#prsGradient)" />
            <Area type="monotone" dataKey="reviews" stroke="#06b6d4" fillOpacity={1} fill="url(#reviewsGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl bg-card border border-card-border backdrop-blur-sm shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Peak Coding Hours</h3>
          <div className="space-y-3">
            {[
              { time: '9:00 AM - 11:00 AM', percentage: 85 },
              { time: '2:00 PM - 4:00 PM', percentage: 92 },
              { time: '7:00 PM - 9:00 PM', percentage: 68 },
            ].map((slot, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">{slot.time}</span>
                  <span className="font-mono text-github-green">{slot.percentage}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-github-green to-cyan-glow transition-all"
                    style={{ width: `${slot.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-xl bg-card border border-card-border backdrop-blur-sm shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Activity by Day</h3>
          <div className="space-y-3">
            {[
              { day: 'Monday', commits: 89 },
              { day: 'Tuesday', commits: 102 },
              { day: 'Wednesday', commits: 76 },
              { day: 'Thursday', commits: 95 },
              { day: 'Friday', commits: 88 },
              { day: 'Saturday', commits: 34 },
              { day: 'Sunday', commits: 28 },
            ].map((dayData, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground w-20">{dayData.day}</span>
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-purple-accent transition-all"
                    style={{ width: `${(dayData.commits / 102) * 100}%` }}
                  />
                </div>
                <span className="font-mono text-sm w-12 text-right">{dayData.commits}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
