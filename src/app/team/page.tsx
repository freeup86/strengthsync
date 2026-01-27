"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DomainBalanceChart } from "@/components/team/DomainBalanceChart";
import { ThemeHeatMap } from "@/components/team/ThemeHeatMap";
import { GapAnalysisCard } from "@/components/team/GapAnalysisCard";
import { PartnershipSuggestions } from "@/components/team/PartnershipSuggestions";
import { TeamCanvas } from "@/components/team/TeamCanvas";
import { ProjectPartnerFinder } from "@/components/team/ProjectPartnerFinder";
import { DomainIcon } from "@/components/strengths/DomainIcon";
import { Skeleton, SkeletonDashboardStats } from "@/components/ui/Skeleton";
import {
  Users,
  PieChart,
  TrendingUp,
  Handshake,
  RefreshCw,
  AlertCircle,
  Upload,
  UserPlus,
  Download,
  LayoutGrid,
} from "lucide-react";
import Link from "next/link";
import type { DomainSlug } from "@/constants/strengths-data";

interface CompositionData {
  totalMembers: number;
  membersWithStrengths: number;
  domainComposition: {
    domain: DomainSlug;
    domainName: string;
    color: string;
    count: number;
    percentage: number;
    themes: { slug: string; name: string; count: number }[];
  }[];
  topThemes: {
    slug: string;
    name: string;
    domain: DomainSlug;
    count: number;
    percentage: number;
    members: { id: string; name: string; rank: number }[];
  }[];
  themeFrequency: {
    slug: string;
    name: string;
    domain: DomainSlug;
    count: number;
    percentage: number;
    members: { id: string; name: string; rank: number }[];
  }[];
}

interface GapsData {
  totalMembers: number;
  missingThemes: { slug: string; name: string; domain: DomainSlug }[];
  underrepresentedThemes: {
    slug: string;
    name: string;
    domain: DomainSlug;
    count: number;
    percentage: number;
  }[];
  underrepresentedDomains: { domain: DomainSlug; name: string; percentage: number }[];
  recommendations: string[];
}

interface PartnershipsData {
  partnerships: {
    member1: { id: string; name: string; topTheme: string };
    member2: { id: string; name: string; topTheme: string };
    reason: string;
    complementaryStrength: string;
    score: number;
  }[];
  totalPossiblePairings: number;
}

type TabType = "overview" | "canvas" | "themes" | "gaps" | "partnerships";

