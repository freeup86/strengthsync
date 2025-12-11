"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import {
  Zap,
  Trophy,
  Users,
  Calendar,
  Clock,
  RefreshCw,
  Plus,
  CheckCircle2,
  Play,
  Grid3X3,
  MessageSquare,
  Handshake,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Challenge {
  id: string;
  name: string;
  description: string;
  challengeType: string;
  status: "UPCOMING" | "ACTIVE" | "COMPLETED";
  startsAt: string;
  endsAt: string;
  participantCount: number;
  topParticipants: {
    id: string;
    name: string;
    avatarUrl: string | null;
    score: number;
  }[];
  isParticipating: boolean;
  myProgress: Record<string, unknown> | null;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getChallengeIcon(type: string) {
  switch (type) {
    case "STRENGTHS_BINGO":
      return Grid3X3;
    case "SHOUTOUT_STREAK":
      return MessageSquare;
    case "MENTORSHIP_MONTH":
      return Handshake;
    default:
      return Zap;
  }
}

function getChallengeColor(type: string) {
  switch (type) {
    case "STRENGTHS_BINGO":
      return "domain-strategic";
    case "SHOUTOUT_STREAK":
      return "domain-influencing";
    case "MENTORSHIP_MONTH":
      return "domain-relationship";
    default:
      return "domain-executing";
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function getStatusBadge(status: string) {
  switch (status) {
    case "ACTIVE":
      return (
        <span className="flex items-center gap-1 text-xs font-medium text-domain-strategic bg-domain-strategic-light px-2 py-0.5 rounded-full">
          <Play className="h-3 w-3" />
          Active
        </span>
      );
    case "UPCOMING":
      return (
        <span className="flex items-center gap-1 text-xs font-medium text-domain-influencing bg-domain-influencing-light px-2 py-0.5 rounded-full">
          <Clock className="h-3 w-3" />
          Upcoming
        </span>
      );
    case "COMPLETED":
      return (
        <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          <CheckCircle2 className="h-3 w-3" />
          Completed
        </span>
      );
    default:
      return null;
  }
}

export default function ChallengesPage() {
  const { data: session } = useSession();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "ACTIVE" | "UPCOMING" | "COMPLETED">("all");

  const isAdmin = session?.user?.role === "OWNER" || session?.user?.role === "ADMIN";

  useEffect(() => {
    fetchChallenges();
  }, [filter]);

  const fetchChallenges = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.set("status", filter);

      const response = await fetch(`/api/challenges?${params.toString()}`);
      if (response.ok) {
        const result = await response.json();
        setChallenges(result.data);
      }
    } catch (err) {
      console.error("Failed to fetch challenges:", err);
    } finally {
      setLoading(false);
    }
  };

  const filters = [
    { id: "all" as const, label: "All" },
    { id: "ACTIVE" as const, label: "Active" },
    { id: "UPCOMING" as const, label: "Upcoming" },
    { id: "COMPLETED" as const, label: "Completed" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold flex items-center gap-2">
            <Zap className="h-8 w-8 text-amber-500" />
            Team Challenges
          </h1>
          <p className="text-muted-foreground mt-1">
            Fun activities to engage with your team&apos;s strengths
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchChallenges}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {isAdmin && (
            <Button variant="executing" asChild>
              <Link href="/challenges/create">
                <Plus className="h-4 w-4 mr-2" />
                Create Challenge
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              filter === f.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Challenges grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-10 w-10 rounded-xl bg-muted" />
                  <div className="h-5 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : challenges.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {challenges.map((challenge) => {
            const Icon = getChallengeIcon(challenge.challengeType);
            const color = getChallengeColor(challenge.challengeType);

            return (
              <Link key={challenge.id} href={`/challenges/${challenge.id}`}>
                <Card
                  interactive
                  className="h-full hover:shadow-md transition-all"
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`h-12 w-12 rounded-xl bg-${color}-light flex items-center justify-center`}>
                        <Icon className={`h-6 w-6 text-${color}`} />
                      </div>
                      {getStatusBadge(challenge.status)}
                    </div>

                    <h3 className="font-semibold text-lg mb-1">{challenge.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {challenge.description}
                    </p>

                    {/* Dates */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(challenge.startsAt)} - {formatDate(challenge.endsAt)}
                      </span>
                    </div>

                    {/* Participants */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          {challenge.topParticipants.slice(0, 3).map((p) => (
                            <Avatar
                              key={p.id}
                              className="h-7 w-7 border-2 border-background"
                            >
                              <AvatarImage src={p.avatarUrl || undefined} />
                              <AvatarFallback className="text-xs bg-muted">
                                {getInitials(p.name || "?")}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {challenge.participantCount} participant{challenge.participantCount !== 1 ? "s" : ""}
                        </span>
                      </div>

                      {challenge.isParticipating && (
                        <span className="text-xs font-medium text-domain-strategic flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Joined
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No Challenges Yet</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                {filter !== "all"
                  ? `No ${filter.toLowerCase()} challenges`
                  : "Be the first to create a team challenge!"}
              </p>
              {isAdmin && (
                <Button variant="executing" asChild>
                  <Link href="/challenges/create">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Challenge
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Challenge types explanation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Challenge Types</CardTitle>
          <CardDescription>Different ways to engage with strengths</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                type: "STRENGTHS_BINGO",
                name: "Strengths Bingo",
                description: "Find team members with specific strengths to fill your board",
                icon: Grid3X3,
                color: "strategic",
              },
              {
                type: "SHOUTOUT_STREAK",
                name: "Shoutout Streak",
                description: "Give shoutouts every day to build a recognition streak",
                icon: MessageSquare,
                color: "influencing",
              },
              {
                type: "MENTORSHIP_MONTH",
                name: "Mentorship Month",
                description: "Connect with mentors who have complementary strengths",
                icon: Handshake,
                color: "relationship",
              },
            ].map((item) => (
              <div
                key={item.type}
                className={`flex items-start gap-3 p-4 rounded-xl bg-domain-${item.color}-light/30 border border-domain-${item.color}/10`}
              >
                <div className={`h-10 w-10 rounded-xl bg-domain-${item.color}-light flex items-center justify-center flex-shrink-0`}>
                  <item.icon className={`h-5 w-5 text-domain-${item.color}`} />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">{item.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
