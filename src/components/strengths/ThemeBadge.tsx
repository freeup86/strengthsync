"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import type { DomainSlug } from "@/constants/strengths-data";

const themeBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full font-semibold transition-all duration-200",
  {
    variants: {
      domain: {
        executing:
          "bg-domain-executing-light text-domain-executing-dark border border-domain-executing/20 hover:bg-domain-executing hover:text-white hover:border-transparent",
        influencing:
          "bg-domain-influencing-light text-domain-influencing-dark border border-domain-influencing/20 hover:bg-domain-influencing hover:text-white hover:border-transparent",
        relationship:
          "bg-domain-relationship-light text-domain-relationship-dark border border-domain-relationship/20 hover:bg-domain-relationship hover:text-white hover:border-transparent",
        strategic:
          "bg-domain-strategic-light text-domain-strategic-dark border border-domain-strategic/20 hover:bg-domain-strategic hover:text-white hover:border-transparent",
      },
      size: {
        xs: "px-2 py-0.5 text-[10px]",
        sm: "px-2.5 py-0.5 text-xs",
        default: "px-3 py-1 text-sm",
        lg: "px-4 py-1.5 text-base",
      },
      interactive: {
        true: "cursor-pointer",
        false: "",
      },
      solid: {
        true: "",
        false: "",
      },
    },
    compoundVariants: [
      {
        domain: "executing",
        solid: true,
        className: "bg-domain-executing text-white border-transparent",
      },
      {
        domain: "influencing",
        solid: true,
        className: "bg-domain-influencing text-white border-transparent",
      },
      {
        domain: "relationship",
        solid: true,
        className: "bg-domain-relationship text-white border-transparent",
      },
      {
        domain: "strategic",
        solid: true,
        className: "bg-domain-strategic text-white border-transparent",
      },
    ],
    defaultVariants: {
      domain: "executing",
      size: "default",
      interactive: false,
      solid: false,
    },
  }
);

export interface ThemeBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof themeBadgeVariants> {
  themeName: string;
  rank?: number;
  showRank?: boolean;
  domainSlug?: DomainSlug;
}

export function ThemeBadge({
  className,
  themeName,
  rank,
  showRank = false,
  domain,
  domainSlug,
  size,
  interactive,
  solid,
  ...props
}: ThemeBadgeProps) {
  const resolvedDomain = domain || domainSlug || "executing";

  return (
    <span
      className={cn(themeBadgeVariants({ domain: resolvedDomain, size, interactive, solid }), className)}
      {...props}
    >
      {showRank && rank && (
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/30 text-[10px] font-bold">
          {rank}
        </span>
      )}
      {themeName}
    </span>
  );
}

// Compact list of theme badges
export interface ThemeBadgeListProps {
  themes: Array<{
    name: string;
    slug: string;
    domain: DomainSlug;
    rank?: number;
  }>;
  showRanks?: boolean;
  maxVisible?: number;
  size?: "xs" | "sm" | "default" | "lg";
  className?: string;
}

export function ThemeBadgeList({
  themes,
  showRanks = false,
  maxVisible = 5,
  size = "sm",
  className,
}: ThemeBadgeListProps) {
  const visibleThemes = themes.slice(0, maxVisible);
  const hiddenCount = themes.length - maxVisible;

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {visibleThemes.map((theme) => (
        <ThemeBadge
          key={theme.slug}
          themeName={theme.name}
          domainSlug={theme.domain}
          rank={theme.rank}
          showRank={showRanks}
          size={size}
        />
      ))}
      {hiddenCount > 0 && (
        <span className="inline-flex items-center rounded-full border border-muted bg-muted/50 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
          +{hiddenCount} more
        </span>
      )}
    </div>
  );
}
