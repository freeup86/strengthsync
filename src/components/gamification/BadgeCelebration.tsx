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
  } | null;
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && badge) {
      // Check for reduced motion
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (prefersReducedMotion) {
        setAnimationStage("actions");
        return;
      }

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
  }, [isOpen, badge]);

  if (!mounted || !isOpen || !badge) return null;

  const content = (
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
              `shadow-lg ${tierGlow[badge.tier]}`
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
    </>
  );

  return createPortal(content, document.body);
}
