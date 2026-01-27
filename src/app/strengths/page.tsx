"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ThemeBadge } from "@/components/strengths/ThemeBadge";
import { DomainIcon } from "@/components/strengths/DomainIcon";
import { Skeleton, SkeletonStrengthBadges } from "@/components/ui/Skeleton";
import {
  Sparkles,
  BookOpen,
  AlertTriangle,
  Lightbulb,
  UserPlus,
  Target,
  ChevronDown,
  ChevronUp,
  Brain,
  Zap,
  RefreshCw,
  Link2,
  Quote,
  CheckSquare,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { DomainSlug } from "@/constants/strengths-data";
import type { StrengthBlend, ApplySection } from "@/types";

interface Strength {
  id: string;
  rank: number;
  personalizedDescription: string | null;
  // NEW: Array of personalized insight paragraphs
  personalizedInsights?: string[];
  // NEW: How this strength blends with other Top 5 themes
  strengthBlends?: StrengthBlend[] | null;
  // NEW: Apply section with tagline and action items
  applySection?: ApplySection | null;
  theme: {
    slug: string;
    name: string;
    shortDescription: string;
    fullDescription: string;
    blindSpots: string[];
    actionItems: string[];
    worksWith: string[];
    domain: {
      slug: string;
      name: string;
    };
  };
}

interface MyStrengthsData {
  strengths: Strength[];
  hasStrengths: boolean;
}

// Weekly learning prompts based on domains
const WEEKLY_PROMPTS: Record<string, string[]> = {
  executing: [
    "How did you use your execution strengths to accomplish something this week?",
    "What task felt most satisfying to complete recently?",
    "When did your drive to get things done help your team?",
  ],
  influencing: [
    "When did you successfully persuade or inspire someone this week?",
    "How did you use your voice to advocate for an idea?",
    "What conversation had the most positive impact recently?",
  ],
  relationship: [
    "Who did you help feel more included or valued this week?",
    "What relationship did you strengthen recently?",
    "How did you show care for a teammate?",
  ],
  strategic: [
    "What problem did you solve by thinking it through carefully?",
    "When did you spot a pattern or connection others missed?",
    "How did your analysis help the team make a better decision?",
  ],
};

function getWeeklyPrompt(domain: string): string {
  const prompts = WEEKLY_PROMPTS[domain] || WEEKLY_PROMPTS.executing;
  const weekNumber = Math.floor(Date.now() / (1000 * 60 * 60 * 24 * 7));
  return prompts[weekNumber % prompts.length];
}

export default function MyStrengthsPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<MyStrengthsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedStrengths, setExpandedStrengths] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"top5" | "all">("top5");

  useEffect(() => {
    fetchMyStrengths();
  }, []);

  const fetchMyStrengths = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/me/strengths");
      if (response.ok) {
        const result = await response.json();
        setData(result.data);
      }
    } catch (err) {
      console.error("Failed to fetch strengths:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleStrength = (strengthId: string) => {
    setExpandedStrengths((prev) => {
      const next = new Set(prev);
      if (next.has(strengthId)) {
        next.delete(strengthId);
      } else {
        next.add(strengthId);
      }
      return next;
    });
  };

  const expandAll = () => {
    if (data?.strengths) {
      const displayedStrengths = activeTab === "top5"
        ? data.strengths.slice(0, 5)
        : data.strengths;
      setExpandedStrengths(new Set(displayedStrengths.map((s) => s.id)));
    }
  };

  const collapseAll = () => {
    setExpandedStrengths(new Set());
  };

  // Get dominant domain
  const getDominantDomain = (): DomainSlug => {
    if (!data?.strengths.length) return "executing";
    const top5 = data.strengths.slice(0, 5);
    const domainCounts: Record<string, number> = {};
    top5.forEach((s) => {
      const d = s.theme.domain.slug;
      domainCounts[d] = (domainCounts[d] || 0) + 1;
    });
    return Object.entries(domainCounts).sort((a, b) => b[1] - a[1])[0][0] as DomainSlug;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <SkeletonStrengthBadges />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 space-y-4">
            <Skeleton className="h-5 w-40" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-20 w-full rounded-xl" />
                  <Skeleton className="h-3 w-20" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 space-y-3">
            <Skeleton className="h-5 w-44" />
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-6 w-6 rounded" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 flex-1" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data?.hasStrengths) {
    return (
      <div className="max-w-7xl mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-bold">No Strengths Yet</h2>
              <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                Your CliftonStrengths results haven&apos;t been uploaded yet.
                Contact your admin to have your strengths added.
              </p>
              {(session?.user?.role === "OWNER" || session?.user?.role === "ADMIN") && (
                <Button variant="executing" className="mt-6" asChild>
                  <Link href="/admin/upload">
                    Upload Strengths
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const dominantDomain = getDominantDomain();
  const displayedStrengths = activeTab === "top5"
    ? data.strengths.slice(0, 5)
    : data.strengths;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold flex items-center gap-2">
          <Brain className="h-8 w-8 text-domain-strategic" />
          My Strengths Deep Dive
        </h1>
        <p className="text-muted-foreground mt-1">
          Explore your unique talents and learn how to aim them
        </p>
      </div>

      {/* Weekly reflection prompt */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Zap className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
            <div>
              <p className="text-sm font-medium text-primary mb-1">Weekly Reflection</p>
              <p className="text-foreground">{getWeeklyPrompt(dominantDomain)}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Based on your dominant {dominantDomain.charAt(0).toUpperCase() + dominantDomain.slice(1)} strengths
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Name-Claim-Aim Framework */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-domain-executing" />
            Your Strengths Journey
          </CardTitle>
          <CardDescription>
            The path to excellence through your natural talents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-domain-executing/10 border border-domain-executing/20">
              <h4 className="font-semibold text-domain-executing mb-1">1. Name It</h4>
              <p className="text-sm text-muted-foreground">
                You&apos;ve identified {data.strengths.length} unique talents below
              </p>
            </div>
            <div className="p-4 rounded-xl bg-domain-influencing/10 border border-domain-influencing/20">
              <h4 className="font-semibold text-domain-influencing mb-1">2. Claim It</h4>
              <p className="text-sm text-muted-foreground">
                Read the descriptions to understand your gifts
              </p>
            </div>
            <div className="p-4 rounded-xl bg-domain-strategic/10 border border-domain-strategic/20">
              <h4 className="font-semibold text-domain-strategic mb-1">3. Aim It</h4>
              <p className="text-sm text-muted-foreground">
                Use the action items to apply your strengths
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs and controls */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("top5")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              activeTab === "top5"
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80"
            )}
          >
            Signature Top 5
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              activeTab === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80"
            )}
          >
            All {data.strengths.length} Themes
          </button>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={expandAll}>
            Expand All
          </Button>
          <Button variant="ghost" size="sm" onClick={collapseAll}>
            Collapse All
          </Button>
        </div>
      </div>

      {/* Strengths list */}
      <div className="space-y-4">
        {displayedStrengths.map((strength) => {
          const isExpanded = expandedStrengths.has(strength.id);
          const hasDetails =
            strength.theme.fullDescription ||
            strength.theme.blindSpots.length > 0 ||
            strength.theme.actionItems.length > 0 ||
            strength.theme.worksWith.length > 0;

          return (
            <Card
              key={strength.id}
              className={cn(
                "overflow-hidden transition-all",
                strength.rank <= 5 && "border-l-4",
                strength.rank <= 5 && strength.theme.domain.slug === "executing" && "border-l-domain-executing",
                strength.rank <= 5 && strength.theme.domain.slug === "influencing" && "border-l-domain-influencing",
                strength.rank <= 5 && strength.theme.domain.slug === "relationship" && "border-l-domain-relationship",
                strength.rank <= 5 && strength.theme.domain.slug === "strategic" && "border-l-domain-strategic"
              )}
            >
              <button
                onClick={() => hasDetails && toggleStrength(strength.id)}
                className="w-full text-left"
                disabled={!hasDetails}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl font-bold text-muted-foreground w-10">
                      #{strength.rank}
                    </span>
                    <DomainIcon
                      domain={strength.theme.domain.slug as DomainSlug}
                      size="lg"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-lg">{strength.theme.name}</CardTitle>
                        <ThemeBadge
                          themeName={strength.theme.name}
                          domainSlug={strength.theme.domain.slug as DomainSlug}
                          size="sm"
                        />
                      </div>
                      <CardDescription className="mt-1">
                        {strength.theme.shortDescription}
                      </CardDescription>
                    </div>
                    {hasDetails && (
                      <div className="text-muted-foreground">
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </div>
                    )}
                  </div>
                </CardHeader>
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <CardContent className="pt-0 space-y-6">
                  {/* Personalized Insights Section - prioritize over generic */}
                  {strength.personalizedInsights && strength.personalizedInsights.length > 0 ? (
                    <div className="p-4 rounded-xl bg-domain-influencing/10 border border-domain-influencing/20">
                      <div className="flex items-center gap-2 text-sm font-medium mb-3 text-domain-influencing">
                        <Sparkles className="h-4 w-4" />
                        Why Your {strength.theme.name} Is Unique
                      </div>
                      <div className="space-y-3">
                        {strength.personalizedInsights.map((insight, idx) => (
                          <p
                            key={idx}
                            className="text-sm text-muted-foreground leading-relaxed"
                          >
                            {insight}
                          </p>
                        ))}
                      </div>
                    </div>
                  ) : strength.personalizedDescription ? (
                    // Fallback to single personalized description
                    <div className="p-4 rounded-xl bg-domain-influencing/10 border border-domain-influencing/20">
                      <div className="flex items-center gap-2 text-sm font-medium mb-2 text-domain-influencing">
                        <Sparkles className="h-4 w-4" />
                        Your Personal Insight
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {strength.personalizedDescription}
                      </p>
                    </div>
                  ) : strength.theme.fullDescription && (
                    // Fallback to generic description
                    <div className="p-4 rounded-xl bg-muted/30">
                      <div className="flex items-center gap-2 text-sm font-medium mb-2">
                        <BookOpen className="h-4 w-4 text-domain-strategic" />
                        About This Strength
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {strength.theme.fullDescription}
                      </p>
                    </div>
                  )}

                  {/* NEW: Strength Blends Section */}
                  {strength.strengthBlends && strength.strengthBlends.length > 0 && (
                    <div className="p-4 rounded-xl bg-domain-relationship/10 border border-domain-relationship/20">
                      <div className="flex items-center gap-2 text-sm font-medium mb-3 text-domain-relationship">
                        <Link2 className="h-4 w-4" />
                        How {strength.theme.name} Blends With Your Other Strengths
                      </div>
                      <div className="grid gap-3">
                        {strength.strengthBlends.map((blend, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-lg bg-white dark:bg-background border border-domain-relationship/20"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium text-sm">{strength.theme.name}</span>
                              <span className="text-muted-foreground">+</span>
                              <span className="font-medium text-sm text-domain-relationship">
                                {blend.pairedTheme}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {blend.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* NEW: Apply Section */}
                  {strength.applySection && (strength.applySection.tagline || strength.applySection.actionItems.length > 0) && (
                    <div className="p-4 rounded-xl bg-domain-strategic/10 border border-domain-strategic/20">
                      <div className="flex items-center gap-2 text-sm font-medium mb-3 text-domain-strategic">
                        <Target className="h-4 w-4" />
                        Apply Your {strength.theme.name} to Succeed
                      </div>
                      {strength.applySection.tagline && (
                        <div className="mb-4 pl-4 border-l-2 border-domain-strategic/50">
                          <div className="flex items-start gap-2">
                            <Quote className="h-4 w-4 text-domain-strategic flex-shrink-0 mt-0.5" />
                            <p className="text-sm italic text-muted-foreground">
                              {strength.applySection.tagline}
                            </p>
                          </div>
                        </div>
                      )}
                      {strength.applySection.actionItems.length > 0 && (
                        <ul className="space-y-2">
                          {strength.applySection.actionItems.map((item, idx) => (
                            <li
                              key={idx}
                              className="text-sm text-muted-foreground flex items-start gap-2"
                            >
                              <CheckSquare className="h-4 w-4 text-domain-strategic flex-shrink-0 mt-0.5" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Blind Spots */}
                    {strength.theme.blindSpots.length > 0 && (
                      <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                        <div className="flex items-center gap-2 text-sm font-medium mb-3 text-amber-700 dark:text-amber-400">
                          <AlertTriangle className="h-4 w-4" />
                          Watch Out For
                        </div>
                        <ul className="space-y-2">
                          {strength.theme.blindSpots.map((spot, idx) => (
                            <li
                              key={idx}
                              className="text-sm text-muted-foreground flex items-start gap-2"
                            >
                              <span className="text-amber-500 mt-1">•</span>
                              {spot}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Generic Action Items - only show if no personalized apply section */}
                    {(!strength.applySection || strength.applySection.actionItems.length === 0) && strength.theme.actionItems.length > 0 && (
                      <div className="p-4 rounded-xl bg-domain-strategic/10 border border-domain-strategic/20">
                        <div className="flex items-center gap-2 text-sm font-medium mb-3 text-domain-strategic">
                          <Lightbulb className="h-4 w-4" />
                          Ways to Aim It
                        </div>
                        <ul className="space-y-2">
                          {strength.theme.actionItems.map((item, idx) => (
                            <li
                              key={idx}
                              className="text-sm text-muted-foreground flex items-start gap-2"
                            >
                              <span className="text-domain-strategic mt-1">•</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Works Well With - only show if no blends section */}
                  {(!strength.strengthBlends || strength.strengthBlends.length === 0) && strength.theme.worksWith.length > 0 && (
                    <div className="p-4 rounded-xl bg-domain-relationship/10 border border-domain-relationship/20">
                      <div className="flex items-center gap-2 text-sm font-medium mb-3 text-domain-relationship">
                        <UserPlus className="h-4 w-4" />
                        Partners Well With
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {strength.theme.worksWith.map((theme, idx) => (
                          <span
                            key={idx}
                            className="text-sm px-3 py-1 rounded-full bg-white dark:bg-background border border-domain-relationship/30"
                          >
                            {theme}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-3">
                        <Link href="/directory" className="text-domain-relationship hover:underline">
                          Find teammates with these strengths →
                        </Link>
                      </p>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Call to action */}
      <Card className="bg-gradient-to-r from-domain-influencing/10 to-domain-relationship/10">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1 text-center sm:text-left">
              <h3 className="font-semibold">Ready to put your strengths into action?</h3>
              <p className="text-sm text-muted-foreground">
                Give a shoutout to recognize someone else&apos;s strengths
              </p>
            </div>
            <Button variant="influencing" asChild>
              <Link href="/shoutouts/create">
                <Sparkles className="h-4 w-4 mr-2" />
                Give Shoutout
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
