"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  Brain,
  DollarSign,
  Clock,
  Zap,
  TrendingUp,
  RefreshCw,
  ChevronRight,
  Activity,
  Users,
  MessageSquare,
  FileText,
  Target,
  Lightbulb,
} from "lucide-react";
import Link from "next/link";
import { Breadcrumbs } from "@/components/ui/Breadcrumb";

interface UsageData {
  summary: {
    totalRequests: number;
    totalTokens: number;
    promptTokens: number;
    completionTokens: number;
    totalCostCents: number;
    totalCostDollars: string;
    avgLatencyMs: number;
  };
  byFeature: {
    feature: string;
    requests: number;
    tokens: number;
    costCents: number;
    avgLatencyMs: number;
  }[];
  byMember: {
    memberId: string | null;
    memberName: string;
    requests: number;
    tokens: number;
    costCents: number;
  }[];
  daily: {
    date: string;
    requests: number;
    tokens: number;
    costCents: number;
  }[];
  recentLogs: {
    id: string;
    feature: string;
    model: string;
    tokens: number;
    costCents: number;
    latencyMs: number;
    success: boolean;
    memberName: string;
    createdAt: string;
  }[];
  period: string;
}

type Period = "week" | "month" | "all";

const FEATURE_ICONS: Record<string, React.ElementType> = {
  "enhance-shoutout": MessageSquare,
  "team-narrative": Users,
  chat: Brain,
  "generate-bio": FileText,
  "gap-recommendations": Target,
  "development-insights": Lightbulb,
  "executive-summary": TrendingUp,
  default: Sparkles,
};

const FEATURE_LABELS: Record<string, string> = {
  "enhance-shoutout": "Shoutout Enhancement",
  "team-narrative": "Team Narrative",
  chat: "AI Chat",
  "generate-bio": "Bio Generation",
  "gap-recommendations": "Gap Recommendations",
  "development-insights": "Development Insights",
  "executive-summary": "Executive Summary",
  "recognition-starters": "Recognition Starters",
  "improve-skill-request": "Skill Request Improvement",
};

