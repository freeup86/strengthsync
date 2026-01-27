"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ThemeBadge } from "@/components/strengths/ThemeBadge";
import { DomainIcon } from "@/components/strengths/DomainIcon";
import { ErrorBoundary } from "@/components/effects/ErrorBoundary";
import { AlertTriangle, Lightbulb, TrendingDown, Users, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DomainSlug } from "@/constants/strengths-data";

interface GapAnalysisData {
  missingThemes: { slug: string; name: string; domain: DomainSlug }[];
  underrepresentedThemes: {
    slug: string;
    name: string;
    domain: DomainSlug;
    count: number;
    percentage: number;
  }[];
  underrepresentedDomains: { domain: DomainSlug; name: string; percentage: number }[];
  recommendations: string[];
}

interface AIRecommendation {
  priority: number;
  title: string;
  description: string;
  type: "hire" | "develop" | "partner" | "process";
  impact: string;
}

interface AIGapRecommendations {
  summary: string;
  recommendations: AIRecommendation[];
  quickWins: string[];
}

interface GapAnalysisCardProps {
  data: GapAnalysisData;
  totalMembers: number;
}

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  hire: { label: "Hiring", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  develop: { label: "Development", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  partner: { label: "Partnership", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  process: { label: "Process", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
};

export function GapAnalysisCard({ data, totalMembers }: GapAnalysisCardProps) {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiRecommendations, setAiRecommendations] = useState<AIGapRecommendations | null>(null);
  const [showAiPanel, setShowAiPanel] = useState(false);

  const hasGaps =
    data.missingThemes.length > 0 ||
    data.underrepresentedThemes.length > 0 ||
    data.underrepresentedDomains.length > 0;

  const fetchAIRecommendations = async () => {
    setAiLoading(true);
    setAiError(null);

    try {
      const response = await fetch("/api/ai/gap-recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const result = await response.json();

      if (!response.ok) {
        setAiError(result.error?.message || "Failed to get AI recommendations");
        return;
      }

      setAiRecommendations(result.data);
      setShowAiPanel(true);
    } catch (err) {
      console.error("AI recommendations error:", err);
      setAiError("Failed to get recommendations. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <ErrorBoundary>
    <Card variant={hasGaps ? "influencing" : "strategic"}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {hasGaps ? (
            <>
              <AlertTriangle className="h-5 w-5 text-domain-influencing" />
              Gap Analysis
            </>
          ) : (
            <>
              <Users className="h-5 w-5 text-domain-strategic" />
              Team Balance
            </>
          )}
        </CardTitle>
        <CardDescription>
          {hasGaps
            ? "Areas where your team could benefit from additional strengths"
            : "Your team has great coverage across all domains!"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Underrepresented Domains */}
        {data.underrepresentedDomains.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-medium">Underrepresented Domains</h4>
            </div>
            <div className="grid gap-2">
              {data.underrepresentedDomains.map((d) => (
                <div
                  key={d.domain}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border"
                >
                  <div className="flex items-center gap-3">
                    <DomainIcon domain={d.domain} size="sm" />
                    <span className="font-medium">{d.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-domain-influencing">
                      {d.percentage}%
                    </span>
                    <p className="text-xs text-muted-foreground">of top 5 strengths</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Domains should ideally be above 20% for balanced team composition
            </p>
          </div>
        )}

        {/* Missing Themes */}
        {data.missingThemes.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-medium">
                Missing Themes
                <span className="text-muted-foreground font-normal ml-1">
                  ({data.missingThemes.length} themes)
                </span>
              </h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.missingThemes.slice(0, 12).map((theme) => (
                <ThemeBadge
                  key={theme.slug}
                  themeName={theme.name}
                  domainSlug={theme.domain}
                  size="sm"
                  className="opacity-60"
                />
              ))}
              {data.missingThemes.length > 12 && (
                <span className="text-xs text-muted-foreground px-2 py-1">
                  +{data.missingThemes.length - 12} more
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              No team member has these themes in their top 10
            </p>
          </div>
        )}

        {/* Underrepresented Themes */}
        {data.underrepresentedThemes.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-medium">Rare Themes</h4>
            </div>
            <div className="grid gap-2">
              {data.underrepresentedThemes.slice(0, 5).map((theme) => (
                <div
                  key={theme.slug}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
                >
                  <ThemeBadge
                    themeName={theme.name}
                    domainSlug={theme.domain}
                    size="sm"
                  />
                  <span className="text-xs text-muted-foreground">
                    {theme.count} member{theme.count !== 1 ? "s" : ""} ({theme.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {data.recommendations.length > 0 && (
          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="h-4 w-4 text-domain-influencing" />
              <h4 className="text-sm font-medium">Recommendations</h4>
            </div>
            <ul className="space-y-2">
              {data.recommendations.map((rec, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <span className="text-domain-influencing">•</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* AI Recommendations Section */}
        {hasGaps && (
          <div className="pt-4 border-t">
            {!aiRecommendations ? (
              <div className="space-y-3">
                <Button
                  onClick={fetchAIRecommendations}
                  disabled={aiLoading}
                  className="w-full bg-domain-strategic hover:bg-domain-strategic/90"
                >
                  {aiLoading ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Analyzing gaps...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Get AI-Powered Recommendations
                    </>
                  )}
                </Button>
                {aiError && (
                  <p className="text-sm text-destructive text-center">{aiError}</p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <button
                  onClick={() => setShowAiPanel(!showAiPanel)}
                  className="w-full flex items-center justify-between p-3 rounded-lg bg-domain-strategic/10 hover:bg-domain-strategic/15 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-domain-strategic" />
                    <span className="text-sm font-medium text-domain-strategic">
                      AI Recommendations
                    </span>
                  </div>
                  {showAiPanel ? (
                    <ChevronUp className="h-4 w-4 text-domain-strategic" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-domain-strategic" />
                  )}
                </button>

                {showAiPanel && (
                  <div className="space-y-4 animate-in slide-in-from-top-2">
                    {/* Summary */}
                    <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                      {aiRecommendations.summary}
                    </p>

                    {/* Prioritized Recommendations */}
                    <div className="space-y-3">
                      {aiRecommendations.recommendations
                        .sort((a, b) => a.priority - b.priority)
                        .map((rec, i) => (
                          <div
                            key={i}
                            className="p-3 rounded-lg border bg-card"
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2">
                                <span className="flex items-center justify-center h-5 w-5 rounded-full bg-domain-strategic text-white text-xs font-bold">
                                  {rec.priority}
                                </span>
                                <h5 className="text-sm font-medium">{rec.title}</h5>
                              </div>
                              <span
                                className={cn(
                                  "px-2 py-0.5 rounded text-xs font-medium",
                                  TYPE_LABELS[rec.type]?.color || "bg-muted text-muted-foreground"
                                )}
                              >
                                {TYPE_LABELS[rec.type]?.label || rec.type}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {rec.description}
                            </p>
                            <p className="text-xs text-domain-strategic">
                              <strong>Impact:</strong> {rec.impact}
                            </p>
                          </div>
                        ))}
                    </div>

                    {/* Quick Wins */}
                    {aiRecommendations.quickWins.length > 0 && (
                      <div className="p-3 rounded-lg bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800">
                        <h5 className="text-sm font-medium text-green-800 dark:text-green-400 mb-2 flex items-center gap-1">
                          <Lightbulb className="h-4 w-4" />
                          Quick Wins
                        </h5>
                        <ul className="space-y-1">
                          {aiRecommendations.quickWins.map((win, i) => (
                            <li key={i} className="text-sm text-green-700 dark:text-green-300 flex items-start gap-2">
                              <span>•</span>
                              {win}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Regenerate button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={fetchAIRecommendations}
                      disabled={aiLoading}
                      className="w-full text-xs"
                    >
                      {aiLoading ? "Regenerating..." : "Regenerate Recommendations"}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* No gaps state */}
        {!hasGaps && (
          <div className="text-center py-6">
            <Users className="h-10 w-10 text-domain-strategic mx-auto mb-4" />
            <h4 className="font-medium">Well-Balanced Team!</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Your team has good coverage across all four domains and themes.
            </p>
          </div>
        )}

        {/* Stats footer */}
        <div className="flex items-center justify-between pt-4 border-t text-xs text-muted-foreground">
          <span>Based on {totalMembers} team members</span>
          <span>Analysis includes top 10 strengths</span>
        </div>
      </CardContent>
    </Card>
    </ErrorBoundary>
  );
}
