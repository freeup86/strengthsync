# StrengthSync UI/UX Enhancement Implementation Guide

This guide provides production-ready code for implementing the opportunities identified in the UI/UX evaluation.

---

## Table of Contents

1. [Quick Wins](#quick-wins)
   - [1.1 Enhanced Noise & Grain Overlays](#11-enhanced-noise--grain-overlays)
   - [1.2 Scroll-Triggered Animations](#12-scroll-triggered-animations)
   - [1.3 Domain Cursor Trail](#13-domain-cursor-trail)
   - [1.4 Celebration Confetti](#14-celebration-confetti)
2. [Medium Effort](#medium-effort)
   - [2.1 Hero Section Asymmetry](#21-hero-section-asymmetry)
   - [2.2 Enhanced Micro-Interactions](#22-enhanced-micro-interactions)
   - [2.3 Domain Skeleton Loaders](#23-domain-skeleton-loaders)
   - [2.4 3D Strength Card Flip](#24-3d-strength-card-flip)
3. [Larger Opportunities](#larger-opportunities)
   - [3.1 Dashboard Layout Redesign](#31-dashboard-layout-redesign)
   - [3.2 Page Transitions](#32-page-transitions)
   - [3.3 Badge Celebration System](#33-badge-celebration-system)
   - [3.4 Domain-Themed Data Visualizations](#34-domain-themed-data-visualizations)

---

## Quick Wins

### 1.1 Enhanced Noise & Grain Overlays

**File: `src/app/globals.css`**

Replace the existing noise overlay with more visible variants:

```css
@layer utilities {
  /* Base noise overlay - more visible */
  .noise-overlay {
    position: relative;
  }

  .noise-overlay::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
    opacity: 0.08;
    pointer-events: none;
    mix-blend-mode: overlay;
    border-radius: inherit;
  }

  /* Subtle grain - for cards */
  .grain-subtle::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='turbulence' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch' result='turbulence'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23grain)'/%3E%3C/svg%3E");
    opacity: 0.04;
    pointer-events: none;
    mix-blend-mode: multiply;
    border-radius: inherit;
  }

  .dark .grain-subtle::after {
    mix-blend-mode: soft-light;
    opacity: 0.06;
  }

  /* Heavy grain - for hero sections */
  .grain-heavy::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='turbulence' baseFrequency='0.9' numOctaves='5' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23grain)'/%3E%3C/svg%3E");
    opacity: 0.12;
    pointer-events: none;
    mix-blend-mode: overlay;
    border-radius: inherit;
  }

  /* Domain-tinted grain */
  .grain-executing::after {
    content: '';
    position: absolute;
    inset: 0;
    background:
      url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='grain'%3E%3CfeTurbulence baseFrequency='0.7'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23grain)'/%3E%3C/svg%3E"),
      linear-gradient(135deg, rgba(123, 104, 238, 0.1) 0%, transparent 100%);
    opacity: 0.15;
    pointer-events: none;
    mix-blend-mode: overlay;
    border-radius: inherit;
  }
}
```

**Usage:**
```tsx
<Card className="grain-subtle">...</Card>
<section className="grain-heavy">...</section>
```

---

### 1.2 Scroll-Triggered Animations

**File: `src/components/ui/ScrollReveal.tsx`** (NEW)

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  animation?: "fade-up" | "fade-down" | "fade-left" | "fade-right" | "scale" | "blur";
  delay?: number;
  threshold?: number;
  once?: boolean;
}

const animationClasses = {
  "fade-up": {
    hidden: "opacity-0 translate-y-8",
    visible: "opacity-100 translate-y-0",
  },
  "fade-down": {
    hidden: "opacity-0 -translate-y-8",
    visible: "opacity-100 translate-y-0",
  },
  "fade-left": {
    hidden: "opacity-0 translate-x-8",
    visible: "opacity-100 translate-x-0",
  },
  "fade-right": {
    hidden: "opacity-0 -translate-x-8",
    visible: "opacity-100 translate-x-0",
  },
  scale: {
    hidden: "opacity-0 scale-95",
    visible: "opacity-100 scale-100",
  },
  blur: {
    hidden: "opacity-0 blur-sm scale-98",
    visible: "opacity-100 blur-0 scale-100",
  },
};

export function ScrollReveal({
  children,
  className,
  animation = "fade-up",
  delay = 0,
  threshold = 0.1,
  once = true,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once && ref.current) {
            observer.unobserve(ref.current);
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin: "0px 0px -50px 0px" }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold, once]);

  const { hidden, visible } = animationClasses[animation];

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-out",
        isVisible ? visible : hidden,
        className
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// Staggered container for multiple items
interface ScrollRevealGroupProps {
  children: React.ReactNode;
  className?: string;
  animation?: ScrollRevealProps["animation"];
  staggerDelay?: number;
}

export function ScrollRevealGroup({
  children,
  className,
  animation = "fade-up",
  staggerDelay = 100,
}: ScrollRevealGroupProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (ref.current) observer.unobserve(ref.current);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const { hidden, visible } = animationClasses[animation];

  return (
    <div ref={ref} className={className}>
      {Array.isArray(children)
        ? children.map((child, index) => (
            <div
              key={index}
              className={cn(
                "transition-all duration-700 ease-out",
                isVisible ? visible : hidden
              )}
              style={{ transitionDelay: `${index * staggerDelay}ms` }}
            >
              {child}
            </div>
          ))
        : children}
    </div>
  );
}
```

**Usage in pages:**
```tsx
import { ScrollReveal, ScrollRevealGroup } from "@/components/ui/ScrollReveal";

// Single element
<ScrollReveal animation="fade-up" delay={200}>
  <Card>Content</Card>
</ScrollReveal>

// Group with stagger
<ScrollRevealGroup animation="scale" staggerDelay={100} className="grid grid-cols-3 gap-4">
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
</ScrollRevealGroup>
```

---

### 1.3 Domain Cursor Trail

**File: `src/components/effects/CursorTrail.tsx`** (NEW)

```tsx
"use client";

import { useEffect, useRef, useCallback } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

const DOMAIN_COLORS = [
  "#7B68EE", // Executing - Purple
  "#F5A623", // Influencing - Orange
  "#4A90D9", // Relationship - Blue
  "#7CB342", // Strategic - Green
];

export function CursorTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animationRef = useRef<number>();
  const colorIndexRef = useRef(0);

  const createParticle = useCallback((x: number, y: number) => {
    const color = DOMAIN_COLORS[colorIndexRef.current % DOMAIN_COLORS.length];
    colorIndexRef.current++;

    return {
      x,
      y,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      life: 1,
      color,
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };

      // Add new particles on movement
      if (Math.random() > 0.5) {
        particlesRef.current.push(
          createParticle(mouseRef.current.x, mouseRef.current.y)
        );
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current = particlesRef.current.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
        p.vy += 0.05; // Gravity

        if (p.life <= 0) return false;

        ctx.beginPath();
        ctx.arc(p.x, p.y, 4 * p.life, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.floor(p.life * 255).toString(16).padStart(2, "0");
        ctx.fill();

        return true;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", handleMouseMove);
    animate();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [createParticle]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999]"
      style={{ opacity: 0.6 }}
    />
  );
}
```

**File: `src/components/providers/EffectsProvider.tsx`** (NEW)

```tsx
"use client";

import { createContext, useContext, useState } from "react";
import { CursorTrail } from "@/components/effects/CursorTrail";

interface EffectsContextType {
  cursorTrailEnabled: boolean;
  setCursorTrailEnabled: (enabled: boolean) => void;
}

const EffectsContext = createContext<EffectsContextType | null>(null);

export function EffectsProvider({ children }: { children: React.ReactNode }) {
  const [cursorTrailEnabled, setCursorTrailEnabled] = useState(false);

  return (
    <EffectsContext.Provider value={{ cursorTrailEnabled, setCursorTrailEnabled }}>
      {cursorTrailEnabled && <CursorTrail />}
      {children}
    </EffectsContext.Provider>
  );
}

export function useEffects() {
  const context = useContext(EffectsContext);
  if (!context) throw new Error("useEffects must be used within EffectsProvider");
  return context;
}
```

**Note:** Enable cursor trail selectively (e.g., on landing page only) to avoid performance issues on data-heavy pages.

---

### 1.4 Celebration Confetti

**File: `src/components/effects/Confetti.tsx`** (NEW)

```tsx
"use client";

import { useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";

interface ConfettiPiece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  size: number;
  shape: "square" | "circle" | "star";
  life: number;
}

const DOMAIN_COLORS = [
  "#7B68EE", // Executing
  "#F5A623", // Influencing
  "#4A90D9", // Relationship
  "#7CB342", // Strategic
];

interface ConfettiProps {
  active: boolean;
  onComplete?: () => void;
  particleCount?: number;
  origin?: { x: number; y: number };
  spread?: number;
  duration?: number;
}

export function Confetti({
  active,
  onComplete,
  particleCount = 100,
  origin = { x: 0.5, y: 0.5 },
  spread = 60,
  duration = 3000,
}: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const piecesRef = useRef<ConfettiPiece[]>([]);
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>(0);

  const createPiece = useCallback(
    (originX: number, originY: number): ConfettiPiece => {
      const angle = (Math.random() - 0.5) * spread * (Math.PI / 180);
      const velocity = 15 + Math.random() * 10;

      return {
        x: originX,
        y: originY,
        vx: Math.sin(angle) * velocity * (Math.random() > 0.5 ? 1 : -1),
        vy: -Math.cos(angle) * velocity - Math.random() * 5,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        color: DOMAIN_COLORS[Math.floor(Math.random() * DOMAIN_COLORS.length)],
        size: 8 + Math.random() * 8,
        shape: ["square", "circle", "star"][Math.floor(Math.random() * 3)] as ConfettiPiece["shape"],
        life: 1,
      };
    },
    [spread]
  );

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const originX = canvas.width * origin.x;
    const originY = canvas.height * origin.y;

    // Create initial burst
    piecesRef.current = Array.from({ length: particleCount }, () =>
      createPiece(originX, originY)
    );
    startTimeRef.current = Date.now();

    const drawStar = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      const spikes = 5;
      const outerRadius = size;
      const innerRadius = size / 2;

      ctx.beginPath();
      for (let i = 0; i < spikes * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (i * Math.PI) / spikes - Math.PI / 2;
        const px = x + Math.cos(angle) * radius;
        const py = y + Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
    };

    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      if (elapsed > duration) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        onComplete?.();
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      piecesRef.current.forEach((piece) => {
        piece.x += piece.vx;
        piece.y += piece.vy;
        piece.vy += 0.5; // Gravity
        piece.vx *= 0.99; // Air resistance
        piece.rotation += piece.rotationSpeed;
        piece.life = Math.max(0, 1 - elapsed / duration);

        ctx.save();
        ctx.translate(piece.x, piece.y);
        ctx.rotate((piece.rotation * Math.PI) / 180);
        ctx.globalAlpha = piece.life;
        ctx.fillStyle = piece.color;

        switch (piece.shape) {
          case "square":
            ctx.fillRect(-piece.size / 2, -piece.size / 2, piece.size, piece.size);
            break;
          case "circle":
            ctx.beginPath();
            ctx.arc(0, 0, piece.size / 2, 0, Math.PI * 2);
            ctx.fill();
            break;
          case "star":
            drawStar(ctx, 0, 0, piece.size / 2);
            ctx.fill();
            break;
        }

        ctx.restore();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [active, particleCount, origin, spread, duration, createPiece, onComplete]);

  if (!active) return null;

  return createPortal(
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999]"
    />,
    document.body
  );
}
```

**File: `src/hooks/useConfetti.ts`** (NEW)

```tsx
"use client";

import { useState, useCallback } from "react";

export function useConfetti() {
  const [isActive, setIsActive] = useState(false);
  const [origin, setOrigin] = useState({ x: 0.5, y: 0.5 });

  const fire = useCallback((options?: { origin?: { x: number; y: number } }) => {
    if (options?.origin) setOrigin(options.origin);
    setIsActive(true);
  }, []);

  const fireFromElement = useCallback((element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;
    setOrigin({ x, y });
    setIsActive(true);
  }, []);

  const reset = useCallback(() => setIsActive(false), []);

  return {
    isActive,
    origin,
    fire,
    fireFromElement,
    reset,
  };
}
```

**Usage example in shoutout creation:**

```tsx
import { Confetti } from "@/components/effects/Confetti";
import { useConfetti } from "@/hooks/useConfetti";

function CreateShoutoutPage() {
  const confetti = useConfetti();
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleSubmit = async () => {
    const result = await createShoutout(data);
    if (result.success && buttonRef.current) {
      confetti.fireFromElement(buttonRef.current);
    }
  };

  return (
    <>
      <Button ref={buttonRef} onClick={handleSubmit}>
        Send Shoutout
      </Button>
      <Confetti
        active={confetti.isActive}
        origin={confetti.origin}
        onComplete={confetti.reset}
      />
    </>
  );
}
```

---

## Medium Effort

### 2.1 Hero Section Asymmetry

**File: `src/app/page.tsx`** - Updated hero section:

```tsx
{/* Hero Section - Asymmetric Design */}
<section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
  {/* Enhanced floating orbs with blur layers */}
  <div className="absolute inset-0 pointer-events-none">
    {/* Large background orbs */}
    <div className="floating-orb w-[800px] h-[800px] -top-[400px] -left-[200px] bg-domain-executing opacity-20" />
    <div className="floating-orb w-[600px] h-[600px] top-[100px] -right-[300px] bg-domain-influencing opacity-25" style={{ animationDelay: "2s" }} />

    {/* Decorative geometric shapes */}
    <div className="absolute top-[20%] right-[10%] w-32 h-32 border-2 border-domain-strategic/20 rounded-3xl rotate-12 animate-float" style={{ animationDelay: "1s" }} />
    <div className="absolute bottom-[30%] left-[5%] w-24 h-24 bg-domain-relationship/10 rounded-full animate-float" style={{ animationDelay: "3s" }} />
    <div className="absolute top-[60%] right-[25%] w-16 h-16 border border-domain-influencing/30 rotate-45 animate-float" style={{ animationDelay: "2.5s" }} />
  </div>

  <div className="relative max-w-7xl mx-auto">
    {/* Asymmetric grid layout */}
    <div className="grid lg:grid-cols-12 gap-8 items-center">
      {/* Text content - offset to left */}
      <div className="lg:col-span-7 lg:pr-12">
        {/* Badge with pulse */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/80 backdrop-blur-sm border border-border/50 mb-8 animate-fade-in">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-domain-strategic opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-domain-strategic" />
          </span>
          <span className="text-sm font-medium">Powered by CliftonStrengths</span>
        </div>

        {/* Headline with text gradient */}
        <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 animate-fade-in-up text-balance">
          Discover Your Team's
          <span className="block mt-2">
            <span className="text-gradient">Unique Superpowers</span>
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-xl text-muted-foreground max-w-xl mb-8 animate-fade-in-up stagger-2">
          Connect, collaborate, and grow together through CliftonStrengths insights,
          peer recognition, and playful team engagement.
        </p>

        {/* CTA Buttons - stacked on mobile, inline on desktop */}
        <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up stagger-3">
          <Button size="xl" className="group" asChild>
            <Link href="/auth/register">
              Get Started
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
          <Button size="xl" variant="outline" asChild>
            <Link href="#features">See How It Works</Link>
          </Button>
        </div>
      </div>

      {/* Visual element - offset to right with overlap */}
      <div className="lg:col-span-5 relative">
        {/* Floating card stack */}
        <div className="relative h-[400px] lg:h-[500px]">
          {/* Background card */}
          <Card
            variant="strategic"
            className="absolute top-8 left-8 w-[280px] p-6 rotate-[-8deg] opacity-60 animate-fade-in stagger-4"
          >
            <div className="flex items-center gap-3 mb-3">
              <DomainIcon domain="strategic" size="lg" />
              <span className="font-semibold">Strategic Thinking</span>
            </div>
            <div className="space-y-2">
              <ThemeBadge themeName="Analytical" domainSlug="strategic" size="sm" />
              <ThemeBadge themeName="Futuristic" domainSlug="strategic" size="sm" />
            </div>
          </Card>

          {/* Middle card */}
          <Card
            variant="influencing"
            className="absolute top-16 left-16 w-[280px] p-6 rotate-[-4deg] opacity-80 animate-fade-in stagger-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <DomainIcon domain="influencing" size="lg" />
              <span className="font-semibold">Influencing</span>
            </div>
            <div className="space-y-2">
              <ThemeBadge themeName="Communication" domainSlug="influencing" size="sm" />
              <ThemeBadge themeName="Activator" domainSlug="influencing" size="sm" />
            </div>
          </Card>

          {/* Front card - highlighted */}
          <Card
            variant="executing"
            className="absolute top-24 left-24 w-[280px] p-6 shadow-soft-lg animate-fade-in stagger-6 hover:rotate-2 transition-transform"
          >
            <div className="flex items-center gap-3 mb-3">
              <DomainIcon domain="executing" size="lg" />
              <span className="font-semibold">Executing</span>
            </div>
            <div className="space-y-2">
              <ThemeBadge themeName="Achiever" domainSlug="executing" size="sm" solid />
              <ThemeBadge themeName="Focus" domainSlug="executing" size="sm" solid />
              <ThemeBadge themeName="Responsibility" domainSlug="executing" size="sm" solid />
            </div>
            <div className="mt-4 pt-4 border-t border-domain-executing/20">
              <p className="text-sm text-muted-foreground">
                "Making things happen through tireless effort"
              </p>
            </div>
          </Card>

          {/* Floating theme badges around cards */}
          <ThemeBadge
            themeName="Empathy"
            domainSlug="relationship"
            className="absolute -top-4 right-8 animate-float"
            style={{ animationDelay: "0.5s" }}
          />
          <ThemeBadge
            themeName="Learner"
            domainSlug="strategic"
            className="absolute bottom-8 -left-4 animate-float"
            style={{ animationDelay: "1.5s" }}
          />
        </div>
      </div>
    </div>
  </div>
</section>
```

---

### 2.2 Enhanced Micro-Interactions

**File: `src/app/globals.css`** - Add these new interaction classes:

```css
@layer components {
  /* Button press effect */
  .btn-press {
    transition: transform 0.1s ease, box-shadow 0.1s ease;
  }

  .btn-press:active {
    transform: scale(0.97) translateY(1px);
  }

  /* Icon bounce on hover */
  .icon-bounce:hover svg,
  .icon-bounce:hover [data-icon] {
    animation: iconBounce 0.4s ease;
  }

  @keyframes iconBounce {
    0%, 100% { transform: translateY(0); }
    25% { transform: translateY(-3px); }
    50% { transform: translateY(0); }
    75% { transform: translateY(-1px); }
  }

  /* Card content reveal */
  .card-reveal {
    overflow: hidden;
  }

  .card-reveal .card-reveal-content {
    transform: translateY(100%);
    opacity: 0;
    transition: transform 0.3s ease, opacity 0.3s ease;
  }

  .card-reveal:hover .card-reveal-content {
    transform: translateY(0);
    opacity: 1;
  }

  /* Magnetic button effect */
  .magnetic {
    transition: transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  /* Ripple effect */
  .ripple {
    position: relative;
    overflow: hidden;
  }

  .ripple::after {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at var(--ripple-x, 50%) var(--ripple-y, 50%),
      currentColor 0%, transparent 60%);
    opacity: 0;
    transform: scale(0);
    transition: transform 0.5s ease, opacity 0.3s ease;
  }

  .ripple:active::after {
    opacity: 0.1;
    transform: scale(2);
  }

  /* Glow on hover */
  .hover-glow-executing:hover {
    box-shadow: 0 0 30px -5px var(--domain-executing);
  }

  .hover-glow-influencing:hover {
    box-shadow: 0 0 30px -5px var(--domain-influencing);
  }

  .hover-glow-relationship:hover {
    box-shadow: 0 0 30px -5px var(--domain-relationship);
  }

  .hover-glow-strategic:hover {
    box-shadow: 0 0 30px -5px var(--domain-strategic);
  }

  /* Text color shift on hover */
  .hover-gradient-text {
    background-size: 200% 100%;
    background-position: 0% 50%;
    transition: background-position 0.5s ease;
  }

  .hover-gradient-text:hover {
    background-position: 100% 50%;
  }

  /* Stagger children on container hover */
  .stagger-hover > * {
    transition: transform 0.3s ease, opacity 0.3s ease;
  }

  .stagger-hover:hover > *:nth-child(1) { transform: translateY(-2px); transition-delay: 0ms; }
  .stagger-hover:hover > *:nth-child(2) { transform: translateY(-2px); transition-delay: 50ms; }
  .stagger-hover:hover > *:nth-child(3) { transform: translateY(-2px); transition-delay: 100ms; }
  .stagger-hover:hover > *:nth-child(4) { transform: translateY(-2px); transition-delay: 150ms; }
  .stagger-hover:hover > *:nth-child(5) { transform: translateY(-2px); transition-delay: 200ms; }
}
```

**File: `src/components/ui/MagneticButton.tsx`** (NEW)

```tsx
"use client";

import { useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button, ButtonProps } from "./Button";

interface MagneticButtonProps extends ButtonProps {
  strength?: number;
}

export function MagneticButton({
  children,
  className,
  strength = 0.3,
  ...props
}: MagneticButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = (e.clientX - centerX) * strength;
    const deltaY = (e.clientY - centerY) * strength;

    setTransform({ x: deltaX, y: deltaY });
  }, [strength]);

  const handleMouseLeave = useCallback(() => {
    setTransform({ x: 0, y: 0 });
  }, []);

  return (
    <Button
      ref={buttonRef}
      className={cn("magnetic", className)}
      style={{
        transform: `translate(${transform.x}px, ${transform.y}px)`,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </Button>
  );
}
```

---

### 2.3 Domain Skeleton Loaders

**File: `src/components/ui/Skeleton.tsx`** (NEW or UPDATE)

```tsx
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
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="rounded-2xl border bg-card p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
            <Skeleton
              variant={["executing", "influencing", "relationship", "strategic"][i] as SkeletonProps["variant"]}
              className="h-10 w-10 rounded-lg"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
```

**Update `tailwind.config.ts`** to ensure shimmer animation exists:

```ts
animation: {
  // ... existing animations
  shimmer: "shimmer 2s linear infinite",
},
keyframes: {
  // ... existing keyframes
  shimmer: {
    "0%": { backgroundPosition: "-200% 0" },
    "100%": { backgroundPosition: "200% 0" },
  },
},
```

---

### 2.4 3D Strength Card Flip

**File: `src/components/strengths/StrengthCard3D.tsx`** (NEW)

```tsx
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

  return (
    <div
      className={cn(
        "perspective-1000 cursor-pointer group",
        className
      )}
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div
        className={cn(
          "relative w-full h-[400px] transition-transform duration-700 preserve-3d",
          isFlipped && "[transform:rotateY(180deg)]"
        )}
      >
        {/* Front of card */}
        <Card
          variant={domain}
          className={cn(
            "absolute inset-0 backface-hidden p-6 flex flex-col",
            "hover:shadow-soft-lg transition-shadow"
          )}
        >
          {/* Rank badge */}
          <div className="absolute top-4 right-4">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold",
              `bg-domain-${domain} text-white`
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
            "absolute inset-0 backface-hidden [transform:rotateY(180deg)] p-6 overflow-y-auto",
            "bg-gradient-to-br from-card to-muted/30"
          )}
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
```

---

## Larger Opportunities

### 3.1 Dashboard Layout Redesign

**Concept:** Break the uniform grid with a featured "hero card" and varied card heights.

**File: `src/app/dashboard/page.tsx`** - Updated layout structure:

```tsx
{/* Stats with featured card */}
<div className="grid grid-cols-12 gap-4">
  {/* Featured stat - takes more space */}
  <Card className="col-span-12 lg:col-span-5 row-span-2 p-8 bg-gradient-to-br from-domain-executing-light to-card dark:from-domain-executing/20 dark:to-card relative overflow-hidden group">
    {/* Background decoration */}
    <div className="absolute -top-12 -right-12 w-48 h-48 bg-domain-executing/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />

    <div className="relative">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-2xl bg-domain-executing text-white">
          <Trophy className="h-8 w-8" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Your Points</p>
          <p className="text-4xl font-display font-bold">
            {(data?.myPoints || 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Progress to next badge */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Next badge at 500</span>
          <span className="font-medium">{Math.min(100, (data?.myPoints || 0) / 5)}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-domain-executing rounded-full transition-all duration-1000"
            style={{ width: `${Math.min(100, (data?.myPoints || 0) / 5)}%` }}
          />
        </div>
      </div>

      <Button variant="executing-soft" className="mt-6 w-full" asChild>
        <Link href="/leaderboard">View Leaderboard</Link>
      </Button>
    </div>
  </Card>

  {/* Smaller stats - stacked */}
  <div className="col-span-6 lg:col-span-3">
    <Card className="p-6 h-full card-interactive hover-glow-relationship">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Team Members</p>
          <p className="text-3xl font-display font-bold mt-1">
            {data?.teamStats.totalMembers || 0}
          </p>
        </div>
        <Users className="h-6 w-6 text-domain-relationship" />
      </div>
    </Card>
  </div>

  <div className="col-span-6 lg:col-span-4">
    <Card className="p-6 h-full card-interactive hover-glow-influencing">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Shoutouts This Week</p>
          <p className="text-3xl font-display font-bold mt-1">
            {data?.teamStats.shoutoutsThisWeek || 0}
          </p>
        </div>
        <MessageSquare className="h-6 w-6 text-domain-influencing" />
      </div>
    </Card>
  </div>

  <div className="col-span-6 lg:col-span-3">
    <Card className="p-6 h-full card-interactive">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Your Streak</p>
          <p className="text-3xl font-display font-bold mt-1">
            {data?.myStreak || 0} <span className="text-lg">days</span>
          </p>
        </div>
        <Flame className="h-6 w-6 text-orange-500" />
      </div>
    </Card>
  </div>

  <div className="col-span-6 lg:col-span-4">
    <Card className="p-6 h-full card-interactive hover-glow-strategic">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">With Strengths</p>
          <p className="text-3xl font-display font-bold mt-1">
            {data?.teamStats.membersWithStrengths || 0}
            <span className="text-lg text-muted-foreground">
              /{data?.teamStats.totalMembers || 0}
            </span>
          </p>
        </div>
        <Sparkles className="h-6 w-6 text-domain-strategic" />
      </div>
    </Card>
  </div>
</div>
```

---

### 3.2 Page Transitions

**File: `src/components/layout/PageTransition.tsx`** (NEW)

```tsx
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
  const previousPathname = useRef(pathname);

  useEffect(() => {
    if (pathname !== previousPathname.current) {
      setIsTransitioning(true);
      setShowLogo(true);

      // Logo appears
      const logoTimer = setTimeout(() => {
        setShowLogo(false);
      }, 400);

      // Content fades in
      const transitionTimer = setTimeout(() => {
        setIsTransitioning(false);
        previousPathname.current = pathname;
      }, 600);

      return () => {
        clearTimeout(logoTimer);
        clearTimeout(transitionTimer);
      };
    }
  }, [pathname]);

  return (
    <>
      {/* Transition overlay with logo */}
      <div
        className={cn(
          "fixed inset-0 z-[100] pointer-events-none flex items-center justify-center",
          "bg-background/80 backdrop-blur-sm",
          "transition-opacity duration-300",
          showLogo ? "opacity-100" : "opacity-0"
        )}
      >
        <LogoAnimated size="xl" />
      </div>

      {/* Page content with fade */}
      <div
        className={cn(
          "transition-all duration-500",
          isTransitioning ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
        )}
      >
        {children}
      </div>
    </>
  );
}
```

**Usage in `src/app/layout.tsx`:**

```tsx
import { PageTransition } from "@/components/layout/PageTransition";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <PageTransition>
            {children}
          </PageTransition>
        </Providers>
      </body>
    </html>
  );
}
```

---

### 3.3 Badge Celebration System

**File: `src/components/gamification/BadgeCelebration.tsx`** (NEW)

```tsx
"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Confetti } from "@/components/effects/Confetti";
import { X, Share2, Trophy } from "lucide-react";

interface BadgeCelebrationProps {
  badge: {
    name: string;
    description: string;
    iconUrl: string;
    tier: "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";
    category: string;
    points: number;
  };
  isOpen: boolean;
  onClose: () => void;
}

const tierColors = {
  BRONZE: "from-amber-600 to-amber-800",
  SILVER: "from-slate-300 to-slate-500",
  GOLD: "from-yellow-400 to-amber-500",
  PLATINUM: "from-indigo-300 to-purple-500",
};

const tierGlow = {
  BRONZE: "shadow-amber-500/50",
  SILVER: "shadow-slate-400/50",
  GOLD: "shadow-yellow-400/50",
  PLATINUM: "shadow-purple-400/50",
};

export function BadgeCelebration({ badge, isOpen, onClose }: BadgeCelebrationProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [animationStage, setAnimationStage] = useState<"hidden" | "badge" | "details" | "actions">("hidden");

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      setAnimationStage("badge");

      const timers = [
        setTimeout(() => setAnimationStage("details"), 800),
        setTimeout(() => setAnimationStage("actions"), 1200),
        setTimeout(() => setShowConfetti(false), 3000),
      ];

      return () => timers.forEach(clearTimeout);
    } else {
      setAnimationStage("hidden");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <>
      <Confetti active={showConfetti} particleCount={150} />

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className={cn(
            "relative max-w-md w-full bg-card rounded-3xl overflow-hidden",
            "transform transition-all duration-500",
            animationStage === "hidden" ? "scale-75 opacity-0" : "scale-100 opacity-100"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Header gradient */}
          <div className={cn(
            "h-40 bg-gradient-to-br relative overflow-hidden",
            tierColors[badge.tier]
          )}>
            {/* Animated particles */}
            <div className="absolute inset-0">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-white/40 rounded-full animate-float"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 3}s`,
                    animationDuration: `${3 + Math.random() * 2}s`,
                  }}
                />
              ))}
            </div>

            {/* Tier label */}
            <div className="absolute top-4 left-4 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium">
              {badge.tier} Badge
            </div>
          </div>

          {/* Badge icon - floating above the header */}
          <div
            className={cn(
              "absolute left-1/2 -translate-x-1/2 top-24",
              "transition-all duration-700",
              animationStage === "hidden" ? "scale-0 opacity-0" : "scale-100 opacity-100"
            )}
          >
            <div className={cn(
              "w-32 h-32 rounded-3xl bg-card shadow-2xl flex items-center justify-center",
              `shadow-lg ${tierGlow[badge.tier]}`,
              "animate-bounce"
            )}>
              <img
                src={badge.iconUrl}
                alt={badge.name}
                className="w-20 h-20"
              />
            </div>
          </div>

          {/* Content */}
          <div className="px-6 pt-20 pb-6 text-center">
            {/* Badge name */}
            <div
              className={cn(
                "transition-all duration-500 delay-200",
                animationStage === "details" || animationStage === "actions"
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4"
              )}
            >
              <p className="text-muted-foreground text-sm mb-1">You earned</p>
              <h2 className="font-display text-2xl font-bold mb-2">{badge.name}</h2>
              <p className="text-muted-foreground">{badge.description}</p>
            </div>

            {/* Points earned */}
            <div
              className={cn(
                "mt-6 py-4 border-y border-border transition-all duration-500 delay-300",
                animationStage === "details" || animationStage === "actions"
                  ? "opacity-100"
                  : "opacity-0"
              )}
            >
              <div className="flex items-center justify-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                <span className="text-2xl font-bold">+{badge.points}</span>
                <span className="text-muted-foreground">points</span>
              </div>
            </div>

            {/* Actions */}
            <div
              className={cn(
                "mt-6 flex gap-3 transition-all duration-500 delay-400",
                animationStage === "actions" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}
            >
              <Button variant="outline" className="flex-1" onClick={onClose}>
                Continue
              </Button>
              <Button className="flex-1">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
```

**Usage:**
```tsx
const [earnedBadge, setEarnedBadge] = useState<Badge | null>(null);

// When badge is earned (e.g., from API response)
useEffect(() => {
  if (response.newBadge) {
    setEarnedBadge(response.newBadge);
  }
}, [response]);

return (
  <>
    {/* Page content */}
    <BadgeCelebration
      badge={earnedBadge}
      isOpen={!!earnedBadge}
      onClose={() => setEarnedBadge(null)}
    />
  </>
);
```

---

### 3.4 Domain-Themed Data Visualizations

**File: `src/components/charts/DomainDonutChart.tsx`** (NEW)

```tsx
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
}: DomainDonutChartProps) {
  const [animationProgress, setAnimationProgress] = useState(animated ? 0 : 1);
  const svgRef = useRef<SVGSVGElement>(null);

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    if (!animated) return;

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
        <span className="text-3xl font-display font-bold">{total}</span>
        <span className="text-sm text-muted-foreground">Total</span>
      </div>
    </div>
  );
}
```

**File: `src/components/charts/DomainBarChart.tsx`** (NEW)

```tsx
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
}: DomainBarChartProps) {
  const [animationProgress, setAnimationProgress] = useState(animated ? 0 : 1);
  const containerRef = useRef<HTMLDivElement>(null);

  const maxValue = Math.max(...data.map((d) => d.value));

  useEffect(() => {
    if (!animated) return;

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

  return (
    <div ref={containerRef} className={cn("space-y-4", className)}>
      {data.map((item, index) => {
        const percentage = (item.value / maxValue) * 100 * animationProgress;

        return (
          <div
            key={item.domain}
            className="space-y-2"
            style={{
              animationDelay: `${index * 100}ms`,
            }}
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

            <div className="h-3 bg-muted rounded-full overflow-hidden">
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
    </div>
  );
}
```

---

## Implementation Priority

### Phase 1 (Week 1) - Quick Wins
1. ✅ Enhanced noise overlays in `globals.css`
2. ✅ ScrollReveal component
3. ✅ Confetti hook and component
4. ✅ Domain skeleton loaders

### Phase 2 (Week 2) - Core Interactions
1. Hero section asymmetry redesign
2. Micro-interaction CSS classes
3. MagneticButton component
4. 3D Strength Card flip

### Phase 3 (Week 3) - Polish
1. Dashboard layout with featured card
2. Page transitions with logo
3. Badge celebration modal
4. Domain-themed charts

### Phase 4 (Week 4) - Optional Enhancements
1. Cursor trail (landing page only)
2. Additional animations for gamification
3. Performance optimization pass

---

## Performance Considerations

1. **Lazy load effects**: Import Confetti and CursorTrail dynamically
2. **Reduce motion**: Respect `prefers-reduced-motion` media query
3. **Canvas cleanup**: Always cleanup animation frames and observers
4. **Intersection Observer**: Use for scroll animations instead of scroll listeners

```tsx
// Example: Respect reduced motion
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (prefersReducedMotion) {
  // Skip animations, show content immediately
  setAnimationProgress(1);
}
```

---

## Testing Checklist

- [ ] All animations work in light and dark mode
- [ ] Mobile touch interactions feel responsive
- [ ] No layout shift during animations
- [ ] Keyboard navigation still works with magnetic buttons
- [ ] Screen readers announce badge celebrations properly
- [ ] Performance is acceptable on mid-range devices

