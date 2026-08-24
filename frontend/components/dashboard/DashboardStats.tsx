import type { ReactNode } from "react";

interface StatCard {
  label: string;
  value: string | number;
  icon: ReactNode;
  trend?: { value: number; isUp: boolean };
}

export default function DashboardStats({ stats }: { stats: StatCard[] }) {
  return (
    <div className="dashboard-stats-grid">
      {stats.map((stat, i) => (
        <div key={i} className="dashboard-stat-card">
          <div className="flex items-center justify-between mb-sm">
            <span className="text-caption text-foreground/60 font-medium">
              {stat.label}
            </span>
            <span className="text-foreground/40">{stat.icon}</span>
          </div>
          <div className="flex items-baseline gap-2xs">
            <span className="text-h3 font-extrabold text-foreground">
              {stat.value}
            </span>
            {stat.trend && (
              <span
                className={`text-small font-semibold ${
                  stat.trend.isUp ? "text-success" : "text-destructive"
                }`}
              >
                {stat.trend.isUp ? "↑" : "↓"} {Math.abs(stat.trend.value)}%
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
