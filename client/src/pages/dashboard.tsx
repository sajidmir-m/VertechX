import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle, Activity, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Credential, Activity as ActivityType, Did } from "@shared/schema";
import { CredentialCard } from "@/components/credential-card";
import { ActivityFeed } from "@/components/activity-feed";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: did, isLoading: didLoading } = useQuery<Did>({
    queryKey: ["/api/did/current"],
  });

  const { data: credentials, isLoading: credentialsLoading } = useQuery<Credential[]>({
    queryKey: ["/api/credentials"],
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery<ActivityType[]>({
    queryKey: ["/api/activities"],
  });

  const stats = [
    {
      title: "Total Credentials",
      value: credentials?.length || 0,
      icon: Shield,
      description: "Stored securely",
      color: "text-primary",
    },
    {
      title: "Verified",
      value: credentials?.filter(c => c.status === "verified").length || 0,
      icon: CheckCircle,
      description: "Active credentials",
      color: "text-status-online",
    },
    {
      title: "Recent Activity",
      value: activities?.length || 0,
      icon: Activity,
      description: "Last 30 days",
      color: "text-chart-2",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome Back</h1>
        <p className="text-muted-foreground">
          {did ? (
            <>
              Your decentralized identity:{" "}
              <span className="font-mono text-sm" data-testid="text-did-preview">
                {did.didString.substring(0, 30)}...
              </span>
            </>
          ) : (
            "Loading your identity..."
          )}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title} className="p-6" data-testid={`stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
            <div className="flex items-center justify-between mb-4">
              <stat.icon className={`h-8 w-8 ${stat.color}`} />
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                {stat.title}
              </p>
              <p className="text-3xl font-bold mb-1" data-testid={`value-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                {stat.value}
              </p>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent Credentials & Activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Credentials */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recent Credentials</h2>
            <a
              href="/credentials"
              className="text-sm text-primary hover:underline"
              data-testid="link-view-all-credentials"
            >
              View all
            </a>
          </div>

          {credentialsLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <Card key={i} className="p-6">
                  <Skeleton className="h-32 w-full" />
                </Card>
              ))}
            </div>
          ) : credentials && credentials.length > 0 ? (
            <div className="space-y-4">
              {credentials.slice(0, 4).map((credential) => (
                <CredentialCard key={credential.id} credential={credential} compact />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-2">No credentials yet</p>
              <a href="/credentials" className="text-sm text-primary hover:underline">
                Add your first credential
              </a>
            </Card>
          )}
        </div>

        {/* Activity Feed */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Activity</h2>
          {activitiesLoading ? (
            <Card className="p-6">
              <Skeleton className="h-64 w-full" />
            </Card>
          ) : (
            <ActivityFeed activities={activities || []} />
          )}
        </div>
      </div>
    </div>
  );
}
