"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { ThemeBadge } from "@/components/strengths/ThemeBadge";
import {
  Sparkles,
  RefreshCw,
  Award,
  ArrowRight,
  Loader2,
  MessageSquare,
  Copy,
  Check,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { DomainSlug } from "@/constants/strengths-data";

interface RecognitionSuggestion {
  memberId: string;
  memberName: string;
  recognitionReason: string;
  suggestedTheme: string;
  shoutoutStarter: string;
  context: string;
  memberStrengths?: { name: string; domain: string }[];
  recentActivities?: string[];
}

interface RecognitionPromptsState {
  loading: boolean;
  error: string | null;
  suggestions: RecognitionSuggestion[];
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function SuggestionCard({
  suggestion,
  onUseStarter,
}: {
  suggestion: RecognitionSuggestion;
  onUseStarter: (starter: string, memberId: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyStarter = () => {
    navigator.clipboard.writeText(suggestion.shoutoutStarter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 rounded-xl border bg-gradient-to-br from-background to-muted/20 hover:shadow-md transition-all">
      <div className="flex items-start gap-3">
        <Avatar className="h-12 w-12">
          <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
            {getInitials(suggestion.memberName)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <Link
            href={`/team/${suggestion.memberId}`}
            className="font-semibold hover:text-primary transition-colors"
          >
            {suggestion.memberName}
          </Link>

          {/* Strengths badges */}
          {suggestion.memberStrengths && suggestion.memberStrengths.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {suggestion.memberStrengths.slice(0, 3).map((s) => (
                <ThemeBadge
                  key={s.name}
                  themeName={s.name}
                  domainSlug={s.domain as DomainSlug}
                  size="sm"
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recognition reason */}
      <div className="mt-3 p-3 rounded-lg bg-domain-strategic-light/30 dark:bg-domain-strategic/20 border border-domain-strategic/10 dark:border-domain-strategic/40">
        <p className="text-sm text-foreground/80 dark:text-foreground/90">
          <span className="font-medium text-foreground">Why recognize:</span>{" "}
          {suggestion.recognitionReason}
        </p>
      </div>

      {/* Context (recent activities) */}
      {suggestion.context && (
        <p className="text-xs text-muted-foreground mt-2 flex items-start gap-1">
          <MessageSquare className="h-3 w-3 mt-0.5 flex-shrink-0 text-domain-influencing" />
          {suggestion.context}
        </p>
      )}

      {/* Shoutout starter */}
      <div className="mt-3 p-3 rounded-lg bg-muted/50 dark:bg-muted/30 border border-dashed border-muted-foreground/20">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground">Ready-to-use shoutout:</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyStarter}
            className="h-6 px-2 text-xs"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 mr-1 text-domain-strategic" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </>
            )}
          </Button>
        </div>
        <p className="text-sm italic">&quot;{suggestion.shoutoutStarter}&quot;</p>
      </div>

      {/* Action button */}
      <div className="mt-3 flex gap-2">
        <Button
          variant="influencing"
          size="sm"
          className="flex-1"
          onClick={() => onUseStarter(suggestion.shoutoutStarter, suggestion.memberId)}
          asChild
        >
          <Link
            href={`/shoutouts/create?to=${suggestion.memberId}&message=${encodeURIComponent(suggestion.shoutoutStarter)}&theme=${encodeURIComponent(suggestion.suggestedTheme)}`}
          >
            <Award className="h-4 w-4 mr-2" />
            Send Shoutout
          </Link>
        </Button>
      </div>
    </div>
  );
}

export function RecognitionPrompt() {
  const [state, setState] = useState<RecognitionPromptsState>({
    loading: false,
    error: null,
    suggestions: [],
  });
  const [hasFetched, setHasFetched] = useState(false);

  const fetchSuggestions = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch("/api/ai/recognition-prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 3 }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to get suggestions");
      }

      setState({
        loading: false,
        error: null,
        suggestions: data.data.suggestions || [],
      });
      setHasFetched(true);
    } catch (error) {
      setState({
        loading: false,
        error: error instanceof Error ? error.message : "Failed to load suggestions",
        suggestions: [],
      });
    }
  }, []);

  // Auto-fetch on first load
  useEffect(() => {
    if (!hasFetched) {
      fetchSuggestions();
    }
  }, [hasFetched, fetchSuggestions]);

  const handleUseStarter = (starter: string, memberId: string) => {
    // This could track that the user clicked to recognize
    console.log(`Using starter for ${memberId}: ${starter}`);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-domain-influencing" />
              Who to Recognize
            </CardTitle>
            <CardDescription>
              Team members who deserve a shoutout based on recent activity
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchSuggestions}
            disabled={state.loading}
          >
            <RefreshCw
              className={cn("h-4 w-4", state.loading && "animate-spin")}
            />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {state.loading && !hasFetched && (
          <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Finding people to recognize...</span>
          </div>
        )}

        {state.error && (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-center">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
            <p className="text-sm text-destructive mb-3">{state.error}</p>
            <Button variant="outline" size="sm" onClick={fetchSuggestions}>
              Try Again
            </Button>
          </div>
        )}

        {!state.loading && !state.error && state.suggestions.length === 0 && (
          <div className="text-center py-8">
            <Award className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <h4 className="font-medium">No Suggestions Right Now</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Check back after your team has been active!
            </p>
          </div>
        )}

        {state.suggestions.length > 0 && (
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
            {state.suggestions
              .filter((suggestion, index, self) =>
                self.findIndex((s) => s.memberId === suggestion.memberId) === index
              )
              .map((suggestion) => (
                <SuggestionCard
                  key={suggestion.memberId}
                  suggestion={suggestion}
                  onUseStarter={handleUseStarter}
                />
              ))}

            <div className="text-center pt-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/shoutouts/create">
                  Give a different shoutout
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        )}

        {state.loading && hasFetched && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
