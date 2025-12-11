"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ThemeBadge } from "@/components/strengths/ThemeBadge";
import { DomainIcon } from "@/components/strengths/DomainIcon";
import { Avatar, AvatarFallback } from "@/components/ui/Avatar";
import Link from "next/link";
import {
  Users,
  MessageSquare,
  Trophy,
  Flame,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Target,
  Upload,
  Zap,
  Handshake,
  RefreshCw,
} from "lucide-react";
import type { DomainSlug } from "@/constants/strengths-data";

interface DashboardData {
  myStrengths: {
    themeSlug: string;
    themeName: string;
    domain: DomainSlug;
    rank: number;
  }[];
  teamStats: {
    totalMembers: number;
    membersWithStrengths: number;
    shoutoutsThisWeek: number;
  };
  recentShoutouts: {
    id: string;
    message: string;
    createdAt: string;
    giver: { name: string };
    receiver: { name: string };
    theme?: { name: string; domain: { slug: string } };
  }[];
  suggestedPartner?: {
    memberId: string;
    memberName: string;
    topTheme: string;
    reason: string;
  };
  myPoints: number;
  myStreak: number;
}

const WELCOME_STEPS = [
  {
    title: "Upload Team Strengths",
    description: "Import CliftonStrengths reports for your team members",
    href: "/admin/upload",
    icon: Upload,
    color: "executing" as const,
    adminOnly: true,
  },
  {
    title: "Invite Your Team",
    description: "Send invite codes so team members can join",
    href: "/settings/invites",
    icon: Users,
    color: "relationship" as const,
    adminOnly: true,
  },
  {
    title: "Give Your First Shoutout",
    description: "Recognize a teammate for demonstrating their strengths",
    href: "/shoutouts/create",
    icon: MessageSquare,
    color: "influencing" as const,
    adminOnly: false,
  },
  {
    title: "Start a Challenge",
    description: "Launch a team activity like Strengths Bingo",
    href: "/challenges",
    icon: Zap,
    color: "strategic" as const,
    adminOnly: false,
  },
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = session?.user?.role === "OWNER" || session?.user?.role === "ADMIN";

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/dashboard");
      if (response.ok) {
        const result = await response.json();
        setData(result.data);
      }
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const visibleSteps = WELCOME_STEPS.filter((step) => !step.adminOnly || isAdmin);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Welcome header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">
            Welcome back, {session?.user?.name?.split(" ")[0]}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Here&apos;s what&apos;s happening with your team today.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchDashboardData} size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {isAdmin && (
            <Button variant="executing" asChild>
              <Link href="/admin/upload">
                <Upload className="h-4 w-4 mr-2" />
                Upload Strengths
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-interactive">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Team Members</p>
                <p className="text-3xl font-display font-bold mt-1">
                  {loading ? "-" : data?.teamStats.totalMembers || 0}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-domain-relationship-light flex items-center justify-center">
                <Users className="h-6 w-6 text-domain-relationship" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-interactive">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Shoutouts This Week</p>
                <p className="text-3xl font-display font-bold mt-1">
                  {loading ? "-" : data?.teamStats.shoutoutsThisWeek || 0}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-domain-influencing-light flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-domain-influencing" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-interactive">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Your Streak</p>
                <p className="text-3xl font-display font-bold mt-1">
                  {loading ? "-" : `${data?.myStreak || 0} days`}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <Flame className="h-6 w-6 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-interactive">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Your Points</p>
                <p className="text-3xl font-display font-bold mt-1">
                  {loading ? "-" : (data?.myPoints || 0).toLocaleString()}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Trophy className="h-6 w-6 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* My Top Strengths */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-domain-executing" />
                  <CardTitle>My Top Strengths</CardTitle>
                </div>
                {session?.user?.memberId && (
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/team/${session.user.memberId}`}>
                      View Full Profile
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                )}
              </div>
              <CardDescription>Your signature themes</CardDescription>
            </CardHeader>
            <CardContent>
              {data?.myStrengths && data.myStrengths.length > 0 ? (
                <div className="grid sm:grid-cols-5 gap-3">
                  {data.myStrengths.slice(0, 5).map((strength) => (
                    <div
                      key={strength.themeSlug}
                      className="flex flex-col items-center text-center p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <span className="text-2xl font-bold text-muted-foreground mb-2">
                        #{strength.rank}
                      </span>
                      <DomainIcon domain={strength.domain} size="lg" withBackground />
                      <span className="font-medium text-sm mt-2">{strength.themeName}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Target className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h4 className="font-medium">No Strengths Yet</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Ask your admin to upload your CliftonStrengths report
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Shoutouts */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-domain-influencing" />
                  <CardTitle>Recent Shoutouts</CardTitle>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/shoutouts">
                    View All
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
              <CardDescription>Latest recognition from your team</CardDescription>
            </CardHeader>
            <CardContent>
              {data?.recentShoutouts && data.recentShoutouts.length > 0 ? (
                <div className="space-y-4">
                  {data.recentShoutouts.slice(0, 3).map((shoutout) => (
                    <div
                      key={shoutout.id}
                      className="flex items-start gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <Avatar>
                        <AvatarFallback className="bg-domain-influencing-light text-domain-influencing">
                          {getInitials(shoutout.giver.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{shoutout.giver.name}</span>
                          <span className="text-muted-foreground">→</span>
                          <span className="font-medium">{shoutout.receiver.name}</span>
                          {shoutout.theme && (
                            <ThemeBadge
                              themeName={shoutout.theme.name}
                              domainSlug={shoutout.theme.domain.slug as DomainSlug}
                              size="sm"
                            />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {shoutout.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(shoutout.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h4 className="font-medium">No Shoutouts Yet</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Be the first to recognize a teammate!
                  </p>
                  <Button variant="influencing" className="mt-4" asChild>
                    <Link href="/shoutouts/create">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Give Shoutout
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Getting started */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                <CardTitle>Getting Started</CardTitle>
              </div>
              <CardDescription>
                Complete these steps to get the most out of StrengthSync
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                {visibleSteps.map((step) => (
                  <Link key={step.href} href={step.href}>
                    <Card
                      variant={step.color}
                      interactive
                      className="h-full p-4"
                    >
                      <div className="flex items-start gap-3">
                        <DomainIcon domain={step.color} size="lg" withBackground />
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm">{step.title}</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {step.description}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Suggested Partner */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Handshake className="h-5 w-5 text-domain-relationship" />
                <CardTitle className="text-lg">Suggested Partner</CardTitle>
              </div>
              <CardDescription>
                Someone with complementary strengths
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data?.suggestedPartner ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-domain-relationship-light/50 to-domain-strategic-light/50">
                    <Avatar className="h-14 w-14 ring-2 ring-offset-2 ring-domain-relationship/30">
                      <AvatarFallback className="text-lg bg-domain-relationship-light text-domain-relationship">
                        {getInitials(data.suggestedPartner.memberName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate">
                        {data.suggestedPartner.memberName}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {data.suggestedPartner.topTheme}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {data.suggestedPartner.reason}
                  </p>
                  <Button variant="relationship" className="w-full" asChild>
                    <Link href={`/team/${data.suggestedPartner.memberId}`}>
                      View Profile
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                    <Handshake className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Upload more strengths to see suggestions
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/shoutouts/create">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Give a Shoutout
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/marketplace/create">
                  <Target className="h-4 w-4 mr-2" />
                  Post a Skill Request
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/directory">
                  <Users className="h-4 w-4 mr-2" />
                  Find Team Members
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/team">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View Team Analytics
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Domain overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Strength Domains</CardTitle>
              <CardDescription>The four categories of CliftonStrengths</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { domain: "executing" as const, name: "Executing", desc: "Making things happen" },
                { domain: "influencing" as const, name: "Influencing", desc: "Taking charge" },
                { domain: "relationship" as const, name: "Relationship", desc: "Building bonds" },
                { domain: "strategic" as const, name: "Strategic", desc: "Better decisions" },
              ].map((d) => (
                <div key={d.domain} className="flex items-center gap-3">
                  <DomainIcon domain={d.domain} size="default" withBackground />
                  <div>
                    <p className="text-sm font-medium">{d.name}</p>
                    <p className="text-xs text-muted-foreground">{d.desc}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
