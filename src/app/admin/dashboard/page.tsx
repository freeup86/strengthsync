"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DomainIcon } from "@/components/strengths/DomainIcon";
import { ErrorBoundary } from "@/components/effects/ErrorBoundary";
import { Skeleton, SkeletonDashboardStats } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Users,
  MessageSquare,
  Trophy,
  Target,
  TrendingUp,
  TrendingDown,
  Activity,
  Handshake,
  Gamepad2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Calendar,
  Sparkles,
  ChevronDown,
  ChevronUp,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { Breadcrumbs } from "@/components/ui/Breadcrumb";
import type { DomainSlug } from "@/constants/strengths-data";

interface HealthMetrics {
  // Team overview
  totalMembers: number;
  membersWithStrengths: number;
  strengthsUploadRate: number;

  // Engagement
  activeUsersThisWeek: number;
  activeUsersLastWeek: number;
  engagementTrend: number;

  // Recognition
  shoutoutsThisWeek: number;
  shoutoutsLastWeek: number;
  shoutoutsTrend: number;
  avgShoutoutsPerMember: number;

  // Challenges
  activeChallenges: number;
  challengeParticipationRate: number;

  // Mentorship
  activeMentorships: number;
  mentorshipRequestsThisMonth: number;

  // Leaderboard
  topContributors: {
    id: string;
    name: string;
    points: number;
    shoutoutsGiven: number;
    shoutoutsReceived: number;
  }[];

  // Domain distribution
  domainBalance: {
    domain: DomainSlug;
    percentage: number;
  }[];

  // Alerts
  alerts: {
    type: "warning" | "info" | "success";
    message: string;
  }[];
}

interface ExecutiveSummary {
  headline: string;
  highlights: string[];
  concerns: string[];
  engagement: {
    score: string;
    trend: string;
    insight: string;
  };
  teamHealth: {
    strengthsUtilization: string;
    recognition: string;
    collaboration: string;
  };
  recommendations?: {
    priority: number;
    action: string;
    rationale: string;
  }[];
  period: string;
  dateRange: {
    start: string;
    end: string;
  };
}

type SummaryPeriod = "week" | "month" | "quarter";

