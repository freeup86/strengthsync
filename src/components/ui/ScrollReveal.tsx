"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type AnimationType = "fade-up" | "fade-down" | "fade-left" | "fade-right" | "scale" | "blur";

interface ScrollRevealProps {
  children: React.ReactNode;
  animation?: AnimationType;
  delay?: number;
  duration?: number;
  threshold?: number;
  className?: string;
  once?: boolean;
}

const animations: Record<AnimationType, { initial: string; visible: string }> = {
  "fade-up": {
    initial: "opacity-0 translate-y-8",
    visible: "opacity-100 translate-y-0",
  },
  "fade-down": {
    initial: "opacity-0 -translate-y-8",
    visible: "opacity-100 translate-y-0",
  },
  "fade-left": {
    initial: "opacity-0 translate-x-8",
    visible: "opacity-100 translate-x-0",
  },
  "fade-right": {
    initial: "opacity-0 -translate-x-8",
    visible: "opacity-100 translate-x-0",
  },
  scale: {
    initial: "opacity-0 scale-95",
    visible: "opacity-100 scale-100",
  },
  blur: {
    initial: "opacity-0 blur-sm",
    visible: "opacity-100 blur-0",
  },
};

export function ScrollReveal({
  children,
  animation = "fade-up",
  delay = 0,
  duration = 500,
  threshold = 0.1,
  className,
  once = true,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    if (mediaQuery.matches) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) {
            observer.disconnect();
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold, once]);

  const animConfig = animations[animation];

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all ease-out",
        prefersReducedMotion ? "" : isVisible ? animConfig.visible : animConfig.initial,
        className
      )}
      style={{
        transitionDuration: prefersReducedMotion ? "0ms" : `${duration}ms`,
        transitionDelay: prefersReducedMotion ? "0ms" : `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

interface ScrollRevealGroupProps {
  children: React.ReactNode;
  staggerDelay?: number;
  className?: string;
}

export function ScrollRevealGroup({
  children,
  staggerDelay = 100,
  className,
}: ScrollRevealGroupProps) {
  return (
    <div className={className}>
      {Array.isArray(children)
        ? children.map((child, index) => {
            if (child?.type === ScrollReveal) {
              return {
                ...child,
                props: {
                  ...child.props,
                  delay: (child.props.delay || 0) + index * staggerDelay,
                },
              };
            }
            return child;
          })
        : children}
    </div>
  );
}
