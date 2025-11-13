import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, FileCheck, Share2, Ban, Key } from "lucide-react";
import type { Activity } from "@shared/schema";

interface ActivityFeedProps {
  activities: Activity[];
}

const activityIcons = {
  did_created: Key,
  credential_issued: FileCheck,
  credential_verified: CheckCircle,
  credential_shared: Share2,
  credential_revoked: Ban,
};

const activityColors = {
  did_created: "text-primary",
  credential_issued: "text-status-online",
  credential_verified: "text-chart-1",
  credential_shared: "text-chart-2",
  credential_revoked: "text-destructive",
};

export function ActivityFeed({ activities }: ActivityFeedProps) {
  if (!activities || activities.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-muted-foreground">No activity yet</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {activities.slice(0, 10).map((activity, idx) => {
          const Icon = activityIcons[activity.type as keyof typeof activityIcons] || FileCheck;
          const color = activityColors[activity.type as keyof typeof activityColors] || "text-primary";

          return (
            <div
              key={activity.id}
              className={`flex gap-3 ${idx !== activities.length - 1 && idx !== 9 ? "pb-4 border-b" : ""}`}
              data-testid={`activity-${activity.id}`}
            >
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted ${color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none" data-testid="text-activity-description">
                  {activity.description}
                </p>
                <p className="text-xs text-muted-foreground" data-testid="text-activity-time">
                  {formatRelativeTime(new Date(activity.timestamp))}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
