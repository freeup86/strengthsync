"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/Avatar";
import { ThemeBadge } from "./ThemeBadge";
import { DomainIcon } from "./DomainIcon";
import { getInitials } from "@/lib/utils";
import type { DomainSlug } from "@/constants/strengths-data";
import { Sparkles, Trophy, Flame } from "lucide-react";

interface StrengthData {
  name: string;
  slug: string;
  domain: DomainSlug;
  rank: number;
}

export interface StrengthsCardProps {
  name: string;
  avatarUrl?: string | null;
  jobTitle?: string | null;
  department?: string | null;
  topStrengths: StrengthData[];
  points?: number;
  streak?: number;
  badgeCount?: number;
  className?: string;
  onClick?: () => void;
}

export function StrengthsCard({
  name,
  avatarUrl,
  jobTitle,
  department,
  topStrengths,
  points = 0,
  streak = 0,
  badgeCount = 0,
  className,
  onClick,
}: StrengthsCardProps) {
  // Get the dominant domain from top strength
  const dominantDomain = topStrengths[0]?.domain || "executing";

  const domainGradients: Record<DomainSlug, string> = {
    executing: "from-domain-executing/10 via-transparent to-transparent",
    influencing: "from-domain-influencing/10 via-transparent to-transparent",
    relationship: "from-domain-relationship/10 via-transparent to-transparent",
    strategic: "from-domain-strategic/10 via-transparent to-transparent",
  };

  return (
    <Card
      interactive={!!onClick}
      onClick={onClick}
      className={cn(
        "relative overflow-hidden strength-card-shine",
        className
      )}
    >
      {/* Subtle gradient based on dominant domain */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br pointer-events-none",
          domainGradients[dominantDomain]
        )}
      />

      {/* Content */}
      <div className="relative p-5">
        {/* Header with avatar and info */}
        <div className="flex items-start gap-4">
          <Avatar size="xl" ring={dominantDomain}>
            <AvatarImage src={avatarUrl || undefined} alt={name} />
            <AvatarFallback>{getInitials(name)}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <h3 className="font-display font-semibold text-lg truncate">{name}</h3>
            {jobTitle && (
              <p className="text-sm text-muted-foreground truncate">{jobTitle}</p>
            )}
            {department && (
              <p className="text-xs text-muted-foreground/70 truncate">{department}</p>
            )}
          </div>
        </div>

        {/* Top 5 Strengths */}
        <div className="mt-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Top Strengths
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {topStrengths.slice(0, 5).map((strength, idx) => (
              <ThemeBadge
                key={strength.slug}
                themeName={strength.name}
                domainSlug={strength.domain}
                rank={idx + 1}
                showRank
                size="sm"
              />
            ))}
          </div>
        </div>

        {/* Stats footer */}
        {(points > 0 || streak > 0 || badgeCount > 0) && (
          <div className="mt-4 pt-3 border-t border-border/50 flex items-center gap-4">
            {points > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                <span className="font-medium">{points.toLocaleString()}</span>
                <span>pts</span>
              </div>
            )}
            {streak > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Flame className="h-3.5 w-3.5 text-orange-500" />
                <span className="font-medium">{streak}</span>
                <span>day streak</span>
              </div>
            )}
            {badgeCount > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Trophy className="h-3.5 w-3.5 text-yellow-500" />
                <span className="font-medium">{badgeCount}</span>
                <span>badges</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Domain indicator strip at bottom */}
      <div
        className={cn(
          "h-1 w-full",
          dominantDomain === "executing" && "bg-domain-executing",
          dominantDomain === "influencing" && "bg-domain-influencing",
          dominantDomain === "relationship" && "bg-domain-relationship",
          dominantDomain === "strategic" && "bg-domain-strategic"
        )}
      />
    </Card>
  );
}

// Mini version for grids and lists
export interface StrengthsCardMiniProps {
  name: string;
  avatarUrl?: string | null;
  topStrength?: StrengthData;
  className?: string;
  onClick?: () => void;
}

export function StrengthsCardMini({
  name,
  avatarUrl,
  topStrength,
  className,
  onClick,
}: StrengthsCardMiniProps) {
  const dominantDomain = topStrength?.domain || "executing";

  return (
    <Card
      interactive={!!onClick}
      onClick={onClick}
      className={cn("p-3", className)}
    >
      <div className="flex items-center gap-3">
        <Avatar size="default" ring={dominantDomain}>
          <AvatarImage src={avatarUrl || undefined} alt={name} />
          <AvatarFallback>{getInitials(name)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{name}</p>
          {topStrength && (
            <div className="flex items-center gap-1 mt-0.5">
              <DomainIcon domain={dominantDomain} size="sm" />
              <span className="text-xs text-muted-foreground truncate">
                {topStrength.name}
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
