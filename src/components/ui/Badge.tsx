"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground",
        // Domain variants - solid
        executing: "border-transparent bg-domain-executing text-white",
        influencing: "border-transparent bg-domain-influencing text-white",
        relationship: "border-transparent bg-domain-relationship text-white",
        strategic: "border-transparent bg-domain-strategic text-white",
        // Domain variants - soft
        "executing-soft":
          "bg-domain-executing-light text-domain-executing-dark border-domain-executing/20",
        "influencing-soft":
          "bg-domain-influencing-light text-domain-influencing-dark border-domain-influencing/20",
        "relationship-soft":
          "bg-domain-relationship-light text-domain-relationship-dark border-domain-relationship/20",
        "strategic-soft":
          "bg-domain-strategic-light text-domain-strategic-dark border-domain-strategic/20",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-[10px]",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}

export { Badge, badgeVariants };
