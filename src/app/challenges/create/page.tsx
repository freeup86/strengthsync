"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  ArrowLeft,
  Trophy,
  Gamepad2,
  MessageSquare,
  Handshake,
  Users,
  Calendar,
  Send,
  Loader2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const CHALLENGE_TYPES = [
  {
    id: "STRENGTHS_BINGO",
    name: "Strengths Bingo",
    description: "Find team members with specific strengths to fill your bingo board",
    icon: Gamepad2,
    color: "domain-strategic",
    defaultDuration: 14,
  },
  {
    id: "SHOUTOUT_STREAK",
    name: "Shoutout Streak",
    description: "Give shoutouts every day to build a recognition streak",
    icon: MessageSquare,
    color: "domain-influencing",
    defaultDuration: 7,
  },
  {
    id: "MENTORSHIP_MONTH",
    name: "Mentorship Month",
    description: "Complete a set number of mentorship sessions",
    icon: Handshake,
    color: "domain-relationship",
    defaultDuration: 30,
  },
  {
    id: "COLLABORATION_QUEST",
    name: "Collaboration Quest",
    description: "Help team members with skill requests",
    icon: Users,
    color: "domain-executing",
    defaultDuration: 14,
  },
];

export default function CreateChallengePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const isAdmin = session?.user?.role === "OWNER" || session?.user?.role === "ADMIN";

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Admin Access Required</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Only admins can create challenges
            </p>
            <Button asChild className="mt-4">
              <Link href="/challenges">Back to Challenges</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleTypeSelect = (typeId: string) => {
    setSelectedType(typeId);
    const type = CHALLENGE_TYPES.find((t) => t.id === typeId);
    if (type) {
      // Auto-set dates based on type
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + type.defaultDuration);

      setStartDate(start.toISOString().split("T")[0]);
      setEndDate(end.toISOString().split("T")[0]);

      // Auto-generate name if empty
      if (!name) {
        setName(`${type.name} Challenge`);
      }
      if (!description) {
        setDescription(type.description);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedType) {
      setError("Please select a challenge type");
      return;
    }

    if (!name.trim()) {
      setError("Please enter a challenge name");
      return;
    }

    if (!startDate || !endDate) {
      setError("Please select start and end dates");
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end <= start) {
      setError("End date must be after start date");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || CHALLENGE_TYPES.find((t) => t.id === selectedType)?.description,
          challengeType: selectedType,
          startsAt: new Date(startDate).toISOString(),
          endsAt: new Date(endDate + "T23:59:59").toISOString(),
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error?.message || "Failed to create challenge");
        return;
      }

      router.push(`/challenges/${result.data.id}`);
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/challenges">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-domain-executing" />
            Create Challenge
          </CardTitle>
          <CardDescription>
            Set up a new team challenge to boost engagement
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Challenge Type Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium">
                Challenge Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {CHALLENGE_TYPES.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => handleTypeSelect(type.id)}
                    className={cn(
                      "p-4 rounded-lg border text-left transition-all",
                      selectedType === type.id
                        ? `border-${type.color} bg-${type.color}-light`
                        : "hover:bg-muted"
                    )}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-lg bg-${type.color}-light`}>
                        <type.icon className={`h-5 w-5 text-${type.color}`} />
                      </div>
                      <span className="font-medium">{type.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {type.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="name">
                Challenge Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Q1 Strengths Bingo"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                maxLength={100}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="description">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the challenge and how to participate..."
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[80px]"
                maxLength={500}
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="startDate">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="endDate">
                  End Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>

            {/* Preview */}
            {selectedType && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-medium">Challenge Preview</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {startDate && endDate && (
                    <>
                      Runs from {new Date(startDate).toLocaleDateString()} to{" "}
                      {new Date(endDate).toLocaleDateString()} (
                      {Math.ceil(
                        (new Date(endDate).getTime() - new Date(startDate).getTime()) /
                          (1000 * 60 * 60 * 24)
                      )}{" "}
                      days)
                    </>
                  )}
                </p>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" asChild>
              <Link href="/challenges">Cancel</Link>
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={loading || !selectedType || !name.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Create Challenge
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
