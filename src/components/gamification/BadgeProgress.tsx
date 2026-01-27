"use client";

import { useState, useEffect } from "react";
import { Trophy, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * BadgeProgress
 *
 * Shows progress toward the next unearned badge.
 * "3/5 shoutouts given — 2 more for High Five badge!"
 * Used on the leaderboard page and member profile.
 */

interface BadgeProgressData {
  id: string;
  name: string;
  slug: string;
  description: string;
  iconUrl: string;
  category: string;
  tier: string;
  points: number;
  earned: boolean;
  earnedAt: string | null;
  progress: {
    current: number;
    target: number;
    percentage: number;
  } | null;
}

const tierColors: Record<string, string> = {
  BRONZE: "from-amber-600 to-amber-700",
  SILVER: "from-slate-400 to-slate-500",
  GOLD: "from-yellow-400 to-amber-500",
  PLATINUM: "from-indigo-400 to-purple-500",
};

const tierBgColors: Record<string, string> = {
  BRONZE: "bg-amber-100 dark:bg-amber-900/20",
  SILVER: "bg-slate-100 dark:bg-slate-800/30",
  GOLD: "bg-yellow-50 dark:bg-yellow-900/20",
  PLATINUM: "bg-purple-50 dark:bg-purple-900/20",
};

interface BadgeProgressProps {
  className?: string;
  maxBadges?: number;
}

export function BadgeProgress({ className, maxBadges = 3 }: BadgeProgressProps) {
  const [badges, setBadges] = useState<BadgeProgressData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBadges();
  }, []);

  const fetchBadges = async () => {
    try {
      const res = await fetch("/api/badges");
      if (!res.ok) return;

      const result = await res.json();
      setBadges(result.data || []);
    } catch (err) {
      console.error("Failed to fetch badges:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={cn("space-y-3", className)}>
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="animate-pulse flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
            <div className="w-10 h-10 bg-muted rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-muted rounded w-1/2" />
              <div className="h-2 bg-muted rounded w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Get closest-to-completion unearned badges
  const inProgress = badges
    .filter((b) => !b.earned && b.progress && b.progress.percentage > 0)
    .sort((a, b) => (b.progress?.percentage || 0) - (a.progress?.percentage || 0))
    .slice(0, maxBadges);

  if (inProgress.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <Trophy className="h-4 w-4" />
        Next Badges
      </h3>
      {inProgress.map((badge) => {
        const remaining = (badge.progress?.target || 0) - (badge.progress?.current || 0);
        return (
          <div
            key={badge.id}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl border",
              tierBgColors[badge.tier] || "bg-muted/50"
            )}
          >
            <div className="w-10 h-10 rounded-lg bg-card shadow-sm flex items-center justify-center flex-shrink-0">
              <img
                src={badge.iconUrl}
                alt={badge.name}
                className="w-7 h-7"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium truncate">{badge.name}</p>
                <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                  {badge.progress?.current}/{badge.progress?.target}
                </span>
              </div>
              {/* Progress bar */}
              <div className="h-1.5 bg-border/50 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full bg-gradient-to-r transition-all duration-500",
                    tierColors[badge.tier] || "from-primary to-primary/80"
                  )}
                  style={{ width: `${badge.progress?.percentage || 0}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {remaining} more for {badge.name}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </div>
        );
      })}
    </div>
  );
}
