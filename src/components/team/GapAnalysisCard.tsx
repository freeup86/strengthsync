"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { ThemeBadge } from "@/components/strengths/ThemeBadge";
import { DomainIcon } from "@/components/strengths/DomainIcon";
import { AlertTriangle, Lightbulb, TrendingDown, Users } from "lucide-react";
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

interface GapAnalysisCardProps {
  data: GapAnalysisData;
  totalMembers: number;
}

export function GapAnalysisCard({ data, totalMembers }: GapAnalysisCardProps) {
  const hasGaps =
    data.missingThemes.length > 0 ||
    data.underrepresentedThemes.length > 0 ||
    data.underrepresentedDomains.length > 0;

  return (
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
                    <DomainIcon domain={d.domain} size="sm" withBackground />
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

        {/* No gaps state */}
        {!hasGaps && (
          <div className="text-center py-6">
            <div className="h-16 w-16 rounded-full bg-domain-strategic-light flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-domain-strategic" />
            </div>
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
  );
}