export default function TeamPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [composition, setComposition] = useState<CompositionData | null>(null);
  const [gaps, setGaps] = useState<GapsData | null>(null);
  const [partnerships, setPartnerships] = useState<PartnershipsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = session?.user?.role === "OWNER" || session?.user?.role === "ADMIN";

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [compositionRes, gapsRes, partnershipsRes] = await Promise.all([
        fetch("/api/team/composition"),
        fetch("/api/team/gaps"),
        fetch("/api/team/partnerships"),
      ]);

      if (!compositionRes.ok || !gapsRes.ok || !partnershipsRes.ok) {
        throw new Error("Failed to fetch team data");
      }

      const [compositionData, gapsData, partnershipsData] = await Promise.all([
        compositionRes.json(),
        gapsRes.json(),
        partnershipsRes.json(),
      ]);

      setComposition(compositionData.data);
      setGaps(gapsData.data);
      setPartnerships(partnershipsData.data);
    } catch (err) {
      setError("Failed to load team analytics. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "overview" as const, label: "Overview", icon: PieChart },
    { id: "canvas" as const, label: "Team Canvas", icon: LayoutGrid },
    { id: "themes" as const, label: "Themes", icon: TrendingUp },
    { id: "gaps" as const, label: "Gap Analysis", icon: AlertCircle },
    { id: "partnerships" as const, label: "Partnerships", icon: Handshake },
  ];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">Team Analytics</h1>
            <Skeleton className="h-4 w-48 mt-1" />
          </div>
        </div>
        <SkeletonDashboardStats />
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-48 w-full rounded-xl" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 space-y-4">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-48 w-full rounded-xl" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="font-display text-3xl font-bold">Team Analytics</h1>
          <p className="text-muted-foreground mt-1">Understand your team&apos;s strengths</p>
        </div>
        <Card variant="influencing">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <AlertCircle className="h-6 w-6 text-destructive" />
              <div className="flex-1">
                <h3 className="font-medium">Failed to load analytics</h3>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
              <Button onClick={fetchData} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const noData = !composition || composition.membersWithStrengths === 0;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Team Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Understand your team&apos;s strengths and find synergies
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <div className="relative group">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <div className="absolute right-0 mt-1 w-48 bg-card border rounded-lg shadow-lg z-dropdown hidden group-hover:block">
                <a
                  href="/api/export/team?format=csv"
                  className="block px-4 py-2 text-sm hover:bg-muted"
                >
                  Team Data (CSV)
                </a>
                <a
                  href="/api/export/team?format=json"
                  className="block px-4 py-2 text-sm hover:bg-muted"
                >
                  Team Data (JSON)
                </a>
                <a
                  href="/api/export/analytics?format=csv"
                  className="block px-4 py-2 text-sm hover:bg-muted"
                >
                  Analytics Report (CSV)
                </a>
                <a
                  href="/api/export/analytics?format=json"
                  className="block px-4 py-2 text-sm hover:bg-muted"
                >
                  Analytics Report (JSON)
                </a>
              </div>
            </div>
          )}
          <Button onClick={fetchData} variant="ghost" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Empty state */}
      {noData && (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-6" />
              <h3 className="text-xl font-semibold mb-2">No Strength Data Yet</h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                Upload CliftonStrengths reports for your team members to see analytics,
                gap analysis, and partnership suggestions.
              </p>
              {isAdmin && (
                <div className="flex gap-3 justify-center">
                  <Button variant="executing" asChild>
                    <Link href="/admin/upload">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Reports
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/settings/invite">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Invite Members
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats cards */}
      {!noData && composition && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Users className="h-6 w-6 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Team Members</p>
                    <p className="text-2xl font-bold">{composition.totalMembers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <TrendingUp className="h-6 w-6 text-domain-strategic" />
                  <div>
                    <p className="text-sm text-muted-foreground">With Strengths</p>
                    <p className="text-2xl font-bold">{composition.membersWithStrengths}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <AlertCircle className="h-6 w-6 text-domain-influencing" />
                  <div>
                    <p className="text-sm text-muted-foreground">Theme Gaps</p>
                    <p className="text-2xl font-bold">{gaps?.missingThemes.length || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Handshake className="h-6 w-6 text-domain-relationship" />
                  <div>
                    <p className="text-sm text-muted-foreground">Partnerships</p>
                    <p className="text-2xl font-bold">{partnerships?.partnerships.length || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tab navigation */}
          <div className="flex gap-2 border-b pb-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === "overview" && (
            <div className="grid gap-6 lg:grid-cols-2">
              <DomainBalanceChart data={composition.domainComposition} />
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Top Themes
                  </CardTitle>
                  <CardDescription>
                    Most common themes across your team
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {composition.topThemes.slice(0, 8).map((theme, index) => (
                      <div
                        key={theme.slug}
                        className="flex items-center gap-3"
                      >
                        <span className="text-sm text-muted-foreground w-6">
                          #{index + 1}
                        </span>
                        <DomainIcon domain={theme.domain} size="sm" />
                        <span className="flex-1 font-medium">{theme.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {theme.count} ({theme.percentage}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "themes" && (
            <ThemeHeatMap
              themes={composition.themeFrequency}
              totalMembers={composition.totalMembers}
            />
          )}

          {activeTab === "canvas" && composition && (
            <TeamCanvas
              teamName={session?.user?.organizationName || "Your Team"}
              totalMembers={composition.totalMembers}
              membersWithStrengths={composition.membersWithStrengths}
              themeCoverage={composition.themeFrequency}
              domainComposition={composition.domainComposition}
            />
          )}

          {activeTab === "gaps" && gaps && (
            <GapAnalysisCard data={gaps} totalMembers={gaps.totalMembers} />
          )}

          {activeTab === "partnerships" && partnerships && (
            <div className="space-y-6">
              <ProjectPartnerFinder />
              <PartnershipSuggestions
                partnerships={partnerships.partnerships}
                totalPossiblePairings={partnerships.totalPossiblePairings}
                showAll
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
