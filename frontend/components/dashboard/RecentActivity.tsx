import type { ActivityLog } from "@/types";
import { Clock } from "lucide-react";

export default function RecentActivity({
  activities,
}: {
  activities: ActivityLog[];
}) {
  return (
    <div className="card-dashboard">
      <h3 className="dashboard-section-title">Recent Activity</h3>
      {activities.length === 0 ? (
        <div className="empty-state">
          <Clock className="empty-state-icon" />
          <p className="empty-state-title">No recent activity</p>
          <p className="empty-state-desc">
            Recent actions and events will appear here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-xs">
          {activities.map((log) => (
            <div
              key={log._id}
              className="flex items-start gap-sm py-2xs border-b border-border last:border-0"
            >
              <div className="avatar avatar-sm shrink-0">
                {(typeof log.userId === 'string' ? log.userId : log.userId?.name ?? '')
                  .charAt(0)
                  .toUpperCase() ?? '?'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-small font-medium text-foreground">
                  {log.action}
                </p>
                {log.targetType && (
                  <p className="text-caption text-foreground/40">
                    {log.targetType}
                  </p>
                )}
              </div>
              <span className="text-caption text-foreground/30 shrink-0 whitespace-nowrap">
                {new Date(log.timestamp).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