export default function AdminAIPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("week");

  const isAdmin = session?.user?.role === "OWNER" || session?.user?.role === "ADMIN";

  useEffect(() => {
    if (!isAdmin) {
      router.push("/dashboard");
      return;
    }
    fetchUsage();
  }, [isAdmin, router, period]);

  const fetchUsage = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/ai/usage?period=${period}`);
      if (response.ok) {
        const result = await response.json();
        setUsage(result.data);
      }
    } catch (err) {
      console.error("Failed to fetch AI usage:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return null;
  }

  const getFeatureIcon = (feature: string) => {
    const Icon = FEATURE_ICONS[feature] || FEATURE_ICONS.default;
    return Icon;
  };

  const getFeatureLabel = (feature: string) => {
    return FEATURE_LABELS[feature] || feature.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const formatCost = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatTokens = (tokens: number) => {
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
    return tokens.toString();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Breadcrumbs
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "AI Usage" },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-domain-strategic" />
            AI Usage Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor AI feature usage, costs, and performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border p-1">
            {(["week", "month", "all"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-md transition-colors",
                  period === p
                    ? "bg-domain-strategic text-white"
                    : "hover:bg-muted"
                )}
              >
                {p === "week" ? "Week" : p === "month" ? "Month" : "All Time"}
              </button>
            ))}
          </div>
          <Button variant="outline" onClick={fetchUsage} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {loading && !usage ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 w-24 bg-muted rounded" />
                  <div className="h-8 w-16 bg-muted rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : usage ? (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Requests</p>
                    <p className="text-3xl font-bold">{usage.summary.totalRequests}</p>
                    <p className="text-xs text-muted-foreground">
                      AI API calls
                    </p>
                  </div>
                  <Activity className="h-6 w-6 text-domain-strategic" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Tokens</p>
                    <p className="text-3xl font-bold">{formatTokens(usage.summary.totalTokens)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatTokens(usage.summary.promptTokens)} in / {formatTokens(usage.summary.completionTokens)} out
                    </p>
                  </div>
                  <Zap className="h-6 w-6 text-domain-executing" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Cost</p>
                    <p className="text-3xl font-bold">${usage.summary.totalCostDollars}</p>
                    <p className="text-xs text-muted-foreground">
                      ~${(usage.summary.totalCostCents / Math.max(usage.summary.totalRequests, 1) / 100).toFixed(3)}/request
                    </p>
                  </div>
                  <DollarSign className="h-6 w-6 text-domain-influencing" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Latency</p>
                    <p className="text-3xl font-bold">{usage.summary.avgLatencyMs}ms</p>
                    <p className="text-xs text-muted-foreground">
                      Response time
                    </p>
                  </div>
                  <Clock className="h-6 w-6 text-domain-relationship" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Second Row */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Usage by Feature */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Usage by Feature</CardTitle>
                <CardDescription>Breakdown of AI usage by feature type</CardDescription>
              </CardHeader>
              <CardContent>
                {usage.byFeature.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No AI usage data for this period
                  </p>
                ) : (
                  <div className="space-y-3">
                    {usage.byFeature.map((f) => {
                      const Icon = getFeatureIcon(f.feature);
                      const maxTokens = Math.max(...usage.byFeature.map((x) => x.tokens));
                      const percentage = (f.tokens / maxTokens) * 100;

                      return (
                        <div key={f.feature} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4 text-domain-strategic" />
                              <span className="text-sm font-medium">
                                {getFeatureLabel(f.feature)}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-sm text-muted-foreground">
                                {f.requests} calls · {formatTokens(f.tokens)} tokens
                              </span>
                            </div>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-domain-strategic transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{formatCost(f.costCents)}</span>
                            <span>{f.avgLatencyMs}ms avg</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Users */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Top AI Users</CardTitle>
                <CardDescription>Team members using AI features most</CardDescription>
              </CardHeader>
              <CardContent>
                {usage.byMember.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No user data for this period
                  </p>
                ) : (
                  <div className="space-y-3">
                    {usage.byMember.slice(0, 10).map((m, idx) => (
                      <div
                        key={m.memberId || idx}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-muted"
                      >
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            "text-lg font-bold w-6",
                            idx === 0 && "text-amber-500",
                            idx === 1 && "text-slate-400",
                            idx === 2 && "text-amber-600",
                            idx > 2 && "text-muted-foreground"
                          )}>
                            #{idx + 1}
                          </span>
                          <span className="text-sm font-medium">{m.memberName}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm">{m.requests} calls</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            ({formatCost(m.costCents)})
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Recent AI Activity</CardTitle>
                  <CardDescription>Latest AI API calls</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {usage.recentLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No recent activity
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2 font-medium">Feature</th>
                        <th className="text-left py-2 px-2 font-medium">User</th>
                        <th className="text-left py-2 px-2 font-medium">Model</th>
                        <th className="text-right py-2 px-2 font-medium">Tokens</th>
                        <th className="text-right py-2 px-2 font-medium">Cost</th>
                        <th className="text-right py-2 px-2 font-medium">Latency</th>
                        <th className="text-right py-2 px-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usage.recentLogs.map((log) => (
                        <tr key={log.id} className="border-b last:border-0">
                          <td className="py-2 px-2">
                            <span className="text-xs bg-muted px-2 py-0.5 rounded">
                              {getFeatureLabel(log.feature)}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-muted-foreground">
                            {log.memberName}
                          </td>
                          <td className="py-2 px-2 text-muted-foreground font-mono text-xs">
                            {log.model}
                          </td>
                          <td className="py-2 px-2 text-right">{formatTokens(log.tokens)}</td>
                          <td className="py-2 px-2 text-right">{formatCost(log.costCents)}</td>
                          <td className="py-2 px-2 text-right">{log.latencyMs}ms</td>
                          <td className="py-2 px-2 text-right">
                            <span className={cn(
                              "inline-block w-2 h-2 rounded-full",
                              log.success ? "bg-green-500" : "bg-red-500"
                            )} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">AI Administration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" asChild>
                  <Link href="/admin/ai/prompts">
                    <FileText className="h-4 w-4 mr-2" />
                    Manage Prompts
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/admin/dashboard">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Manager Dashboard
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Unable to load AI usage data</p>
            <Button onClick={fetchUsage} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
