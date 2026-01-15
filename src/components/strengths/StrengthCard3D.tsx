"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { DomainIcon } from "./DomainIcon";
import { ThemeBadge } from "./ThemeBadge";
import type { DomainSlug } from "@/constants/strengths-data";
import { RotateCw, Sparkles, Target, Users } from "lucide-react";

interface StrengthCard3DProps {
  themeName: string;
  domain: DomainSlug;
  rank: number;
  shortDescription: string;
  fullDescription: string;
  blindSpots?: string[];
  actionItems?: string[];
  className?: string;
}

export function StrengthCard3D({
  themeName,
  domain,
  rank,
  shortDescription,
  fullDescription,
  blindSpots = [],
  actionItems = [],
  className,
}: StrengthCard3DProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  // Check for reduced motion preference
  const handleFlip = () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // For reduced motion, just toggle without animation
      setIsFlipped(!isFlipped);
    } else {
      setIsFlipped(!isFlipped);
    }
  };

  const domainColorClasses = {
    executing: "bg-domain-executing",
    influencing: "bg-domain-influencing",
    relationship: "bg-domain-relationship",
    strategic: "bg-domain-strategic",
  };

  return (
    <div
      className={cn(
        "perspective-1000 cursor-pointer group",
        className
      )}
      style={{ perspective: "1000px" }}
      onClick={handleFlip}
    >
      <div
        className={cn(
          "relative w-full h-[400px] transition-transform duration-700",
          isFlipped && "[transform:rotateY(180deg)]"
        )}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Front of card */}
        <Card
          variant={domain}
          className={cn(
            "absolute inset-0 p-6 flex flex-col",
            "hover:shadow-soft-lg transition-shadow"
          )}
          style={{ backfaceVisibility: "hidden" }}
        >
          {/* Rank badge */}
          <div className="absolute top-4 right-4">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold text-white",
              domainColorClasses[domain]
            )}>
              #{rank}
            </div>
          </div>

          {/* Domain icon */}
          <DomainIcon domain={domain} size="xl" className="mb-4" />

          {/* Theme name */}
          <h3 className="font-display text-2xl font-bold mb-2">{themeName}</h3>

          {/* Domain badge */}
          <ThemeBadge
            themeName={domain.charAt(0).toUpperCase() + domain.slice(1)}
            domainSlug={domain}
            size="sm"
            className="self-start mb-4"
          />

          {/* Short description */}
          <p className="text-muted-foreground flex-1">{shortDescription}</p>

          {/* Flip hint */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-4 pt-4 border-t border-border/50">
            <RotateCw className="h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
            <span>Click to see details</span>
          </div>

          {/* Shine effect */}
          <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </Card>

        {/* Back of card */}
        <Card
          className={cn(
            "absolute inset-0 p-6 overflow-y-auto",
            "bg-gradient-to-br from-card to-muted/30"
          )}
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)"
          }}
        >
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3 pb-4 border-b border-border/50">
              <DomainIcon domain={domain} size="lg" />
              <div>
                <h3 className="font-display text-xl font-bold">{themeName}</h3>
                <p className="text-sm text-muted-foreground">Rank #{rank}</p>
              </div>
            </div>

            {/* Full description */}
            <div>
              <div className="flex items-center gap-2 text-sm font-medium mb-2">
                <Sparkles className="h-4 w-4 text-domain-executing" />
                About This Strength
              </div>
              <p className="text-sm text-muted-foreground">{fullDescription}</p>
            </div>

            {/* Blind spots */}
            {blindSpots.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Target className="h-4 w-4 text-domain-influencing" />
                  Watch Out For
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {blindSpots.slice(0, 2).map((spot, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-domain-influencing">•</span>
                      {spot}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action items */}
            {actionItems.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Users className="h-4 w-4 text-domain-strategic" />
                  How to Leverage
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {actionItems.slice(0, 2).map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-domain-strategic">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Flip back hint */}
          <div className="absolute bottom-4 right-4">
            <RotateCw className="h-5 w-5 text-muted-foreground" />
          </div>
        </Card>
      </div>
    </div>
  );
}
