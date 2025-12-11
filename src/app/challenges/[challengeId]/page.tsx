"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { Input } from "@/components/ui/Input";
import { DomainIcon } from "@/components/strengths/DomainIcon";
import {
  ArrowLeft,
  Trophy,
  Users,
  Calendar,
  Clock,
  RefreshCw,
  Grid3X3,
  CheckCircle2,
  Search,
  Sparkles,
  Crown,
  PartyPopper,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { DomainSlug } from "@/constants/strengths-data";

interface BingoSquare {
  theme: string;
  domain: string;
  marked: boolean;
  markedBy?: string;
  markedByName?: string;
}

interface Participant {
  id: string;
  name: string;
  avatarUrl: string | null;
  score: number;
  progress: Record<string, unknown> | null;
  completedAt: string | null;
  topStrengths: { name: string; domain: string }[];
}

interface Challenge {
  id: string;
  name: string;
  description: string;
  challengeType: string;
  status: string;
  startsAt: string;
  endsAt: string;
  rules: Record<string, unknown>;
  rewards: Record<string, unknown>;
  participants: Participant[];
  isParticipating: boolean;
  myProgress: Record<string, unknown> | null;
  myScore: number;
}

interface Member {
  id: string;
  name: string;
  avatarUrl: string | null;
  topStrengths: { themeName: string; domain: string }[];
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function ChallengePage() {
  const { challengeId } = useParams();
  const { data: session } = useSession();
  const router = useRouter();

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Bingo state
  const [selectedSquare, setSelectedSquare] = useState<{ row: number; col: number } | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [markingSquare, setMarkingSquare] = useState(false);

  useEffect(() => {
    fetchChallenge();
  }, [challengeId]);

  const fetchChallenge = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/challenges/${challengeId}`);
      if (response.ok) {
        const result = await response.json();
        setChallenge(result.data);
      } else {
        setError("Challenge not found");
      }
    } catch (err) {
      setError("Failed to load challenge");
    } finally {
      setLoading(false);
    }
  };

  const joinChallenge = async () => {
    setJoining(true);
    try {
      const response = await fetch(`/api/challenges/${challengeId}/join`, {
        method: "POST",
      });
      if (response.ok) {
        fetchChallenge(); // Refresh to get new progress
      } else {
        const data = await response.json();
        setError(data.error?.message || "Failed to join");
      }
    } catch (err) {
      setError("Failed to join challenge");
    } finally {
      setJoining(false);
    }
  };

  const fetchMembers = async () => {
    if (!selectedSquare || !challenge?.myProgress) return;

    const board = (challenge.myProgress as { board: BingoSquare[][] }).board;
    const square = board[selectedSquare.row][selectedSquare.col];

    setLoadingMembers(true);
    try {
      // Fetch members with this theme
      const response = await fetch(`/api/members?theme=${square.theme.toLowerCase().replace(/ /g, "-")}&limit=50`);
      if (response.ok) {
        const result = await response.json();
        setMembers(result.data);
      }
    } catch (err) {
      console.error("Failed to fetch members:", err);
    } finally {
      setLoadingMembers(false);
    }
  };

  useEffect(() => {
    if (selectedSquare) {
      fetchMembers();
    }
  }, [selectedSquare]);

  const markSquare = async (memberId: string) => {
    if (!selectedSquare) return;

    setMarkingSquare(true);
    try {
      const response = await fetch(`/api/challenges/${challengeId}/bingo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          row: selectedSquare.row,
          col: selectedSquare.col,
          memberId,
        }),
      });

      if (response.ok) {
        setSelectedSquare(null);
        fetchChallenge(); // Refresh progress
      } else {
        const data = await response.json();
        setError(data.error?.message || "Failed to mark square");
      }
    } catch (err) {
      setError("Failed to mark square");
    } finally {
      setMarkingSquare(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/2" />
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (error || !challenge) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <p className="text-destructive">{error || "Challenge not found"}</p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/challenges">Back to Challenges</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const bingoProgress = challenge.myProgress as { board: BingoSquare[][]; completedLines: string[]; hasWon: boolean } | null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <Button variant="ghost" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Grid3X3 className="h-8 w-8 text-domain-strategic" />
            <h1 className="font-display text-3xl font-bold">{challenge.name}</h1>
          </div>
          <p className="text-muted-foreground">{challenge.description}</p>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(challenge.startsAt).toLocaleDateString()} - {new Date(challenge.endsAt).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {challenge.participants.length} participants
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchChallenge}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {!challenge.isParticipating && challenge.status === "ACTIVE" && (
            <Button variant="strategic" onClick={joinChallenge} isLoading={joining}>
              Join Challenge
            </Button>
          )}
        </div>
      </div>

      {/* Win celebration */}
      {bingoProgress?.hasWon && (
        <Card className="bg-gradient-to-r from-amber-100 to-amber-50 border-amber-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-amber-200 flex items-center justify-center">
                <PartyPopper className="h-8 w-8 text-amber-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-amber-900">BINGO! You Won!</h3>
                <p className="text-amber-700">
                  Congratulations! You completed a line and earned 50 points!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bingo Board */}
      {challenge.isParticipating && bingoProgress ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Grid3X3 className="h-5 w-5 text-domain-strategic" />
                  Your Bingo Board
                </CardTitle>
                <CardDescription>
                  Click a square, then select a team member with that strength
                </CardDescription>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{challenge.myScore}</p>
                <p className="text-xs text-muted-foreground">points</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-2 max-w-lg mx-auto">
              {bingoProgress.board.map((row, rowIndex) =>
                row.map((square, colIndex) => {
                  const isSelected =
                    selectedSquare?.row === rowIndex && selectedSquare?.col === colIndex;
                  const isFreeSpace = square.theme === "FREE";
                  const isInCompletedLine = bingoProgress.completedLines.some(
                    (line) =>
                      line === `row-${rowIndex}` ||
                      line === `col-${colIndex}` ||
                      (line === "diag-main" && rowIndex === colIndex) ||
                      (line === "diag-anti" && rowIndex + colIndex === 4)
                  );

                  return (
                    <button
                      key={`${rowIndex}-${colIndex}`}
                      onClick={() => {
                        if (!square.marked && !isFreeSpace) {
                          setSelectedSquare({ row: rowIndex, col: colIndex });
                          setMemberSearch("");
                        }
                      }}
                      disabled={square.marked || isFreeSpace}
                      className={cn(
                        "aspect-square rounded-lg border-2 p-1 flex flex-col items-center justify-center text-center transition-all",
                        square.marked
                          ? isInCompletedLine
                            ? "bg-amber-100 border-amber-400"
                            : "bg-domain-strategic-light border-domain-strategic"
                          : isFreeSpace
                          ? "bg-muted border-muted-foreground/20"
                          : isSelected
                          ? "bg-primary/10 border-primary ring-2 ring-primary ring-offset-2"
                          : "bg-background border-border hover:border-primary/50 hover:bg-muted/50"
                      )}
                    >
                      {square.marked && !isFreeSpace && (
                        <CheckCircle2 className="h-4 w-4 text-domain-strategic mb-0.5" />
                      )}
                      {isFreeSpace ? (
                        <Sparkles className="h-5 w-5 text-amber-500" />
                      ) : (
                        <DomainIcon
                          domain={square.domain as DomainSlug}
                          size="sm"
                        />
                      )}
                      <span className="text-[10px] font-medium leading-tight mt-0.5 line-clamp-2">
                        {isFreeSpace ? "FREE" : square.theme}
                      </span>
                      {square.markedByName && (
                        <span className="text-[8px] text-muted-foreground truncate w-full">
                          {square.markedByName.split(" ")[0]}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Member selection modal */}
            {selectedSquare && (
              <div className="mt-6 p-4 rounded-xl border bg-muted/30">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold">
                    Find someone with{" "}
                    <span className="text-domain-strategic">
                      {bingoProgress.board[selectedSquare.row][selectedSquare.col].theme}
                    </span>
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedSquare(null)}
                  >
                    Cancel
                  </Button>
                </div>

                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search team members..."
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto space-y-2">
                  {loadingMembers ? (
                    <div className="text-center py-4 text-muted-foreground">
                      Loading members...
                    </div>
                  ) : members.filter(
                      (m) =>
                        m.name.toLowerCase().includes(memberSearch.toLowerCase()) &&
                        m.id !== session?.user?.memberId
                    ).length > 0 ? (
                    members
                      .filter(
                        (m) =>
                          m.name.toLowerCase().includes(memberSearch.toLowerCase()) &&
                          m.id !== session?.user?.memberId
                      )
                      .map((member) => (
                        <button
                          key={member.id}
                          onClick={() => markSquare(member.id)}
                          disabled={markingSquare}
                          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-background transition-colors text-left"
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={member.avatarUrl || undefined} />
                            <AvatarFallback className="bg-muted">
                              {getInitials(member.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{member.name}</p>
                            <div className="flex gap-1 mt-0.5">
                              {member.topStrengths?.slice(0, 3).map((s) => (
                                <span
                                  key={s.themeName}
                                  className="text-[10px] text-muted-foreground"
                                >
                                  {s.themeName}
                                </span>
                              ))}
                            </div>
                          </div>
                          <CheckCircle2 className="h-5 w-5 text-domain-strategic opacity-0 group-hover:opacity-100" />
                        </button>
                      ))
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      No team members found with this strength in their top 10
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : !challenge.isParticipating ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Grid3X3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Join to Play</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Join this challenge to get your own bingo board
            </p>
            {challenge.status === "ACTIVE" && (
              <Button variant="strategic" onClick={joinChallenge} isLoading={joining}>
                Join Challenge
              </Button>
            )}
          </CardContent>
        </Card>
      ) : null}

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          {challenge.participants.length > 0 ? (
            <div className="space-y-3">
              {challenge.participants
                .sort((a, b) => b.score - a.score)
                .slice(0, 10)
                .map((participant, index) => (
                  <div
                    key={participant.id}
                    className={cn(
                      "flex items-center gap-4 p-3 rounded-lg",
                      participant.id === session?.user?.memberId
                        ? "bg-primary/10 ring-1 ring-primary"
                        : "bg-muted/30"
                    )}
                  >
                    <span
                      className={cn(
                        "w-8 text-center font-bold",
                        index === 0
                          ? "text-amber-500"
                          : index === 1
                          ? "text-slate-400"
                          : index === 2
                          ? "text-amber-600"
                          : "text-muted-foreground"
                      )}
                    >
                      {index === 0 ? <Crown className="h-5 w-5 mx-auto" /> : `#${index + 1}`}
                    </span>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={participant.avatarUrl || undefined} />
                      <AvatarFallback>{getInitials(participant.name || "?")}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{participant.name}</p>
                      {participant.completedAt && (
                        <p className="text-xs text-domain-strategic flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Completed
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{participant.score}</p>
                      <p className="text-xs text-muted-foreground">points</p>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No participants yet. Be the first to join!
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