export default function ManagerDashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [metrics, setMetrics] = useState<HealthMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  // Executive Summary state
  const [summaryPeriod, setSummaryPeriod] = useState<SummaryPeriod>("month");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summary, setSummary] = useState<ExecutiveSummary | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);

  const isAdmin = session?.user?.role === "OWNER" || session?.user?.role === "ADMIN";

  useEffect(() => {
    if (!isAdmin) {
      router.push("/dashboard");
      return;
    }
    fetchMetrics();
  }, [isAdmin, router]);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/health-metrics");
      if (response.ok) {
        const result = await response.json();
        setMetrics(result.data);
      }
    } catch (err) {
      console.error("Failed to fetch metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchExecutiveSummary = async (period: SummaryPeriod = summaryPeriod) => {
    setSummaryLoading(true);
    setSummaryError(null);

    try {
      const response = await fetch("/api/ai/executive-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          period,
          includeRecommendations: true,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setSummaryError(result.error?.message || "Failed to generate summary");
        return;
      }

      setSummary(result.data);
      setShowSummary(true);
    } catch (err) {
      console.error("Executive summary error:", err);
      setSummaryError("Failed to generate summary. Please try again.");
    } finally {
      setSummaryLoading(false);
    }
  };

  if (!isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">Manager Dashboard</h1>
            <Skeleton className="h-4 w-56 mt-1" />
          </div>
        </div>
        <SkeletonDashboardStats />
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6 space-y-4">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-40 w-full rounded-xl" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="pt-6 space-y-3">
            <Skeleton className="h-5 w-36" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-8 w-20 rounded" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold">Unable to load metrics</h2>
        <Button onClick={fetchMetrics} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Activity className="h-4 w-4 text-muted-foreground" />;
  };

  const getTrendText = (trend: number) => {
    if (trend > 0) return `+${trend}%`;
    if (trend < 0) return `${trend}%`;
    return "0%";
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Breadcrumbs
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Dashboard" },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            Manager Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Team health metrics and engagement insights
          </p>
        </div>
        <Button variant="outline" onClick={fetchMetrics}>
          <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Alerts */}
      {metrics.alerts.length > 0 && (
        <div className="space-y-2">
          {metrics.alerts.map((alert, idx) => (
            <div
              key={idx}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg",
                alert.type === "warning" && "bg-amber-100 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300",
                alert.type === "info" && "bg-blue-100 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300",
                alert.type === "success" && "bg-green-100 dark:bg-green-950/30 text-green-800 dark:text-green-300"
              )}
            >
              {alert.type === "warning" && <AlertCircle className="h-5 w-5 flex-shrink-0" />}
              {alert.type === "success" && <CheckCircle2 className="h-5 w-5 flex-shrink-0" />}
              {alert.type === "info" && <Activity className="h-5 w-5 flex-shrink-0" />}
              <span className="text-sm">{alert.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* AI Executive Summary */}
      <ErrorBoundary>
      <Card className="border-domain-strategic/30">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-domain-strategic" />
              <CardTitle className="text-lg">AI Executive Summary</CardTitle>
            </div>
            {summary && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSummary(!showSummary)}
              >
                {showSummary ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
          <CardDescription>
            AI-generated insights and recommendations for leadership
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!summary ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Period:</span>
                <div className="flex gap-1">
                  {(["week", "month", "quarter"] as SummaryPeriod[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => setSummaryPeriod(p)}
                      className={cn(
                        "px-3 py-1 text-sm rounded-full border transition-colors",
                        summaryPeriod === p
                          ? "bg-domain-strategic text-white border-domain-strategic"
                          : "hover:bg-muted"
                      )}
                    >
                      {p === "week" ? "Week" : p === "month" ? "Month" : "Quarter"}
                    </button>
                  ))}
                </div>
              </div>
              <Button
                onClick={() => fetchExecutiveSummary()}
                disabled={summaryLoading}
                className="w-full bg-domain-strategic hover:bg-domain-strategic/90"
              >
                {summaryLoading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Generating summary...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Executive Summary
                  </>
                )}
              </Button>
              {summaryError && (
                <p className="text-sm text-red-500 text-center">{summaryError}</p>
              )}
            </div>
          ) : showSummary ? (
            <div className="space-y-4 animate-in slide-in-from-top-2">
              {/* Headline */}
              <div className="p-4 rounded-lg bg-domain-strategic/10 border border-domain-strategic/20">
                <p className="text-sm font-medium">{summary.headline}</p>
              </div>

              {/* Highlights */}
              {summary.highlights.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Highlights
                  </h4>
                  <ul className="space-y-1">
                    {summary.highlights.map((h, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-green-600">•</span>
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Concerns */}
              {summary.concerns.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    Areas of Attention
                  </h4>
                  <ul className="space-y-1">
                    {summary.concerns.map((c, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-amber-600">•</span>
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Engagement & Team Health */}
              <div className="grid gap-3 md:grid-cols-2">
                <div className="p-3 rounded-lg bg-muted/50">
                  <h5 className="text-xs font-medium text-muted-foreground mb-2">Engagement</h5>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Score:</span>
                      <span className={cn(
                        "font-medium",
                        summary.engagement.score === "high" && "text-green-600",
                        summary.engagement.score === "medium" && "text-amber-600",
                        summary.engagement.score === "low" && "text-red-600"
                      )}>
                        {summary.engagement.score.charAt(0).toUpperCase() + summary.engagement.score.slice(1)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Trend:</span>
                      <span className={cn(
                        "font-medium",
                        summary.engagement.trend === "improving" && "text-green-600",
                        summary.engagement.trend === "stable" && "text-muted-foreground",
                        summary.engagement.trend === "declining" && "text-red-600"
                      )}>
                        {summary.engagement.trend.charAt(0).toUpperCase() + summary.engagement.trend.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <h5 className="text-xs font-medium text-muted-foreground mb-2">Team Health</h5>
                  <p className="text-xs text-muted-foreground">
                    <strong>Strengths:</strong> {summary.teamHealth.strengthsUtilization}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    <strong>Recognition:</strong> {summary.teamHealth.recognition}
                  </p>
                </div>
              </div>

              {/* Recommendations */}
              {summary.recommendations && summary.recommendations.length > 0 && (
                <div className="pt-3 border-t">
                  <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
                    <Target className="h-4 w-4 text-domain-strategic" />
                    Recommendations
                  </h4>
                  <div className="space-y-2">
                    {summary.recommendations
                      .sort((a, b) => a.priority - b.priority)
                      .map((rec, i) => (
                        <div key={i} className="p-3 rounded-lg border bg-card">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="flex items-center justify-center h-5 w-5 rounded-full bg-domain-strategic text-white text-xs font-bold">
                              {rec.priority}
                            </span>
                            <span className="text-sm font-medium">{rec.action}</span>
                          </div>
                          <p className="text-xs text-muted-foreground ml-7">{rec.rationale}</p>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Period selector and regenerate */}
              <div className="flex items-center justify-between pt-3 border-t">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Period:</span>
                  <select
                    value={summaryPeriod}
                    onChange={(e) => {
                      const p = e.target.value as SummaryPeriod;
                      setSummaryPeriod(p);
                      fetchExecutiveSummary(p);
                    }}
                    className="text-xs border rounded px-2 py-1 bg-background"
                  >
                    <option value="week">Week</option>
                    <option value="month">Month</option>
                    <option value="quarter">Quarter</option>
                  </select>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fetchExecutiveSummary()}
                  disabled={summaryLoading}
                  className="text-xs"
                >
                  {summaryLoading ? "Regenerating..." : "Regenerate"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <p className="text-sm font-medium">{summary.headline}</p>
                <p className="text-xs text-muted-foreground">
                  {summary.period === "week" ? "Past Week" : summary.period === "month" ? "Past Month" : "Past Quarter"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSummary(true)}
              >
                View Details
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      </ErrorBoundary>

      {/* Key metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Team Size</p>
                <p className="text-3xl font-bold">{metrics.totalMembers}</p>
                <p className="text-xs text-muted-foreground">
                  {metrics.membersWithStrengths} with strengths ({metrics.strengthsUploadRate}%)
                </p>
              </div>
              <Users className="h-6 w-6 text-domain-relationship" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active This Week</p>
                <p className="text-3xl font-bold">{metrics.activeUsersThisWeek}</p>
                <div className="flex items-center gap-1 text-xs">
                  {getTrendIcon(metrics.engagementTrend)}
                  <span className={cn(
                    metrics.engagementTrend > 0 && "text-green-600",
                    metrics.engagementTrend < 0 && "text-red-600"
                  )}>
                    {getTrendText(metrics.engagementTrend)} vs last week
                  </span>
                </div>
              </div>
              <Activity className="h-6 w-6 text-domain-executing" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Shoutouts This Week</p>
                <p className="text-3xl font-bold">{metrics.shoutoutsThisWeek}</p>
                <div className="flex items-center gap-1 text-xs">
                  {getTrendIcon(metrics.shoutoutsTrend)}
                  <span className={cn(
                    metrics.shoutoutsTrend > 0 && "text-green-600",
                    metrics.shoutoutsTrend < 0 && "text-red-600"
                  )}>
                    {getTrendText(metrics.shoutoutsTrend)} vs last week
                  </span>
                </div>
              </div>
              <MessageSquare className="h-6 w-6 text-domain-influencing" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Challenge Participation</p>
                <p className="text-3xl font-bold">{metrics.challengeParticipationRate}%</p>
                <p className="text-xs text-muted-foreground">
                  {metrics.activeChallenges} active challenge{metrics.activeChallenges !== 1 ? "s" : ""}
                </p>
              </div>
              <Gamepad2 className="h-6 w-6 text-domain-strategic" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Domain Balance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Domain Balance</CardTitle>
            <CardDescription>Distribution across top strengths</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.domainBalance.map((d) => (
                <div key={d.domain}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <DomainIcon domain={d.domain} size="sm" />
                      <span className="text-sm font-medium capitalize">{d.domain}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{d.percentage}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        `bg-domain-${d.domain}`
                      )}
                      style={{ width: `${d.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Contributors */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              Top Contributors
            </CardTitle>
            <CardDescription>Most active team members</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.topContributors.slice(0, 5).map((member, idx) => (
                <Link
                  key={member.id}
                  href={`/team/${member.id}`}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted"
                >
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "text-lg font-bold",
                      idx === 0 && "text-amber-500",
                      idx === 1 && "text-slate-400",
                      idx === 2 && "text-amber-600",
                      idx > 2 && "text-muted-foreground"
                    )}>
                      #{idx + 1}
                    </span>
                    <span className="text-sm font-medium">{member.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{member.points} pts</span>
                </Link>
              ))}
            </div>
            <Button variant="ghost" className="w-full mt-2" asChild>
              <Link href="/leaderboard">View Full Leaderboard</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Additional Metrics</CardTitle>
            <CardDescription>Other health indicators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Handshake className="h-5 w-5 text-domain-relationship" />
                <span className="text-sm">Active Mentorships</span>
              </div>
              <span className="font-bold">{metrics.activeMentorships}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-domain-executing" />
                <span className="text-sm">Mentorship Requests (Month)</span>
              </div>
              <span className="font-bold">{metrics.mentorshipRequestsThisMonth}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-domain-influencing" />
                <span className="text-sm">Avg Shoutouts/Member</span>
              </div>
              <span className="font-bold">{metrics.avgShoutoutsPerMember.toFixed(1)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" asChild>
              <Link href="/admin/members">
                <Users className="h-4 w-4 mr-2" />
                Manage Members
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/upload">
                <Target className="h-4 w-4 mr-2" />
                Upload Strengths
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/challenges">
                <Gamepad2 className="h-4 w-4 mr-2" />
                Create Challenge
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/team">
                <BarChart3 className="h-4 w-4 mr-2" />
                Team Analytics
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
