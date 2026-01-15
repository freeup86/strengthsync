"use client";

import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const skeletonVariants = cva(
  "animate-pulse rounded-md",
  {
    variants: {
      variant: {
        default: "bg-muted",
        // Domain-colored shimmer variants
        executing: "bg-gradient-to-r from-domain-executing-light via-domain-executing/20 to-domain-executing-light bg-[length:200%_100%] animate-shimmer",
        influencing: "bg-gradient-to-r from-domain-influencing-light via-domain-influencing/20 to-domain-influencing-light bg-[length:200%_100%] animate-shimmer",
        relationship: "bg-gradient-to-r from-domain-relationship-light via-domain-relationship/20 to-domain-relationship-light bg-[length:200%_100%] animate-shimmer",
        strategic: "bg-gradient-to-r from-domain-strategic-light via-domain-strategic/20 to-domain-strategic-light bg-[length:200%_100%] animate-shimmer",
        // Multi-domain shimmer
        rainbow: "bg-gradient-to-r from-domain-executing-light via-domain-influencing-light via-domain-relationship-light to-domain-strategic-light bg-[length:400%_100%] animate-shimmer",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {}

export function Skeleton({ className, variant, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(skeletonVariants({ variant }), className)}
      {...props}
    />
  );
}

// Pre-built skeleton patterns
export function SkeletonCard({ variant }: { variant?: SkeletonProps["variant"] }) {
  return (
    <div className="rounded-2xl border bg-card p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton variant={variant} className="h-12 w-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton variant={variant} className="h-4 w-[60%]" />
          <Skeleton variant={variant} className="h-3 w-[40%]" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton variant={variant} className="h-3 w-full" />
        <Skeleton variant={variant} className="h-3 w-[80%]" />
      </div>
    </div>
  );
}

export function SkeletonStrengthBadges() {
  return (
    <div className="flex gap-2">
      <Skeleton variant="executing" className="h-6 w-20 rounded-full" />
      <Skeleton variant="influencing" className="h-6 w-24 rounded-full" />
      <Skeleton variant="strategic" className="h-6 w-16 rounded-full" />
    </div>
  );
}

export function SkeletonDashboardStats() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        "executing" as const,
        "influencing" as const,
        "relationship" as const,
        "strategic" as const,
      ].map((domain, i) => (
        <div key={i} className="rounded-2xl border bg-card p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
            <Skeleton
              variant={domain}
              className="h-10 w-10 rounded-lg"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonMemberCard() {
  return (
    <div className="rounded-2xl border bg-card p-6">
      <div className="flex items-center gap-4 mb-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <SkeletonStrengthBadges />
    </div>
  );
}

export function SkeletonShoutout() {
  return (
    <div className="rounded-xl bg-muted/30 p-4">
      <div className="flex items-start gap-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-24" />
            <Skeleton variant="influencing" className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-[70%]" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
}
