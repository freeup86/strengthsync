"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface DomainData {
  domain: "executing" | "influencing" | "relationship" | "strategic";
  value: number;
  label: string;
}

interface DomainDonutChartProps {
  data: DomainData[];
  size?: number;
  thickness?: number;
  className?: string;
  animated?: boolean;
  centerLabel?: string;
  centerValue?: string | number;
}

const DOMAIN_COLORS = {
  executing: "#7B68EE",
  influencing: "#F5A623",
  relationship: "#4A90D9",
  strategic: "#7CB342",
};

export function DomainDonutChart({
  data,
  size = 200,
  thickness = 24,
  className,
  animated = true,
  centerLabel = "Total",
  centerValue,
}: DomainDonutChartProps) {
  const [animationProgress, setAnimationProgress] = useState(animated ? 0 : 1);
  const svgRef = useRef<SVGSVGElement>(null);

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    if (!animated) return;

    // Check for reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setAnimationProgress(1);
      return;
    }

    let start: number;
    const duration = 1500;

    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);

      // Ease out cubic
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
      { threshold: 0.5 }
    );

    if (svgRef.current) {
      observer.observe(svgRef.current);
    }

    return () => observer.disconnect();
  }, [animated]);

  let currentOffset = 0;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        ref={svgRef}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={thickness}
          className="text-muted/30"
        />

        {/* Data segments */}
        {data.map((segment) => {
          const percentage = segment.value / total;
          const segmentLength = circumference * percentage * animationProgress;
          const offset = currentOffset;
          currentOffset += circumference * percentage;

          return (
            <circle
              key={segment.domain}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={DOMAIN_COLORS[segment.domain]}
              strokeWidth={thickness}
              strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
              strokeDashoffset={-offset * animationProgress}
              strokeLinecap="round"
              className="transition-all duration-300"
              style={{
                filter: `drop-shadow(0 0 6px ${DOMAIN_COLORS[segment.domain]}40)`,
              }}
            />
          );
        })}
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-display font-bold">{centerValue ?? total}</span>
        <span className="text-sm text-muted-foreground">{centerLabel}</span>
      </div>
    </div>
  );
}
