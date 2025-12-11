"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Zap, Megaphone, Heart, Lightbulb } from "lucide-react";
import type { DomainSlug } from "@/constants/strengths-data";

const domainIcons: Record<DomainSlug, React.ElementType> = {
  executing: Zap,
  influencing: Megaphone,
  relationship: Heart,
  strategic: Lightbulb,
};

const domainColors: Record<DomainSlug, string> = {
  executing: "text-domain-executing",
  influencing: "text-domain-influencing",
  relationship: "text-domain-relationship",
  strategic: "text-domain-strategic",
};

const domainBgColors: Record<DomainSlug, string> = {
  executing: "bg-domain-executing-light",
  influencing: "bg-domain-influencing-light",
  relationship: "bg-domain-relationship-light",
  strategic: "bg-domain-strategic-light",
};

export interface DomainIconProps extends React.HTMLAttributes<HTMLDivElement> {
  domain: DomainSlug;
  size?: "sm" | "default" | "lg" | "xl";
  withBackground?: boolean;
}

const sizeClasses = {
  sm: "h-4 w-4",
  default: "h-5 w-5",
  lg: "h-6 w-6",
  xl: "h-8 w-8",
};

const bgSizeClasses = {
  sm: "p-1.5",
  default: "p-2",
  lg: "p-2.5",
  xl: "p-3",
};

export function DomainIcon({
  domain,
  size = "default",
  withBackground = false,
  className,
  ...props
}: DomainIconProps) {
  const Icon = domainIcons[domain];

  if (withBackground) {
    return (
      <div
        className={cn(
          "inline-flex items-center justify-center rounded-full",
          domainBgColors[domain],
          bgSizeClasses[size],
          className
        )}
        {...props}
      >
        <Icon className={cn(sizeClasses[size], domainColors[domain])} />
      </div>
    );
  }

  return <Icon className={cn(sizeClasses[size], domainColors[domain], className)} {...props} />;
}

// Domain label with icon
export interface DomainLabelProps {
  domain: DomainSlug;
  domainName: string;
  size?: "sm" | "default" | "lg";
  className?: string;
}

export function DomainLabel({ domain, domainName, size = "default", className }: DomainLabelProps) {
  const textSizes = {
    sm: "text-xs",
    default: "text-sm",
    lg: "text-base",
  };

  return (
    <div className={cn("inline-flex items-center gap-1.5", className)}>
      <DomainIcon domain={domain} size={size} />
      <span className={cn("font-medium", domainColors[domain], textSizes[size])}>{domainName}</span>
    </div>
  );
}
