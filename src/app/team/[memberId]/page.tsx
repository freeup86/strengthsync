"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { ThemeBadge, ThemeBadgeList } from "@/components/strengths/ThemeBadge";
import { DomainIcon } from "@/components/strengths/DomainIcon";
import {
  ArrowLeft,
  Mail,
  MessageSquarePlus,
  Users,
  Sparkles,
  Trophy,
  Calendar,
  Target,
  Handshake,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Lightbulb,
  UserPlus,
  BookOpen,
  Link2,
  Quote,
  CheckSquare,
  Info,
} from "lucide-react";
import Link from "next/link";
import type { DomainSlug } from "@/constants/strengths-data";
import type { StrengthBlend, ApplySection } from "@/types";

interface MemberProfile {
  id: string;
  title: string | null;
  department: string | null;
  // Stats are only present for full profile view
  points?: number;
  currentStreak?: number;
  joinedAt?: string;
  // Flag indicating access level
  isFullProfile: boolean;
  user: {
    name: string;
    email: string;
    image: string | null;
  };
  strengths: {
    id: string;
    rank: number;
    // Personalized data only present for full profile view
    personalizedDescription?: string | null;
    personalizedInsights?: string[];
    strengthBlends?: StrengthBlend[] | null;
    applySection?: ApplySection | null;
    theme: {
      slug: string;
      name: string;
      shortDescription: string;
      // Detailed theme info only present for full profile view
      fullDescription?: string;
      blindSpots?: string[];
      actionItems?: string[];
      worksWith?: string[];
      domain: {
        slug: string;
        name: string;
      };
    };
  }[];
  shoutoutsReceived: {
    id: string;
    message: string;
    createdAt: string;
    giver: { user: { name: string } };
    theme: { name: string; domain: { slug: string } } | null;
  }[];
  badgesEarned: {
    id: string;
    earnedAt: string;
    badge: {
      name: string;
      description: string;
      icon: string;
    };
  }[];
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function MemberProfilePage() {
  const { memberId } = useParams();
  const { data: session } = useSession();
  const router = useRouter();

  const [member, setMember] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedStrengths, setExpandedStrengths] = useState<Set<string>>(new Set());

  const isOwnProfile = session?.user?.memberId === memberId;

