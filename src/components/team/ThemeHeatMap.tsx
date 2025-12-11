"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { ThemeBadge } from "@/components/strengths/ThemeBadge";
import { cn } from "@/lib/utils";
import type { DomainSlug } from "@/constants/strengths-data";

interface ThemeData {
  slug: string;
  name: string;
  domain: DomainSlug;
  count: number;
  percentage: number;
  members: { id: string; name: string; rank: number }[];
}

interface ThemeHeatMapProps {
  themes: ThemeData[];
  totalMembers: number;
  onThemeClick?: (theme: ThemeData) => void;
}

const DOMAIN_ORDER: DomainSlug[] = ["executing", "influencing", "relationship", "strategic"];

const DOMAIN_NAMES: Record<DomainSlug, string> = {
  executing: "Executing",
  influencing: "Influencing",
  relationship: "Relationship Building",
  strategic: "Strategic Thinking",
};

const DOMAIN_COLORS: Record<DomainSlug, { bg: string; border: string; text: string }> = {
  executing: {
    bg: "bg-domain-executing/10",
    border: "border-domain-executing/20",
    text: "text-domain-executing",
  },
  influencing: {
    bg: "bg-domain-influencing/10",
    border: "border-domain-influencing/20",
    text: "text-domain-influencing",
  },
  relationship: {
    bg: "bg-domain-relationship/10",
    border: "border-domain-relationship/20",
    text: "text-domain-relationship",
  },
  strategic: {
    bg: "bg-domain-strategic/10",
    border: "border-domain-strategic/20",
    text: "text-domain-strategic",
  },
};

export function ThemeHeatMap({ themes, totalMembers, onThemeClick }: ThemeHeatMapProps) {
  const [selectedTheme, setSelectedTheme] = useState<ThemeData | null>(null);
  const [hoveredTheme, setHoveredTheme] = useState<ThemeData | null>(null);

  // Group themes by domain
  const themesByDomain = DOMAIN_ORDER.reduce((acc, domain) => {
    acc[domain] = themes
      .filter((t) => t.domain === domain)
      .sort((a, b) => b.count - a.count);
    return acc;
  }, {} as Record<DomainSlug, ThemeData[]>);

  // Calculate intensity based on percentage (0-100 scale)
  const getIntensity = (count: number): number => {
    if (count === 0) return 0;
    const maxCount = Math.max(...themes.map((t) => t.count));
    return Math.round((count / maxCount) * 100);
  };

  const handleThemeClick = (theme: ThemeData) => {
    setSelectedTheme(selectedTheme?.slug === theme.slug ? null : theme);
    onThemeClick?.(theme);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
          </span>
          Theme Distribution
        </CardTitle>
        <CardDescription>
          Hover to see details • Click to select • Intensity shows frequency
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {DOMAIN_ORDER.map((domain) => (
            <div key={domain}>
              <div className="flex items-center gap-2 mb-3">
                <div
                  className={cn("w-3 h-3 rounded-full", {
                    "bg-domain-executing": domain === "executing",
                    "bg-domain-influencing": domain === "influencing",
                    "bg-domain-relationship": domain === "relationship",
                    "bg-domain-strategic": domain === "strategic",
                  })}
                />
                <span className="text-sm font-medium">{DOMAIN_NAMES[domain]}</span>
                <span className="text-xs text-muted-foreground">
                  ({themesByDomain[domain].reduce((sum, t) => sum + t.count, 0)} total)
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {themesByDomain[domain].map((theme) => {
                  const intensity = getIntensity(theme.count);
                  const isSelected = selectedTheme?.slug === theme.slug;
                  const isHovered = hoveredTheme?.slug === theme.slug;

                  return (
                    <button
                      key={theme.slug}
                      onClick={() => handleThemeClick(theme)}
                      onMouseEnter={() => setHoveredTheme(theme)}
                      onMouseLeave={() => setHoveredTheme(null)}
                      className={cn(
                        "relative px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
                        "border",
                        DOMAIN_COLORS[domain].bg,
                        DOMAIN_COLORS[domain].border,
                        DOMAIN_COLORS[domain].text,
                        {
                          "ring-2 ring-offset-2": isSelected,
                          "ring-domain-executing": isSelected && domain === "executing",
                          "ring-domain-influencing": isSelected && domain === "influencing",
                          "ring-domain-relationship": isSelected && domain === "relationship",
                          "ring-domain-strategic": isSelected && domain === "strategic",
                          "scale-105 shadow-md": isHovered,
                          "opacity-40": theme.count === 0,
                        }
                      )}
                      style={{
                        opacity: theme.count === 0 ? 0.4 : 0.4 + intensity * 0.006,
                      }}
                    >
                      {theme.name}
                      {theme.count > 0 && (
                        <span className="ml-1.5 text-xs opacity-70">({theme.count})</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Hover tooltip */}
        {hoveredTheme && (
          <div className="mt-6 p-4 rounded-xl bg-muted/50 border">
            <div className="flex items-center justify-between mb-2">
              <ThemeBadge
                themeName={hoveredTheme.name}
                domainSlug={hoveredTheme.domain}
                size="default"
              />
              <span className="text-sm text-muted-foreground">
                {hoveredTheme.count} of {totalMembers} members ({hoveredTheme.percentage}%)
              </span>
            </div>
            {hoveredTheme.members.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-muted-foreground mb-1">Team members:</p>
                <div className="flex flex-wrap gap-1">
                  {hoveredTheme.members.slice(0, 5).map((member) => (
                    <span
                      key={member.id}
                      className="text-xs px-2 py-0.5 rounded-full bg-background border"
                    >
                      {member.name} <span className="text-muted-foreground">(#{member.rank})</span>
                    </span>
                  ))}
                  {hoveredTheme.members.length > 5 && (
                    <span className="text-xs text-muted-foreground px-2 py-0.5">
                      +{hoveredTheme.members.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Legend */}
        <div className="mt-6 pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-primary/20" />
              <span>Low frequency</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-primary" />
              <span>High frequency</span>
            </div>
          </div>
          <span>{themes.length} themes tracked</span>
        </div>
      </CardContent>
    </Card>
  );
}
