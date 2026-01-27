"use client";

import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { DomainIcon } from "@/components/strengths/DomainIcon";
import type { DomainSlug } from "@/constants/strengths-data";

interface DomainBarData {
  domain: DomainSlug;
  value: number;
  label: string;
}

interface DomainBarChartProps {
  data: DomainBarData[];
  className?: string;
  showLabels?: boolean;
  animated?: boolean;
  maxValue?: number;
}

const DOMAIN_COLORS = {
  executing: "bg-domain-executing",
  influencing: "bg-domain-influencing",
  relationship: "bg-domain-relationship",
  strategic: "bg-domain-strategic",
};

const DOMAIN_GLOWS = {
  executing: "shadow-domain-executing/30",
  influencing: "shadow-domain-influencing/30",
  relationship: "shadow-domain-relationship/30",
  strategic: "shadow-domain-strategic/30",
};

export function DomainBarChart({
  data,
  className,
  showLabels = true,
  animated = true,
  maxValue,
}: DomainBarChartProps) {
  const [animationProgress, setAnimationProgress] = useState(animated ? 0 : 1);
  const containerRef = useRef<HTMLDivElement>(null);

  const computedMaxValue = maxValue ?? Math.max(...data.map((d) => d.value));

  useEffect(() => {
    if (!animated) return;

    // Check for reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setAnimationProgress(1);
      return;
    }

    let start: number;
    const duration = 1000;

    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimationProgress(eased);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          requestAnimationFrame(animate);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [animated]);

  // Build dynamic aria-label from chart data
  const totalValue = data.reduce((sum, d) => sum + d.value, 0);
  const ariaLabel = `Domain bar chart. ${data
    .map((item) => {
      const pct = totalValue > 0 ? Math.round((item.value / totalValue) * 100) : 0;
      return `${item.label}: ${item.value} (${pct}%)`;
    })
    .join(", ")}.`;

  return (
    <div ref={containerRef} className={cn("space-y-4", className)} role="img" aria-label={ariaLabel} tabIndex={0}>
      {data.map((item, index) => {
        const percentage = (item.value / computedMaxValue) * 100 * animationProgress;

        return (
          <div
            key={item.domain}
            className="space-y-2"
          >
            {showLabels && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DomainIcon domain={item.domain} size="sm" />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                <span className="text-sm text-muted-foreground">{item.value}</span>
              </div>
            )}

            <div className="h-3 bg-muted rounded-full overflow-hidden" role="presentation">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-700 shadow-lg",
                  DOMAIN_COLORS[item.domain],
                  DOMAIN_GLOWS[item.domain]
                )}
                style={{
                  width: `${percentage}%`,
                  transitionDelay: `${index * 100}ms`,
                }}
              />
            </div>
          </div>
        );
      })}

      {/* Visually-hidden data table for screen readers */}
      <table className="sr-only">
        <caption>Domain Distribution</caption>
        <thead>
          <tr>
            <th scope="col">Domain</th>
            <th scope="col">Value</th>
            <th scope="col">Percentage</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => {
            const pct = totalValue > 0 ? Math.round((item.value / totalValue) * 100) : 0;
            return (
              <tr key={item.domain}>
                <td>{item.label}</td>
                <td>{item.value}</td>
                <td>{pct}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
