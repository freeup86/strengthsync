"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ThemeBadge } from "@/components/strengths/ThemeBadge";
import { DomainIcon } from "@/components/strengths/DomainIcon";
import {
  Users,
  Search,
  Trophy,
  MessageSquare,
  ArrowRight,
  Zap,
  Heart,
  Lightbulb,
  Megaphone,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

const FEATURED_THEMES = [
  { name: "Strategic", domain: "strategic" as const },
  { name: "Achiever", domain: "executing" as const },
  { name: "Communication", domain: "influencing" as const },
  { name: "Empathy", domain: "relationship" as const },
  { name: "Learner", domain: "strategic" as const },
  { name: "Activator", domain: "influencing" as const },
  { name: "Developer", domain: "relationship" as const },
  { name: "Responsibility", domain: "executing" as const },
];

const FEATURES = [
  {
    icon: Users,
    title: "Team Insights",
    description:
      "Visualize your team's collective strengths with domain balance charts and gap analysis.",
    color: "text-domain-relationship",
    bgColor: "bg-domain-relationship-light",
  },
  {
    icon: Search,
    title: "Skills Directory",
    description:
      "Find the right team member for any task by searching strengths, skills, and expertise.",
    color: "text-domain-strategic",
    bgColor: "bg-domain-strategic-light",
  },
  {
    icon: MessageSquare,
    title: "Shoutouts",
    description:
      "Recognize teammates when they demonstrate their strengths with themed peer recognition.",
    color: "text-domain-influencing",
    bgColor: "bg-domain-influencing-light",
  },
  {
    icon: Trophy,
    title: "Gamification",
    description:
      "Earn badges, climb leaderboards, and join team challenges to boost engagement.",
    color: "text-domain-executing",
    bgColor: "bg-domain-executing-light",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 z-sticky glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="hover:opacity-90 transition-opacity">
              <Logo size="default" showText />
            </Link>
            <div className="flex items-center gap-3">
              <Button variant="ghost" asChild>
                <Link href="/auth/login">Sign in</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/register">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 min-h-[90vh] flex items-center">
        {/* Floating orbs background - repositioned */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="floating-orb w-[600px] h-[600px] -top-48 -left-48 bg-domain-executing" style={{ animationDelay: "0s" }} />
          <div className="floating-orb w-[400px] h-[400px] top-1/3 right-1/4 bg-domain-influencing" style={{ animationDelay: "2s" }} />
          <div className="floating-orb w-[300px] h-[300px] bottom-1/4 left-1/3 bg-domain-relationship" style={{ animationDelay: "4s" }} />
          <div className="floating-orb w-[500px] h-[500px] -bottom-48 right-0 bg-domain-strategic" style={{ animationDelay: "1s" }} />
        </div>

        {/* Decorative geometric shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-24 right-1/4 w-32 h-32 border-2 border-domain-strategic/20 rounded-3xl rotate-12" />
          <div className="absolute bottom-32 left-1/6 w-24 h-24 border-2 border-domain-influencing/20 rounded-full" />
          <div className="absolute top-1/2 left-12 w-16 h-16 border-2 border-domain-relationship/20 rounded-2xl -rotate-12" />
          <div className="absolute bottom-1/4 right-12 w-20 h-20 border-2 border-domain-executing/20 rounded-full" />
        </div>

        <div className="relative max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left side - Text content (7 columns) */}
            <div className="lg:col-span-7 text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/80 backdrop-blur-sm border border-border/50 mb-8 animate-fade-in">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-domain-strategic opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-domain-strategic" />
                </span>
                <span className="text-sm font-medium">Powered by CliftonStrengths</span>
              </div>

              {/* Headline */}
              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 animate-fade-in-up">
                Discover Your Team&apos;s{" "}
                <span className="text-gradient">Unique Superpowers</span>
              </h1>

              {/* Subheadline */}
              <p className="text-xl text-muted-foreground max-w-2xl lg:max-w-xl mb-8 animate-fade-in-up stagger-2">
                Connect, collaborate, and grow together through CliftonStrengths insights,
                peer recognition, and playful team engagement.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4 animate-fade-in-up stagger-3">
                <Button size="xl" asChild>
                  <Link href="/auth/register">
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="xl" variant="outline" asChild>
                  <Link href="#features">See How It Works</Link>
                </Button>
              </div>
            </div>

            {/* Right side - Overlapping cards (5 columns) */}
            <div className="lg:col-span-5 relative h-[400px] lg:h-[500px] hidden lg:block">
              {/* Floating ThemeBadges around the cards */}
              <div className="absolute -top-4 left-8 z-30 animate-float" style={{ animationDelay: "0s" }}>
                <ThemeBadge themeName="Achiever" domainSlug="executing" size="lg" />
              </div>
              <div className="absolute top-1/4 -left-4 z-30 animate-float" style={{ animationDelay: "0.5s" }}>
                <ThemeBadge themeName="Empathy" domainSlug="relationship" size="default" />
              </div>
              <div className="absolute bottom-1/4 -right-2 z-30 animate-float" style={{ animationDelay: "1s" }}>
                <ThemeBadge themeName="Learner" domainSlug="strategic" size="lg" />
              </div>
              <div className="absolute bottom-8 left-4 z-30 animate-float" style={{ animationDelay: "1.5s" }}>
                <ThemeBadge themeName="Activator" domainSlug="influencing" size="default" />
              </div>

              {/* Back card - Strategic (green) */}
              <Card
                variant="strategic"
                className="absolute top-8 left-4 w-[280px] p-6 rotate-[-8deg] animate-fade-in stagger-4 shadow-xl"
              >
                <div className="flex items-center gap-3 mb-4">
                  <DomainIcon domain="strategic" size="xl" />
                  <h3 className="font-display font-semibold text-lg">Strategic</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Absorbing information for better decisions
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <ThemeBadge themeName="Strategic" domainSlug="strategic" size="xs" />
                  <ThemeBadge themeName="Learner" domainSlug="strategic" size="xs" />
                  <ThemeBadge themeName="Futuristic" domainSlug="strategic" size="xs" />
                </div>
              </Card>

              {/* Middle card - Influencing (orange) */}
              <Card
                variant="influencing"
                className="absolute top-20 left-12 w-[280px] p-6 rotate-[4deg] animate-fade-in stagger-5 shadow-xl z-10"
              >
                <div className="flex items-center gap-3 mb-4">
                  <DomainIcon domain="influencing" size="xl" />
                  <h3 className="font-display font-semibold text-lg">Influencing</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Taking charge and speaking up for the team
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <ThemeBadge themeName="Communication" domainSlug="influencing" size="xs" />
                  <ThemeBadge themeName="Activator" domainSlug="influencing" size="xs" />
                  <ThemeBadge themeName="Woo" domainSlug="influencing" size="xs" />
                </div>
              </Card>

              {/* Front card - Executing (purple) */}
              <Card
                variant="executing"
                className="absolute top-32 left-20 w-[280px] p-6 rotate-[-2deg] animate-fade-in stagger-6 shadow-2xl z-20"
              >
                <div className="flex items-center gap-3 mb-4">
                  <DomainIcon domain="executing" size="xl" />
                  <h3 className="font-display font-semibold text-lg">Executing</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Making things happen through tireless effort
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <ThemeBadge themeName="Achiever" domainSlug="executing" size="xs" />
                  <ThemeBadge themeName="Focus" domainSlug="executing" size="xs" />
                  <ThemeBadge themeName="Discipline" domainSlug="executing" size="xs" />
                </div>
              </Card>
            </div>
          </div>

          {/* Mobile floating theme badges - shown only on smaller screens */}
          <div className="mt-12 flex flex-wrap justify-center gap-2 animate-fade-in-up stagger-4 lg:hidden">
            {FEATURED_THEMES.slice(0, 4).map((theme, i) => (
              <ThemeBadge
                key={theme.name}
                themeName={theme.name}
                domainSlug={theme.domain}
                size="lg"
                className="animate-float"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Domain Overview */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
              Four Domains of Strength
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              CliftonStrengths organizes 34 themes into four domains that represent
              how people make things happen, influence others, build relationships, and think strategically.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                domain: "executing" as const,
                name: "Executing",
                description: "Making things happen through tireless effort",
                icon: Zap,
                themes: ["Achiever", "Arranger", "Discipline", "Focus"],
              },
              {
                domain: "influencing" as const,
                name: "Influencing",
                description: "Taking charge and speaking up for the team",
                icon: Megaphone,
                themes: ["Activator", "Command", "Communication", "Woo"],
              },
              {
                domain: "relationship" as const,
                name: "Relationship",
                description: "Building bonds that make teams stronger",
                icon: Heart,
                themes: ["Developer", "Empathy", "Harmony", "Relator"],
              },
              {
                domain: "strategic" as const,
                name: "Strategic",
                description: "Absorbing information for better decisions",
                icon: Lightbulb,
                themes: ["Analytical", "Futuristic", "Learner", "Strategic"],
              },
            ].map((d) => (
              <Card key={d.domain} variant={d.domain} className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <DomainIcon domain={d.domain} size="xl" />
                  <h3 className="font-display font-semibold text-lg">{d.name}</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">{d.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {d.themes.map((theme) => (
                    <ThemeBadge
                      key={theme}
                      themeName={theme}
                      domainSlug={d.domain}
                      size="xs"
                    />
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
              Everything Your Team Needs
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From insights to recognition, StrengthSync brings your team together
              through shared understanding of individual talents.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {FEATURES.map((feature, i) => (
              <Card key={feature.title} interactive className="p-8 group">
                <div
                  className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl ${feature.bgColor} mb-6 transition-transform group-hover:scale-110`}
                >
                  <feature.icon className={`h-7 w-7 ${feature.color}`} />
                </div>
                <h3 className="font-display text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="relative overflow-hidden p-12 text-center mesh-gradient">
            <div className="relative">
              <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
                Ready to Unlock Your Team&apos;s Potential?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Join teams who are discovering how unique strengths create extraordinary results.
              </p>
              <Button size="xl" asChild>
                <Link href="/auth/register">
                  Get Started
                  <ChevronRight className="ml-1 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-border/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Logo size="sm" showText />
            <p className="text-sm text-muted-foreground">
              CliftonStrengths is a trademark of Gallup, Inc.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
