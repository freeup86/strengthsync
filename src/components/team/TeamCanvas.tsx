"use client";

import { useState, useRef } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DomainIcon } from "@/components/strengths/DomainIcon";
import { cn } from "@/lib/utils";
import {
  Download,
  Printer,
  AlertTriangle,
  CheckCircle2,
  Users,
  Target,
  Sparkles,
} from "lucide-react";
import type { DomainSlug } from "@/constants/strengths-data";
import { THEMES, DOMAINS } from "@/constants/strengths-data";

interface ThemeCoverage {
  slug: string;
  name: string;
  domain: DomainSlug;
  count: number;
  members: { id: string; name: string; rank: number }[];
}

interface TeamCanvasProps {
  teamName: string;
  totalMembers: number;
  membersWithStrengths: number;
  themeCoverage: ThemeCoverage[];
  domainComposition: {
    domain: DomainSlug;
    domainName: string;
    count: number;
    percentage: number;
  }[];
}

export function TeamCanvas({
  teamName,
  totalMembers,
  membersWithStrengths,
  themeCoverage,
  domainComposition,
}: TeamCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [hoveredTheme, setHoveredTheme] = useState<string | null>(null);

  // Find missing themes (no one has in top 10)
  const missingThemes = THEMES.filter(
    (t) => !themeCoverage.find((tc) => tc.slug === t.slug && tc.count > 0)
  );

  // Find underrepresented themes (only 1 person)
  const rareThemes = themeCoverage.filter((tc) => tc.count === 1);

  // Find well-covered themes (3+ people)
  const strongThemes = themeCoverage.filter((tc) => tc.count >= 3);

  // Get theme coverage data
  const getThemeCoverage = (slug: string): ThemeCoverage | undefined => {
    return themeCoverage.find((tc) => tc.slug === slug);
  };

  // Get coverage level
  const getCoverageLevel = (count: number): "none" | "low" | "medium" | "high" => {
    if (count === 0) return "none";
    if (count === 1) return "low";
    if (count === 2) return "medium";
    return "high";
  };

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Canvas header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Team Strengths Canvas</h2>
          <p className="text-sm text-muted-foreground">
            Visual overview of your team&apos;s collective talent landscape
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      {/* Printable Canvas */}
      <div
        ref={canvasRef}
        className="print:p-8 print:bg-white"
      >
        {/* Team header (for print) */}
        <div className="hidden print:block text-center mb-8">
          <h1 className="text-2xl font-bold">{teamName} Team Strengths Canvas</h1>
          <p className="text-sm text-muted-foreground">
            {membersWithStrengths} of {totalMembers} members with strengths data
          </p>
        </div>

        {/* Domain Balance Wheel */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Domain Balance
            </CardTitle>
            <CardDescription>
              How your team&apos;s strengths distribute across the four domains
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {DOMAINS.map((domain) => {
                const comp = domainComposition.find((d) => d.domain === domain.slug);
                const percentage = comp?.percentage || 0;
                const count = comp?.count || 0;

                return (
                  <div
                    key={domain.slug}
                    className={cn(
                      "p-4 rounded-xl border-2 text-center",
                      `bg-domain-${domain.slug}/10 border-domain-${domain.slug}/30`
                    )}
                  >
                    <DomainIcon domain={domain.slug} size="lg" />
                    <h4 className={`font-semibold mt-2 text-domain-${domain.slug}`}>
                      {domain.name.split(" ")[0]}
                    </h4>
                    <p className="text-2xl font-bold">{percentage}%</p>
                    <p className="text-xs text-muted-foreground">
                      {count} theme{count !== 1 ? "s" : ""} in top 10s
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* 34 Themes Grid */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-domain-influencing" />
              All 34 Themes Coverage
            </CardTitle>
            <CardDescription>
              Hover over each theme to see which team members have it
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Legend */}
            <div className="flex flex-wrap gap-4 mb-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded bg-muted border-2 border-dashed border-muted-foreground/30" />
                <span>No coverage</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700" />
                <span>1 person</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700" />
                <span>2 people</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700" />
                <span>3+ people</span>
              </div>
            </div>

            {/* Grid by domain */}
            <div className="space-y-6">
              {DOMAINS.map((domain) => {
                const domainThemes = THEMES.filter((t) => t.domain === domain.slug);

                return (
                  <div key={domain.slug}>
                    <div className="flex items-center gap-2 mb-2">
                      <DomainIcon domain={domain.slug} size="sm" />
                      <span className={`font-semibold text-sm text-domain-${domain.slug}`}>
                        {domain.name}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                      {domainThemes.map((theme) => {
                        const coverage = getThemeCoverage(theme.slug);
                        const count = coverage?.count || 0;
                        const level = getCoverageLevel(count);
                        const isHovered = hoveredTheme === theme.slug;

                        return (
                          <div
                            key={theme.slug}
                            className="relative"
                            onMouseEnter={() => setHoveredTheme(theme.slug)}
                            onMouseLeave={() => setHoveredTheme(null)}
                          >
                            <div
                              className={cn(
                                "p-2 rounded-lg text-center cursor-default transition-all",
                                level === "none" && "bg-muted border-2 border-dashed border-muted-foreground/30 text-muted-foreground",
                                level === "low" && "bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300",
                                level === "medium" && "bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-300",
                                level === "high" && "bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 text-green-800 dark:text-green-300",
                                isHovered && "ring-2 ring-primary ring-offset-2"
                              )}
                            >
                              <p className="text-xs font-medium truncate">{theme.name}</p>
                              <p className="text-xs opacity-70">{count}</p>
                            </div>

                            {/* Hover tooltip */}
                            {isHovered && coverage && coverage.members.length > 0 && (
                              <div className="absolute z-tooltip bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-popover border rounded-lg shadow-lg min-w-[150px]">
                                <p className="font-semibold text-xs mb-1">{theme.name}</p>
                                <ul className="text-xs space-y-0.5">
                                  {coverage.members.slice(0, 5).map((m) => (
                                    <li key={m.id} className="text-muted-foreground">
                                      {m.name} (#{m.rank})
                                    </li>
                                  ))}
                                  {coverage.members.length > 5 && (
                                    <li className="text-muted-foreground">
                                      +{coverage.members.length - 5} more
                                    </li>
                                  )}
                                </ul>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Insights Grid */}
        <div className="grid md:grid-cols-3 gap-4">
          {/* Missing Themes */}
          <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4" />
                Blind Spots ({missingThemes.length})
              </CardTitle>
              <CardDescription className="text-xs">
                Themes not in anyone&apos;s top 10
              </CardDescription>
            </CardHeader>
            <CardContent>
              {missingThemes.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {missingThemes.slice(0, 8).map((t) => (
                    <span
                      key={t.slug}
                      className="text-xs px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300"
                    >
                      {t.name}
                    </span>
                  ))}
                  {missingThemes.length > 8 && (
                    <span className="text-xs text-muted-foreground">
                      +{missingThemes.length - 8} more
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Great! All themes covered
                </p>
              )}
            </CardContent>
          </Card>

          {/* Rare Themes */}
          <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-blue-700 dark:text-blue-400">
                <Users className="h-4 w-4" />
                Single Coverage ({rareThemes.length})
              </CardTitle>
              <CardDescription className="text-xs">
                Only one person has these
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rareThemes.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {rareThemes.slice(0, 8).map((t) => (
                    <span
                      key={t.slug}
                      className="text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                    >
                      {t.name}
                    </span>
                  ))}
                  {rareThemes.length > 8 && (
                    <span className="text-xs text-muted-foreground">
                      +{rareThemes.length - 8} more
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  All themes have multiple coverage
                </p>
              )}
            </CardContent>
          </Card>

          {/* Strong Themes */}
          <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-green-700 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                Team Strengths ({strongThemes.length})
              </CardTitle>
              <CardDescription className="text-xs">
                3+ people share these themes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {strongThemes.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {strongThemes.slice(0, 8).map((t) => (
                    <span
                      key={t.slug}
                      className="text-xs px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                    >
                      {t.name}
                    </span>
                  ))}
                  {strongThemes.length > 8 && (
                    <span className="text-xs text-muted-foreground">
                      +{strongThemes.length - 8} more
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Build more shared strengths
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Hiring Suggestions */}
        {missingThemes.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Hiring Suggestions</CardTitle>
              <CardDescription>
                Consider these strengths when growing your team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                {DOMAINS.map((domain) => {
                  const domainMissing = missingThemes.filter((t) => t.domain === domain.slug);
                  if (domainMissing.length === 0) return null;

                  return (
                    <div
                      key={domain.slug}
                      className={cn(
                        "p-3 rounded-lg border",
                        `bg-domain-${domain.slug}/5 border-domain-${domain.slug}/20`
                      )}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <DomainIcon domain={domain.slug} size="sm" />
                        <span className="font-medium text-sm">
                          {domain.name.split(" ")[0]}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Look for candidates with:{" "}
                        <span className="text-foreground">
                          {domainMissing.slice(0, 3).map((t) => t.name).join(", ")}
                          {domainMissing.length > 3 && ` +${domainMissing.length - 3} more`}
                        </span>
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
