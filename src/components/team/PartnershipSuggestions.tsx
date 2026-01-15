"use client";

import { useState, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/Tooltip";
import { Handshake, ArrowRight, Users, ChevronDown, ChevronUp, Loader2, Brain, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

interface Partnership {
  member1: { id: string; name: string; topTheme: string };
  member2: { id: string; name: string; topTheme: string };
  reason: string;
  complementaryStrength: string;
  score: number;
}

interface PartnershipSuggestionsProps {
  partnerships: Partnership[];
  totalPossiblePairings: number;
  showAll?: boolean;
}

interface AIReasoningState {
  loading: boolean;
  error: string | null;
  reasoning: string | null;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getScoreColor(score: number): string {
  if (score >= 60) return "text-domain-strategic";
  if (score >= 40) return "text-domain-influencing";
  return "text-domain-relationship";
}

function getScoreLabel(score: number): string {
  if (score >= 60) return "Excellent match";
  if (score >= 40) return "Strong match";
  return "Good match";
}

// Partnership card with expandable AI reasoning
function PartnershipCard({ partnership }: { partnership: Partnership }) {
  const [expanded, setExpanded] = useState(false);
  const [aiReasoning, setAiReasoning] = useState<AIReasoningState>({
    loading: false,
    error: null,
    reasoning: null,
  });

  const fetchAIReasoning = useCallback(async () => {
    if (aiReasoning.reasoning || aiReasoning.loading) return;

    setAiReasoning((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch("/api/ai/partnership-reasoning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          member1Id: partnership.member1.id,
          member2Id: partnership.member2.id,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to generate reasoning");
      }

      setAiReasoning({
        loading: false,
        error: null,
        reasoning: data.data.reasoning,
      });
    } catch (error) {
      setAiReasoning({
        loading: false,
        error: error instanceof Error ? error.message : "Failed to load AI reasoning",
        reasoning: null,
      });
    }
  }, [partnership.member1.id, partnership.member2.id, aiReasoning.reasoning, aiReasoning.loading]);

  const handleToggle = () => {
    if (!expanded && !aiReasoning.reasoning && !aiReasoning.loading) {
      fetchAIReasoning();
    }
    setExpanded(!expanded);
  };

  return (
    <div
      className={cn(
        "p-4 rounded-xl border bg-gradient-to-r from-background to-muted/30",
        "hover:shadow-md transition-all duration-200"
      )}
    >
      <div className="flex items-center gap-4">
        {/* Member 1 */}
        <Link
          href={`/team/${partnership.member1.id}`}
          className="flex-1 flex items-center gap-3 group"
        >
          <Avatar>
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getInitials(partnership.member1.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-medium truncate group-hover:text-primary transition-colors">
              {partnership.member1.name}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {partnership.member1.topTheme}
            </p>
          </div>
        </Link>

        {/* Compatibility score */}
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full cursor-help",
                "bg-muted/50 border-2",
                partnership.score >= 60 ? "border-domain-strategic" :
                partnership.score >= 40 ? "border-domain-influencing" : "border-domain-relationship"
              )}>
                <span className={cn("text-sm font-bold", getScoreColor(partnership.score))}>
                  {partnership.score}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <p className="font-medium">Compatibility Score</p>
              <p className="text-xs text-muted-foreground mt-1">
                Based on complementary strengths, domain balance, and theme synergies. Higher scores indicate stronger natural collaboration potential.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Member 2 */}
        <Link
          href={`/team/${partnership.member2.id}`}
          className="flex-1 flex items-center gap-3 justify-end group"
        >
          <div className="min-w-0 text-right">
            <p className="font-medium truncate group-hover:text-primary transition-colors">
              {partnership.member2.name}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {partnership.member2.topTheme}
            </p>
          </div>
          <Avatar>
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getInitials(partnership.member2.name)}
            </AvatarFallback>
          </Avatar>
        </Link>
      </div>

      {/* Reason and AI button */}
      <div className="mt-3 pt-3 border-t border-dashed">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground flex-1">{partnership.reason}</p>
          <div className="flex items-center gap-2 ml-2">
            <span
              className={cn(
                "text-xs font-medium px-2 py-0.5 rounded-full",
                {
                  "bg-domain-strategic-light text-domain-strategic": partnership.score >= 60,
                  "bg-domain-influencing-light text-domain-influencing":
                    partnership.score >= 40 && partnership.score < 60,
                  "bg-domain-relationship-light text-domain-relationship":
                    partnership.score < 40,
                }
              )}
            >
              {getScoreLabel(partnership.score)}
            </span>
          </div>
        </div>

        {/* AI Reasoning toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggle}
          className="mt-2 text-xs text-muted-foreground hover:text-foreground gap-1"
        >
          <Brain className="h-3 w-3" />
          {expanded ? "Hide" : "Why this pairing?"}
          {aiReasoning.loading ? (
            <Loader2 className="h-3 w-3 animate-spin ml-1" />
          ) : expanded ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </Button>

        {/* Expanded AI reasoning */}
        {expanded && (
          <div className="mt-3 p-3 rounded-lg bg-muted/50 border border-dashed">
            {aiReasoning.loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing partnership dynamics...
              </div>
            )}
            {aiReasoning.error && (
              <div className="text-sm text-destructive">
                {aiReasoning.error}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setAiReasoning({ loading: false, error: null, reasoning: null });
                    fetchAIReasoning();
                  }}
                  className="ml-2 text-xs"
                >
                  Retry
                </Button>
              </div>
            )}
            {aiReasoning.reasoning && (
              <div className="space-y-2">
                <div className="flex items-center gap-1 text-xs font-medium text-domain-strategic">
                  <Lightbulb className="h-3 w-3" />
                  AI Partnership Analysis
                </div>
                <div className="text-sm text-muted-foreground prose prose-sm dark:prose-invert prose-headings:text-foreground prose-headings:font-semibold prose-headings:mt-4 prose-headings:mb-2 prose-p:my-2 prose-strong:text-foreground max-w-none">
                  <ReactMarkdown>{aiReasoning.reasoning}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function PartnershipSuggestions({
  partnerships,
  totalPossiblePairings,
  showAll = false,
}: PartnershipSuggestionsProps) {
  const displayPartnerships = showAll ? partnerships : partnerships.slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Handshake className="h-5 w-5 text-domain-relationship" />
          Partnership Suggestions
        </CardTitle>
        <CardDescription>
          Team members with complementary strengths that could work well together
        </CardDescription>
      </CardHeader>
      <CardContent>
        {partnerships.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <h4 className="font-medium">No Partnerships Yet</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Add more team members with their strengths to see partnership suggestions.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayPartnerships.map((partnership) => (
              <PartnershipCard
                key={`${partnership.member1.id}-${partnership.member2.id}`}
                partnership={partnership}
              />
            ))}

            {/* Show more button */}
            {!showAll && partnerships.length > 5 && (
              <div className="text-center pt-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/team/partnerships">
                    View all {partnerships.length} partnerships
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Stats footer */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t text-xs text-muted-foreground">
          <span>{partnerships.length} partnerships identified</span>
          <span>{totalPossiblePairings} possible pairings</span>
        </div>
      </CardContent>
    </Card>
  );
}
