"use client";

import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  Target,
  Users,
  MessageSquare,
  Trophy,
  ArrowRight,
  ArrowLeft,
  X,
  Lightbulb,
  Heart,
  Zap,
} from "lucide-react";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  content: React.ReactNode;
}

const steps: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Welcome to StrengthSync",
    description: "Discover and leverage your team's unique strengths",
    icon: Sparkles,
    iconColor: "text-domain-influencing",
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          StrengthSync helps your team understand, develop, and apply CliftonStrengths
          to work better together.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "34 Themes", desc: "Unique talent patterns", color: "bg-domain-executing/10 border-domain-executing/20" },
            { label: "4 Domains", desc: "Ways we contribute", color: "bg-domain-influencing/10 border-domain-influencing/20" },
            { label: "Top 5", desc: "Your signature strengths", color: "bg-domain-relationship/10 border-domain-relationship/20" },
            { label: "Team View", desc: "Collective potential", color: "bg-domain-strategic/10 border-domain-strategic/20" },
          ].map((item) => (
            <div key={item.label} className={cn("p-3 rounded-xl border", item.color)}>
              <p className="font-semibold text-sm">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "philosophy",
    title: "The Strengths Philosophy",
    description: "Focus on what you do best",
    icon: Lightbulb,
    iconColor: "text-amber-500",
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Gallup research shows that people who use their strengths every day are
          <span className="font-semibold text-foreground"> 6x more likely</span> to be engaged at work.
        </p>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-xl border">
            <Target className="h-5 w-5 text-domain-executing mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Name It</p>
              <p className="text-xs text-muted-foreground">Identify your top talents through the CliftonStrengths assessment</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-xl border">
            <Heart className="h-5 w-5 text-domain-influencing mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Claim It</p>
              <p className="text-xs text-muted-foreground">Understand and appreciate what makes you unique</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-xl border">
            <Zap className="h-5 w-5 text-domain-strategic mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Aim It</p>
              <p className="text-xs text-muted-foreground">Intentionally apply your strengths to achieve goals</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "domains",
    title: "The Four Domains",
    description: "How we naturally contribute",
    icon: Users,
    iconColor: "text-domain-relationship",
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          The 34 themes are organized into four domains that describe how people contribute:
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl border">
            <Target className="h-5 w-5 text-domain-executing mb-2" />
            <p className="font-semibold text-sm text-domain-executing">Executing</p>
            <p className="text-xs text-muted-foreground">Make things happen</p>
          </div>
          <div className="p-3 rounded-xl border">
            <MessageSquare className="h-5 w-5 text-domain-influencing mb-2" />
            <p className="font-semibold text-sm text-domain-influencing">Influencing</p>
            <p className="text-xs text-muted-foreground">Take charge & speak up</p>
          </div>
          <div className="p-3 rounded-xl border">
            <Heart className="h-5 w-5 text-domain-relationship mb-2" />
            <p className="font-semibold text-sm text-domain-relationship">Relationship</p>
            <p className="text-xs text-muted-foreground">Build strong bonds</p>
          </div>
          <div className="p-3 rounded-xl border">
            <Lightbulb className="h-5 w-5 text-domain-strategic mb-2" />
            <p className="font-semibold text-sm text-domain-strategic">Strategic</p>
            <p className="text-xs text-muted-foreground">Analyze & strategize</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "features",
    title: "What You Can Do",
    description: "Features to help your team thrive",
    icon: Trophy,
    iconColor: "text-amber-500",
    content: (
      <div className="space-y-3">
        {[
          { icon: Users, label: "Team Analytics", desc: "See your team's collective strengths and gaps", color: "text-domain-executing" },
          { icon: MessageSquare, label: "Shoutouts", desc: "Recognize teammates for using their strengths", color: "text-domain-influencing" },
          { icon: Heart, label: "Mentorship", desc: "Find complementary partners for growth", color: "text-domain-relationship" },
          { icon: Trophy, label: "Challenges", desc: "Play Strengths Bingo and earn badges", color: "text-domain-strategic" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl border">
            <item.icon className={cn("h-5 w-5", item.color)} />
            <div>
              <p className="font-semibold text-sm">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "getstarted",
    title: "Ready to Begin?",
    description: "Your strengths journey starts now",
    icon: Sparkles,
    iconColor: "text-primary",
    content: (
      <div className="space-y-4 text-center">
        <Sparkles className="h-12 w-12 text-primary mx-auto" />
        <p className="text-muted-foreground">
          Upload your CliftonStrengths results to unlock personalized insights,
          find ideal partners, and start recognizing your teammates.
        </p>
      </div>
    ),
  },
];

interface OnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

export function OnboardingModal({ open, onOpenChange, onComplete }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
      onOpenChange(false);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
    onOpenChange(false);
  };

  const step = steps[currentStep];
  const Icon = step.icon;
  const isLastStep = currentStep === steps.length - 1;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-overlay bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-modal w-full max-w-lg translate-x-[-50%] translate-y-[-50%] bg-background border rounded-2xl shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          {/* Close button */}
          <button
            onClick={handleSkip}
            className="absolute right-4 top-4 p-1 rounded-lg hover:bg-muted text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Progress indicator */}
          <div className="flex gap-1 px-6 pt-6">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  idx <= currentStep ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Icon className={cn("h-6 w-6", step.iconColor)} />
              <div>
                <Dialog.Title className="text-xl font-bold">{step.title}</Dialog.Title>
                <Dialog.Description className="text-sm text-muted-foreground">
                  {step.description}
                </Dialog.Description>
              </div>
            </div>

            <div className="min-h-[280px]">{step.content}</div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 pt-0">
            <div>
              {currentStep > 0 ? (
                <Button variant="ghost" onClick={handlePrev}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              ) : (
                <Button variant="ghost" onClick={handleSkip}>
                  Skip tour
                </Button>
              )}
            </div>
            <Button onClick={handleNext}>
              {isLastStep ? "Get Started" : "Next"}
              {!isLastStep && <ArrowRight className="h-4 w-4 ml-2" />}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