  const toggleStrengthExpansion = (strengthId: string) => {
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

  useEffect(() => {
    fetchMemberProfile();
  }, [memberId]);

  const fetchMemberProfile = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/members/${memberId}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError("Member not found");
        } else {
          setError("Failed to load profile");
        }
        return;
      }

      const result = await response.json();
      setMember(result.data);
    } catch (err) {
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  // Group strengths by domain
  type StrengthItem = NonNullable<typeof member>["strengths"][number];
  const strengthsByDomain: Partial<Record<DomainSlug, StrengthItem[]>> = member?.strengths.reduce((acc, s) => {
    const domain = s.theme.domain.slug as DomainSlug;
    if (!acc[domain]) acc[domain] = [];
    acc[domain]!.push(s);
    return acc;
  }, {} as Partial<Record<DomainSlug, StrengthItem[]>>) || {};

  const domainCounts: Record<DomainSlug, number> = {
    executing: strengthsByDomain.executing?.length || 0,
    influencing: strengthsByDomain.influencing?.length || 0,
    relationship: strengthsByDomain.relationship?.length || 0,
    strategic: strengthsByDomain.strategic?.length || 0,
  };

  const dominantDomain = Object.entries(domainCounts).reduce((a, b) =>
    domainCounts[a[0] as DomainSlug] > domainCounts[b[0] as DomainSlug] ? a : b
  )[0] as DomainSlug;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-8">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="text-center py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-24 w-24 rounded-full bg-muted mx-auto" />
            <div className="h-6 w-48 bg-muted rounded mx-auto" />
            <div className="h-4 w-32 bg-muted rounded mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="max-w-7xl mx-auto space-y-8">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Card variant="influencing">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold">{error || "Member not found"}</h3>
              <p className="text-muted-foreground mt-1">
                This profile may not exist or you don&apos;t have permission to view it.
              </p>
              <Button variant="outline" className="mt-4" asChild>
                <Link href="/directory">Browse Directory</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Back button */}
      <Button variant="ghost" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      {/* Limited profile banner - shown when viewing another member's profile without full access */}
      {!member.isFullProfile && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Limited Profile View
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              You&apos;re viewing basic profile information. Only admins can see full details including all strengths, shoutouts, and badges.
            </p>
          </div>
        </div>
      )}

      {/* Profile header */}
      <Card className="overflow-hidden">
        <div
          className={`h-32 bg-gradient-to-r ${
            dominantDomain === "executing"
              ? "from-domain-executing/30 to-domain-executing/10"
              : dominantDomain === "influencing"
              ? "from-domain-influencing/30 to-domain-influencing/10"
              : dominantDomain === "relationship"
              ? "from-domain-relationship/30 to-domain-relationship/10"
              : "from-domain-strategic/30 to-domain-strategic/10"
          }`}
        />
        <CardContent className="-mt-16 pb-6">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
              <AvatarImage src={member.user.image || undefined} />
              <AvatarFallback className="text-3xl bg-muted dark:bg-muted/50">
                {getInitials(member.user.name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 pt-4 sm:pt-16">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold">{member.user.name}</h1>
                  {member.title && (
                    <p className="text-muted-foreground">{member.title}</p>
                  )}
                  {member.department && (
                    <p className="text-sm text-muted-foreground">{member.department}</p>
                  )}
                </div>

                {!isOwnProfile && (
                  <div className="flex gap-2 mt-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href={`mailto:${member.user.email}`}>
                        <Mail className="h-4 w-4 mr-2" />
                        Email
                      </a>
                    </Button>
                    <Button variant="influencing" size="sm" asChild>
                      <Link href={`/shoutouts/create?to=${member.id}`}>
                        <MessageSquarePlus className="h-4 w-4 mr-2" />
                        Shoutout
                      </Link>
                    </Button>
                  </div>
                )}
              </div>

              {/* Stats - only visible for full profile view */}
              {member.isFullProfile && member.points !== undefined && (
                <div className="flex flex-wrap gap-6 mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-amber-500" />
                    <span className="text-sm">
                      <span className="font-bold">{member.points}</span> points
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-domain-executing" />
                    <span className="text-sm">
                      <span className="font-bold">{member.currentStreak}</span> day streak
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Joined {new Date(member.joinedAt!).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Top 5 Strengths */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-domain-executing" />
                Top 5 Strengths
              </CardTitle>
              <CardDescription>Signature themes</CardDescription>
            </CardHeader>
            <CardContent>
              {member.strengths.length > 0 ? (
                <div className="space-y-4">
                  {member.strengths.slice(0, 5).map((strength) => {
                    const isExpanded = expandedStrengths.has(strength.id);
                    // Only show expandable details for full profile view
                    const hasDetails = member.isFullProfile && (
                      strength.theme.fullDescription ||
                      (strength.theme.blindSpots && strength.theme.blindSpots.length > 0) ||
                      (strength.theme.actionItems && strength.theme.actionItems.length > 0) ||
                      (strength.theme.worksWith && strength.theme.worksWith.length > 0) ||
                      strength.personalizedInsights?.length ||
                      strength.strengthBlends?.length ||
                      strength.applySection
                    );

                    return (
                      <div
                        key={strength.id}
                        className="rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors overflow-hidden"
                      >
                        <button
                          onClick={() => hasDetails && toggleStrengthExpansion(strength.id)}
                          className={`flex items-start gap-4 p-4 w-full text-left ${!hasDetails ? 'cursor-default' : ''}`}
                          disabled={!hasDetails}
                        >
                          <span className="text-2xl font-bold text-muted-foreground w-8">
                            #{strength.rank}
                          </span>
                          <DomainIcon
                            domain={strength.theme.domain.slug as DomainSlug}
                            size="lg"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{strength.theme.name}</span>
                              <ThemeBadge
                                themeName={strength.theme.name}
                                domainSlug={strength.theme.domain.slug as DomainSlug}
                                size="sm"
                              />
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {strength.theme.shortDescription}
                            </p>
                          </div>
                          {hasDetails && (
                            <div className="flex-shrink-0 text-muted-foreground">
                              {isExpanded ? (
                                <ChevronUp className="h-5 w-5" />
                              ) : (
                                <ChevronDown className="h-5 w-5" />
                              )}
                            </div>
                          )}
                        </button>

                        {/* Expanded Details */}
                        {isExpanded && (
                          <div className="px-4 pb-4 space-y-4 border-t border-border/50 pt-4 ml-12">
                            {/* Personalized Insights Section - prioritize over generic */}
                            {strength.personalizedInsights && strength.personalizedInsights.length > 0 ? (
                              <div>
                                <div className="flex items-center gap-2 text-sm font-medium mb-2">
                                  <Sparkles className="h-4 w-4 text-domain-influencing" />
                                  Why Their {strength.theme.name} Is Unique
                                </div>
                                <div className="space-y-2">
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
                              <div>
                                <div className="flex items-center gap-2 text-sm font-medium mb-2">
                                  <Sparkles className="h-4 w-4 text-domain-influencing" />
                                  Personal Insight
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                  {strength.personalizedDescription}
                                </p>
                              </div>
                            ) : strength.theme.fullDescription && (
                              // Fallback to generic description
                              <div>
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
                              <div>
                                <div className="flex items-center gap-2 text-sm font-medium mb-2">
                                  <Link2 className="h-4 w-4 text-domain-relationship" />
                                  How {strength.theme.name} Blends With Their Other Strengths
                                </div>
                                <div className="space-y-2">
                                  {strength.strengthBlends.map((blend, idx) => (
                                    <div
                                      key={idx}
                                      className="p-2 rounded-lg bg-domain-relationship/5 border border-domain-relationship/10"
                                    >
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-medium">{strength.theme.name}</span>
                                        <span className="text-muted-foreground text-xs">+</span>
                                        <span className="text-xs font-medium text-domain-relationship">
                                          {blend.pairedTheme}
                                        </span>
                                      </div>
                                      <p className="text-xs text-muted-foreground leading-relaxed">
                                        {blend.description}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* NEW: Apply Section */}
                            {strength.applySection && (strength.applySection.tagline || strength.applySection.actionItems.length > 0) && (
                              <div>
                                <div className="flex items-center gap-2 text-sm font-medium mb-2">
                                  <Target className="h-4 w-4 text-domain-strategic" />
                                  Apply {strength.theme.name} to Succeed
                                </div>
                                {strength.applySection.tagline && (
                                  <div className="mb-2 pl-3 border-l-2 border-domain-strategic/50">
                                    <div className="flex items-start gap-2">
                                      <Quote className="h-3 w-3 text-domain-strategic flex-shrink-0 mt-0.5" />
                                      <p className="text-xs italic text-muted-foreground">
                                        {strength.applySection.tagline}
                                      </p>
                                    </div>
                                  </div>
                                )}
                                {strength.applySection.actionItems.length > 0 && (
                                  <ul className="space-y-1">
                                    {strength.applySection.actionItems.map((item, idx) => (
                                      <li
                                        key={idx}
                                        className="text-xs text-muted-foreground flex items-start gap-2"
                                      >
                                        <CheckSquare className="h-3 w-3 text-domain-strategic flex-shrink-0 mt-0.5" />
                                        {item}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            )}

                            {/* Blind Spots */}
                            {strength.theme.blindSpots && strength.theme.blindSpots.length > 0 && (
                              <div>
                                <div className="flex items-center gap-2 text-sm font-medium mb-2">
                                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                                  Potential Blind Spots
                                </div>
                                <ul className="space-y-1">
                                  {strength.theme.blindSpots.map((spot, idx) => (
                                    <li
                                      key={idx}
                                      className="text-sm text-muted-foreground flex items-start gap-2"
                                    >
                                      <span className="text-amber-500 mt-1.5">•</span>
                                      {spot}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Generic Action Items - only show if no personalized apply section */}
                            {(!strength.applySection || strength.applySection.actionItems.length === 0) && strength.theme.actionItems && strength.theme.actionItems.length > 0 && (
                              <div>
                                <div className="flex items-center gap-2 text-sm font-medium mb-2">
                                  <Lightbulb className="h-4 w-4 text-domain-strategic" />
                                  Action Ideas
                                </div>
                                <ul className="space-y-1">
                                  {strength.theme.actionItems.map((item, idx) => (
                                    <li
                                      key={idx}
                                      className="text-sm text-muted-foreground flex items-start gap-2"
                                    >
                                      <span className="text-domain-strategic mt-1.5">•</span>
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Works Well With - only show if no blends section */}
                            {(!strength.strengthBlends || strength.strengthBlends.length === 0) && strength.theme.worksWith && strength.theme.worksWith.length > 0 && (
                              <div>
                                <div className="flex items-center gap-2 text-sm font-medium mb-2">
                                  <UserPlus className="h-4 w-4 text-domain-relationship" />
                                  Partners Well With
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {strength.theme.worksWith.map((theme, idx) => (
                                    <span
                                      key={idx}
                                      className="text-xs px-2 py-1 rounded-full bg-domain-relationship/10 text-domain-relationship"
                                    >
                                      {theme}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h4 className="font-medium">No Strengths Yet</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Strengths haven&apos;t been uploaded for this member yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* All strengths (if more than 5) - only visible for full profile view */}
          {member.isFullProfile && member.strengths.length > 5 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  All Strengths
                </CardTitle>
                <CardDescription>Complete ranking (6-{member.strengths.length})</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 sm:grid-cols-2">
                  {member.strengths.slice(5).map((strength) => (
                    <div
                      key={strength.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-sm text-muted-foreground w-6">
                        #{strength.rank}
                      </span>
                      <DomainIcon
                        domain={strength.theme.domain.slug as DomainSlug}
                        size="sm"
                      />
                      <span className="text-sm">{strength.theme.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Shoutouts Received - only visible for full profile view */}
          {member.isFullProfile && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquarePlus className="h-5 w-5 text-domain-influencing" />
                  Shoutouts Received
                </CardTitle>
                <CardDescription>Recognition from teammates</CardDescription>
              </CardHeader>
              <CardContent>
                {member.shoutoutsReceived.length > 0 ? (
                  <div className="space-y-4">
                    {member.shoutoutsReceived.slice(0, 5).map((shoutout) => (
                      <div
                        key={shoutout.id}
                        className="flex items-start gap-4 p-4 rounded-xl bg-muted/30"
                      >
                        <Avatar>
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {getInitials(shoutout.giver.user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{shoutout.giver.user.name}</span>
                            {shoutout.theme && (
                              <ThemeBadge
                                themeName={shoutout.theme.name}
                                domainSlug={shoutout.theme.domain.slug as DomainSlug}
                                size="sm"
                              />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
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
                    <MessageSquarePlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h4 className="font-medium">No Shoutouts Yet</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Be the first to recognize {member.user.name.split(" ")[0]}!
                    </p>
                    {!isOwnProfile && (
                      <Button variant="influencing" className="mt-4" asChild>
                        <Link href={`/shoutouts/create?to=${member.id}`}>
                          <MessageSquarePlus className="h-4 w-4 mr-2" />
                          Give Shoutout
                        </Link>
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Domain breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Domain Balance</CardTitle>
              <CardDescription>Distribution of top 10 strengths</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(
                  [
                    { domain: "executing" as const, name: "Executing" },
                    { domain: "influencing" as const, name: "Influencing" },
                    { domain: "relationship" as const, name: "Relationship" },
                    { domain: "strategic" as const, name: "Strategic" },
                  ] as const
                ).map((d) => {
                  const count = strengthsByDomain[d.domain]?.filter((s) => s.rank <= 10).length || 0;
                  const percentage = member.strengths.length > 0 ? Math.round((count / Math.min(member.strengths.length, 10)) * 100) : 0;

                  return (
                    <div key={d.domain}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <DomainIcon domain={d.domain} size="sm" />
                          <span className="text-sm font-medium">{d.name}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {count} ({percentage}%)
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            d.domain === "executing"
                              ? "bg-domain-executing"
                              : d.domain === "influencing"
                              ? "bg-domain-influencing"
                              : d.domain === "relationship"
                              ? "bg-domain-relationship"
                              : "bg-domain-strategic"
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Badges - only visible for full profile view */}
          {member.isFullProfile && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Badges Earned</CardTitle>
                <CardDescription>{member.badgesEarned.length} achievements</CardDescription>
              </CardHeader>
              <CardContent>
                {member.badgesEarned.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3">
                    {member.badgesEarned.map((badge) => (
                      <div
                        key={badge.id}
                        className="flex flex-col items-center text-center p-2"
                        title={badge.badge.description}
                      >
                        <span className="text-2xl mb-1">{badge.badge.icon}</span>
                        <span className="text-xs font-medium line-clamp-2">
                          {badge.badge.name}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Trophy className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No badges yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quick actions */}
          {!isOwnProfile && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Connect</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href={`mailto:${member.user.email}`}>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Email
                  </a>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href={`/shoutouts/create?to=${member.id}`}>
                    <MessageSquarePlus className="h-4 w-4 mr-2" />
                    Give Shoutout
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href={`/mentorship?partner=${member.id}`}>
                    <Handshake className="h-4 w-4 mr-2" />
                    Request Mentorship
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
