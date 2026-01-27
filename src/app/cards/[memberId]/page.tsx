"use client";

import { useState, useEffect, use, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { Skeleton, SkeletonStrengthBadges } from "@/components/ui/Skeleton";
import { DomainIcon } from "@/components/strengths/DomainIcon";
import {
  ArrowLeft,
  Download,
  Share2,
  Award,
  Trophy,
  Users,
  Flame,
  Star,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DomainSlug } from "@/constants/strengths-data";

interface CardData {
  id: string;
  name: string;
  avatarUrl: string | null;
  jobTitle: string | null;
  department: string | null;
  bio: string | null;
  primaryDomain: {
    slug: string;
    name: string;
    colorHex: string;
  };
  domainDistribution: Record<string, number>;
  topStrengths: {
    rank: number;
    name: string;
    domain: string;
    domainColor: string;
    description: string;
  }[];
  allStrengths: {
    rank: number;
    name: string;
    domain: string;
  }[];
  stats: {
    shoutoutsReceived: number;
    shoutoutsGiven: number;
    mentorshipsAsMentor: number;
    mentorshipsAsMentee: number;
    points: number;
    streak: number;
  };
  badges: {
    name: string;
    iconUrl: string;
    tier: string;
    earnedAt: string;
  }[];
  joinedAt: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const DOMAIN_GRADIENTS: Record<string, string> = {
  executing: "from-purple-600 to-purple-400",
  influencing: "from-orange-500 to-amber-400",
  relationship: "from-blue-600 to-sky-400",
  strategic: "from-green-600 to-emerald-400",
};

const DOMAIN_BG_PATTERNS: Record<string, string> = {
  executing: "bg-[radial-gradient(circle_at_30%_-20%,rgba(139,92,246,0.3)_0%,transparent_50%)]",
  influencing: "bg-[radial-gradient(circle_at_30%_-20%,rgba(251,146,60,0.3)_0%,transparent_50%)]",
  relationship: "bg-[radial-gradient(circle_at_30%_-20%,rgba(59,130,246,0.3)_0%,transparent_50%)]",
  strategic: "bg-[radial-gradient(circle_at_30%_-20%,rgba(34,197,94,0.3)_0%,transparent_50%)]",
};

export default function StrengthsCardPage({
  params,
}: {
  params: Promise<{ memberId: string }>;
}) {
  const { memberId } = use(params);
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardData, setCardData] = useState<CardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBack, setShowBack] = useState(false);

  useEffect(() => {
    fetchCardData();
  }, [memberId]);

  const fetchCardData = async () => {
    try {
      const res = await fetch(`/api/cards/${memberId}`);
      if (res.ok) {
        const result = await res.json();
        setCardData(result.data);
      } else if (res.status === 404) {
        router.push("/directory");
      }
    } catch (err) {
      console.error("Failed to fetch card data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${cardData?.name}'s Strengths Card`,
          text: `Check out ${cardData?.name}'s CliftonStrengths profile!`,
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-80 space-y-4">
          <div className="rounded-2xl border bg-card p-6 space-y-6">
            <div className="flex flex-col items-center space-y-3">
              <Skeleton className="h-20 w-20 rounded-full" />
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-28" />
            </div>
            <SkeletonStrengthBadges />
            <div className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="h-3 w-3/5" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-8 flex-1 rounded" />
              <Skeleton className="h-8 flex-1 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!cardData) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Card not found</p>
        <Button asChild className="mt-4">
          <Link href="/directory">Browse Directory</Link>
        </Button>
      </div>
    );
  }

  const primaryDomain = cardData.primaryDomain.slug as DomainSlug;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/team/${memberId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Profile
          </Link>
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Card Container */}
      <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start justify-center">
        {/* The Card */}
        <div
          ref={cardRef}
          className={cn(
            "relative w-80 aspect-[2.5/4] rounded-2xl shadow-2xl overflow-hidden cursor-pointer transition-transform duration-500",
            showBack && "rotate-y-180"
          )}
          onClick={() => setShowBack(!showBack)}
          style={{ perspective: "1000px" }}
        >
          {/* Front of Card */}
          <div
            className={cn(
              "absolute inset-0 rounded-2xl overflow-hidden",
              showBack && "opacity-0"
            )}
          >
            {/* Background Gradient */}
            <div
              className={cn(
                "absolute inset-0 bg-gradient-to-br",
                DOMAIN_GRADIENTS[primaryDomain] || DOMAIN_GRADIENTS.strategic
              )}
            />
            <div
              className={cn(
                "absolute inset-0",
                DOMAIN_BG_PATTERNS[primaryDomain] || DOMAIN_BG_PATTERNS.strategic
              )}
            />

            {/* Card Content */}
            <div className="relative h-full flex flex-col p-6 text-white">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider opacity-80">
                  StrengthSync
                </span>
                <DomainIcon domain={primaryDomain} size="sm" className="text-white" />
              </div>

              {/* Avatar */}
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <Avatar className="h-24 w-24 ring-4 ring-white/30">
                    <AvatarImage src={cardData.avatarUrl || undefined} />
                    <AvatarFallback className="text-2xl bg-white/20 text-white">
                      {getInitials(cardData.name)}
                    </AvatarFallback>
                  </Avatar>
                  {cardData.stats.streak > 0 && (
                    <div className="absolute -bottom-1 -right-1 bg-orange-500 rounded-full p-1">
                      <Flame className="h-4 w-4" />
                    </div>
                  )}
                </div>
              </div>

              {/* Name & Title */}
              <div className="text-center mb-4">
                <h2 className="text-xl font-bold">{cardData.name}</h2>
                {cardData.jobTitle && (
                  <p className="text-sm opacity-80">{cardData.jobTitle}</p>
                )}
              </div>

              {/* Top 5 Strengths */}
              <div className="flex-1 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider opacity-60 mb-2">
                  Top 5 Strengths
                </h3>
                {cardData.topStrengths.map((strength, i) => (
                  <div
                    key={strength.name}
                    className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5"
                  >
                    <span className="text-sm font-bold opacity-60 w-4">
                      {i + 1}
                    </span>
                    <DomainIcon
                      domain={strength.domain as DomainSlug}
                      size="sm"
                      className="text-white"
                    />
                    <span className="text-sm font-medium">{strength.name}</span>
                  </div>
                ))}
              </div>

              {/* Stats Bar */}
              <div className="flex items-center justify-around pt-4 border-t border-white/20 mt-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Star className="h-3 w-3" />
                    <span className="font-bold">{cardData.stats.points}</span>
                  </div>
                  <span className="text-[10px] opacity-60">Points</span>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Award className="h-3 w-3" />
                    <span className="font-bold">{cardData.stats.shoutoutsReceived}</span>
                  </div>
                  <span className="text-[10px] opacity-60">Shoutouts</span>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Trophy className="h-3 w-3" />
                    <span className="font-bold">{cardData.badges.length}</span>
                  </div>
                  <span className="text-[10px] opacity-60">Badges</span>
                </div>
              </div>
            </div>
          </div>

          {/* Back of Card */}
          <div
            className={cn(
              "absolute inset-0 rounded-2xl overflow-hidden bg-card border border-border",
              !showBack && "opacity-0"
            )}
          >
            <div className="h-full flex flex-col p-6">
              <h3 className="text-lg font-bold mb-4 text-center text-foreground">All 34 Strengths</h3>
              <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-2 gap-1 text-xs">
                  {cardData.allStrengths.map((strength) => (
                    <div
                      key={strength.name}
                      className="flex items-center gap-1 py-0.5"
                    >
                      <span className="text-muted-foreground w-4">
                        {strength.rank}
                      </span>
                      <DomainIcon
                        domain={strength.domain as DomainSlug}
                        size="sm"
                      />
                      <span className="truncate text-foreground">{strength.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-xs text-center text-muted-foreground mt-4">
                Tap to flip
              </p>
            </div>
          </div>
        </div>

        {/* Card Details */}
        <div className="flex-1 max-w-md space-y-6">
          <div>
            <h1 className="text-2xl font-bold">{cardData.name}&apos;s Card</h1>
            <p className="text-lg text-muted-foreground">
              Digital strengths profile card
            </p>
          </div>

          {/* Domain Distribution */}
          <div className="space-y-3">
            <h3 className="font-semibold">Domain Distribution (Top 10)</h3>
            <div className="space-y-2">
              {Object.entries(cardData.domainDistribution)
                .sort((a, b) => b[1] - a[1])
                .map(([domain, count]) => (
                  <div key={domain} className="flex items-center gap-3">
                    <DomainIcon domain={domain as DomainSlug} size="sm" />
                    <div className="flex-1">
                      <div
                        className={cn(
                          "h-2 rounded-full bg-gradient-to-r",
                          DOMAIN_GRADIENTS[domain] || DOMAIN_GRADIENTS.strategic
                        )}
                        style={{ width: `${(count / 10) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Badges */}
          {cardData.badges.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold">Recent Badges</h3>
              <div className="flex flex-wrap gap-2">
                {cardData.badges.map((badge) => (
                  <div
                    key={badge.name}
                    className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-full"
                  >
                    <Trophy
                      className={cn(
                        "h-4 w-4",
                        badge.tier === "GOLD"
                          ? "text-yellow-500"
                          : badge.tier === "SILVER"
                          ? "text-gray-400"
                          : badge.tier === "PLATINUM"
                          ? "text-purple-500"
                          : "text-amber-700"
                      )}
                    />
                    <span className="text-sm">{badge.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button asChild className="flex-1">
              <Link href={`/team/${memberId}`}>
                <Users className="h-4 w-4 mr-2" />
                View Full Profile
              </Link>
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Click the card to flip it and see all 34 strengths
          </p>
        </div>
      </div>
    </div>
  );
}
