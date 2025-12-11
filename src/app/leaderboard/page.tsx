"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { DomainIcon } from "@/components/strengths/DomainIcon";
import {
  Trophy,
  Medal,
  Crown,
  Flame,
  MessageSquare,
  RefreshCw,
  ArrowUp,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DomainSlug } from "@/constants/strengths-data";

interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  avatarUrl: string | null;
  jobTitle: string | null;
  points: number;
  streak: number;
  shoutoutsGiven: number;
  shoutoutsReceived: number;
  topStrengths: { name: string; domain: string }[];
  badges: { name: string; iconUrl: string; tier: string }[];
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getRankIcon(rank: number) {
  if (rank === 1) return <Crown className="h-6 w-6 text-amber-400" />;
  if (rank === 2) return <Medal className="h-6 w-6 text-slate-400" />;
  if (rank === 3) return <Medal className="h-6 w-6 text-amber-600" />;
  return null;
}

function getRankStyle(rank: number) {
  if (rank === 1) return "bg-gradient-to-r from-amber-100 to-amber-50 border-amber-200";
  if (rank === 2) return "bg-gradient-to-r from-slate-100 to-slate-50 border-slate-200";
  if (rank === 3) return "bg-gradient-to-r from-orange-100 to-orange-50 border-orange-200";
  return "";
}

export default function LeaderboardPage() {
  const { data: session } = useSession();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [totalMembers, setTotalMembers] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/leaderboard");
      if (response.ok) {
        const result = await response.json();
        setLeaderboard(result.data.leaderboard);
        setMyRank(result.data.myRank);
        setTotalMembers(result.data.totalMembers);
      }
    } catch (err) {
      console.error("Failed to fetch leaderboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const memberId = session?.user?.memberId;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold flex items-center gap-2">
            <Trophy className="h-8 w-8 text-amber-500" />
            Leaderboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Top contributors in your organization
          </p>
        </div>
        <Button variant="outline" onClick={fetchLeaderboard}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* My rank card */}
      {myRank && memberId && (
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">#{myRank}</span>
                </div>
                <div>
                  <p className="font-semibold">Your Ranking</p>
                  <p className="text-sm text-muted-foreground">
                    Out of {totalMembers} team members
                  </p>
                </div>
              </div>
              {myRank > 1 && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Keep going!</p>
                  <p className="text-sm flex items-center gap-1 text-primary">
                    <ArrowUp className="h-4 w-4" />
                    {myRank - 1} to go
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="animate-pulse flex items-center gap-4">
                  <div className="h-8 w-8 rounded-full bg-muted" />
                  <div className="h-12 w-12 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/3" />
                    <div className="h-3 bg-muted rounded w-1/4" />
                  </div>
                  <div className="h-8 w-16 bg-muted rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : leaderboard.length > 0 ? (
        <div className="space-y-3">
          {leaderboard.map((entry) => (
            <Link key={entry.id} href={`/team/${entry.id}`}>
              <Card
                className={cn(
                  "transition-all hover:shadow-md",
                  getRankStyle(entry.rank),
                  entry.id === memberId && "ring-2 ring-primary ring-offset-2"
                )}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className="w-10 flex justify-center">
                      {getRankIcon(entry.rank) || (
                        <span className="text-xl font-bold text-muted-foreground">
                          {entry.rank}
                        </span>
                      )}
                    </div>

                    {/* Avatar */}
                    <Avatar className={cn(
                      "h-14 w-14 ring-2 ring-offset-2",
                      entry.rank === 1 ? "ring-amber-400" :
                      entry.rank === 2 ? "ring-slate-400" :
                      entry.rank === 3 ? "ring-orange-400" :
                      "ring-primary/20"
                    )}>
                      <AvatarImage src={entry.avatarUrl || undefined} />
                      <AvatarFallback className={cn(
                        entry.rank === 1 ? "bg-amber-100 text-amber-700" :
                        entry.rank === 2 ? "bg-slate-100 text-slate-700" :
                        entry.rank === 3 ? "bg-orange-100 text-orange-700" :
                        "bg-muted"
                      )}>
                        {getInitials(entry.name)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">{entry.name}</h3>
                        {entry.id === memberId && (
                          <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                            You
                          </span>
                        )}
                      </div>
                      {entry.jobTitle && (
                        <p className="text-sm text-muted-foreground truncate">
                          {entry.jobTitle}
                        </p>
                      )}
                      {/* Top strengths */}
                      {entry.topStrengths.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {entry.topStrengths.map((s) => (
                            <DomainIcon
                              key={s.name}
                              domain={s.domain as DomainSlug}
                              size="sm"
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="hidden sm:flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-domain-influencing">
                          <MessageSquare className="h-4 w-4" />
                          <span className="font-medium">{entry.shoutoutsReceived}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Received</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-orange-500">
                          <Flame className="h-4 w-4" />
                          <span className="font-medium">{entry.streak}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Streak</p>
                      </div>
                    </div>

                    {/* Points */}
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <Sparkles className="h-4 w-4 text-amber-500" />
                        <span className="text-xl font-bold">{entry.points}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">points</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No Rankings Yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Start giving shoutouts to earn points!
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* How to earn points */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            How to Earn Points
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { action: "Give a shoutout", points: "+5", icon: MessageSquare, color: "text-domain-influencing" },
              { action: "Receive a shoutout", points: "+10", icon: Trophy, color: "text-amber-500" },
              { action: "Respond to skill request", points: "+15", icon: ArrowUp, color: "text-domain-strategic" },
              { action: "Complete a challenge", points: "+50", icon: Crown, color: "text-amber-400" },
            ].map((item) => (
              <div
                key={item.action}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
              >
                <div className={cn("h-10 w-10 rounded-full bg-muted flex items-center justify-center", item.color)}>
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{item.points}</p>
                  <p className="text-xs text-muted-foreground">{item.action}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
