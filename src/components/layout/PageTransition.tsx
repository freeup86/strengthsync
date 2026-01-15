"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { LogoAnimated } from "@/components/brand/Logo";

interface PageTransitionProps {
  children: React.ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showLogo, setShowLogo] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);
  const previousPathname = useRef(pathname);

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (pathname !== previousPathname.current) {
      if (prefersReducedMotion) {
        // Skip animation for reduced motion
        setDisplayChildren(children);
        previousPathname.current = pathname;
        return;
      }

      setIsTransitioning(true);
      setShowLogo(true);

      // Logo appears briefly
      const logoTimer = setTimeout(() => {
        setShowLogo(false);
        setDisplayChildren(children);
      }, 300);

      // Content fades in
      const transitionTimer = setTimeout(() => {
        setIsTransitioning(false);
        previousPathname.current = pathname;
      }, 500);

      return () => {
        clearTimeout(logoTimer);
        clearTimeout(transitionTimer);
      };
    } else {
      setDisplayChildren(children);
    }
  }, [pathname, children]);

  return (
    <>
      {/* Transition overlay with animated logo */}
      <div
        className={cn(
          "fixed inset-0 z-[100] pointer-events-none flex items-center justify-center",
          "bg-background/80 backdrop-blur-sm",
          "transition-opacity duration-200",
          showLogo ? "opacity-100" : "opacity-0"
        )}
      >
        <div className={cn(
          "transition-transform duration-300",
          showLogo ? "scale-100" : "scale-75"
        )}>
          <LogoAnimated size="xl" />
        </div>
      </div>

      {/* Page content with fade */}
      <div
        className={cn(
          "transition-all duration-300 ease-out",
          isTransitioning ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
        )}
      >
        {displayChildren}
      </div>
    </>
  );
}
