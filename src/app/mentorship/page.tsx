"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { DomainIcon } from "@/components/strengths/DomainIcon";
import { ThemeBadge } from "@/components/strengths/ThemeBadge";
import {
  Handshake,
  Users,
  RefreshCw,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  UserPlus,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DomainSlug } from "@/constants/strengths-data";

interface MentorSuggestion {
  id: string;
  name: string;
  avatarUrl: string | null;
  jobTitle: string | null;
  score: number;
  reasons: string[];
  complementaryStrengths: string[];
  topStrengths: { name: string; domain: string }[];
}

interface Mentorship {
  id: string;
  status: string;
  focusAreas: string[];
  notes: string | null;
  startedAt: string;
  endedAt: string | null;
  mentor: {
    id: string;
    name: string;
    avatarUrl: string | null;
    jobTitle: string | null;
    topStrengths: { name: string; domain: string }[];
  };
  mentee: {
    id: string;
    name: string;
    avatarUrl: string | null;
    jobTitle: string | null;
    topStrengths: { name: string; domain: string }[];
  };
  isMentor: boolean;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getStatusBadge(status: string) {
  switch (status) {
    case "ACTIVE":
      return (
        <span className="flex items-center gap-1 text-xs font-medium text-domain-strategic bg-domain-strategic-light px-2 py-0.5 rounded-full">
          <CheckCircle2 className="h-3 w-3" />
          Active
        </span>
      );
    case "PENDING":
      return (
        <span className="flex items-center gap-1 text-xs font-medium text-domain-influencing bg-domain-influencing-light px-2 py-0.5 rounded-full">
          <Clock className="h-3 w-3" />
          Pending
        </span>
      );
    default:
      return null;
  }
}

export default function MentorshipPage() {
  const { data: session } = useSession();
  const [suggestions, setSuggestions] = useState<MentorSuggestion[]>([]);
  const [mentorships, setMentorships] = useState<Mentorship[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setLoadingSuggestions(true);

    try {
      const [mentorshipsRes, suggestionsRes] = await Promise.all([
        fetch("/api/mentorship"),
        fetch("/api/mentorship/suggestions"),
      ]);

      if (mentorshipsRes.ok) {
        const result = await mentorshipsRes.json();
        setMentorships(result.data);
      }

      if (suggestionsRes.ok) {
        const result = await suggestionsRes.json();
        setSuggestions(result.data.suggestions || []);
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
      setLoadingSuggestions(false);
    }
  };

  const activeMentorships = mentorships.filter((m) => m.status === "ACTIVE");
  const pendingMentorships = mentorships.filter((m) => m.status === "PENDING");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold flex items-center gap-2">
            <Handshake className="h-8 w-8 text-domain-relationship" />
            Mentorship
          </h1>
          <p className="text-muted-foreground mt-1">
            Connect with team members who have complementary strengths
          </p>
        </div>
        <Button variant="outline" onClick={fetchData}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Active Mentorships */}
      {(activeMentorships.length > 0 || pendingMentorships.length > 0) && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-domain-relationship" />
            Your Mentorships
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            {[...activeMentorships, ...pendingMentorships].map((mentorship) => {
              const otherPerson = mentorship.isMentor
                ? mentorship.mentee
                : mentorship.mentor;
              const role = mentorship.isMentor ? "Mentor to" : "Mentee of";

              return (
                <Card key={mentorship.id} className="overflow-hidden">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-14 w-14 ring-2 ring-offset-2 ring-domain-relationship/20">
                        <AvatarImage src={otherPerson.avatarUrl || undefined} />
                        <AvatarFallback className="bg-domain-relationship-light text-domain-relationship">
                          {getInitials(otherPerson.name || "?")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-muted-foreground">{role}</span>
                          {getStatusBadge(mentorship.status)}
                        </div>
                        <Link
                          href={`/team/${otherPerson.id}`}
                          className="font-semibold hover:text-primary transition-colors"
                        >
                          {otherPerson.name}
                        </Link>
                        {otherPerson.jobTitle && (
                          <p className="text-sm text-muted-foreground">
                            {otherPerson.jobTitle}
                          </p>
                        )}

                        {/* Focus areas */}
                        {mentorship.focusAreas.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {mentorship.focusAreas.map((area) => (
                              <span
                                key={area}
                                className="text-xs bg-muted px-2 py-0.5 rounded-full"
                              >
                                {area}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Top strengths */}
                        <div className="flex gap-1 mt-2">
                          {otherPerson.topStrengths?.slice(0, 3).map((s) => (
                            <DomainIcon
                              key={s.name}
                              domain={s.domain as DomainSlug}
                              size="sm"
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Suggested Mentors */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500" />
          Suggested Mentors
        </h2>
        <p className="text-sm text-muted-foreground">
          Team members with strengths that complement yours
        </p>

        {loadingSuggestions ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="animate-pulse space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-muted" />
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                      </div>
                    </div>
                    <div className="h-10 bg-muted rounded" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : suggestions.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {suggestions.map((suggestion) => (
              <Card
                key={suggestion.id}
                className="overflow-hidden hover:shadow-md transition-all"
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4 mb-4">
                    <Avatar className="h-14 w-14 ring-2 ring-offset-2 ring-primary/10">
                      <AvatarImage src={suggestion.avatarUrl || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(suggestion.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/team/${suggestion.id}`}
                        className="font-semibold hover:text-primary transition-colors"
                      >
                        {suggestion.name}
                      </Link>
                      {suggestion.jobTitle && (
                        <p className="text-sm text-muted-foreground truncate">
                          {suggestion.jobTitle}
                        </p>
                      )}
                      <div className="flex gap-1 mt-1">
                        {suggestion.topStrengths.slice(0, 4).map((s) => (
                          <DomainIcon
                            key={s.name}
                            domain={s.domain as DomainSlug}
                            size="sm"
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Reasons */}
                  {suggestion.reasons.length > 0 && (
                    <div className="space-y-1 mb-4">
                      {suggestion.reasons.slice(0, 2).map((reason, i) => (
                        <p key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                          <Target className="h-3 w-3 mt-0.5 text-domain-strategic flex-shrink-0" />
                          {reason}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Complementary strengths */}
                  {suggestion.complementaryStrengths.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {suggestion.complementaryStrengths.map((strength) => {
                        const strengthData = suggestion.topStrengths.find(
                          (s) => s.name === strength
                        );
                        return (
                          <ThemeBadge
                            key={strength}
                            themeName={strength}
                            domainSlug={(strengthData?.domain || "strategic") as DomainSlug}
                            size="sm"
                          />
                        );
                      })}
                    </div>
                  )}

                  <Button
                    variant="relationship"
                    className="w-full"
                    asChild
                  >
                    <Link href={`/mentorship/request?mentor=${suggestion.id}`}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Request Mentorship
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Handshake className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold">No Suggestions Yet</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Upload your CliftonStrengths to get personalized mentor suggestions
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* How it works */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How Mentorship Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                step: 1,
                title: "Find a Match",
                description:
                  "We suggest mentors based on complementary strengths - they're strong where you want to grow",
                icon: Sparkles,
              },
              {
                step: 2,
                title: "Send a Request",
                description:
                  "Choose focus areas and send a mentorship request to start the conversation",
                icon: UserPlus,
              },
              {
                step: 3,
                title: "Connect & Grow",
                description:
                  "Meet regularly to learn from their expertise and develop new skills",
                icon: Handshake,
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="h-12 w-12 rounded-full bg-domain-relationship-light flex items-center justify-center mx-auto mb-3">
                  <item.icon className="h-6 w-6 text-domain-relationship" />
                </div>
                <div className="h-6 w-6 rounded-full bg-domain-relationship text-white text-sm font-bold flex items-center justify-center mx-auto -mt-9 ml-8 mb-3">
                  {item.step}
                </div>
                <h4 className="font-semibold mb-1">{item.title}</h4>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
