"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Handshake, ArrowRight, Sparkles, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

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
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h4 className="font-medium">No Partnerships Yet</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Add more team members with their strengths to see partnership suggestions.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayPartnerships.map((partnership, index) => (
              <div
                key={`${partnership.member1.id}-${partnership.member2.id}`}
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
                    <Avatar className="ring-2 ring-offset-2 ring-domain-executing/20">
                      <AvatarFallback className="bg-domain-executing-light text-domain-executing">
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

                  {/* Connection indicator */}
                  <div className="flex flex-col items-center">
                    <Sparkles className="h-4 w-4 text-domain-influencing" />
                    <div className="h-px w-8 bg-gradient-to-r from-domain-executing via-domain-influencing to-domain-relationship my-1" />
                    <span className={cn("text-xs font-medium", getScoreColor(partnership.score))}>
                      {partnership.score}
                    </span>
                  </div>

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
                    <Avatar className="ring-2 ring-offset-2 ring-domain-strategic/20">
                      <AvatarFallback className="bg-domain-strategic-light text-domain-strategic">
                        {getInitials(partnership.member2.name)}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                </div>

                {/* Reason */}
                <div className="mt-3 pt-3 border-t border-dashed">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{partnership.reason}</p>
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
              </div>
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
