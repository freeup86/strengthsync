"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { DomainIcon } from "@/components/strengths/DomainIcon";
import { ThemeBadge } from "@/components/strengths/ThemeBadge";
import {
  ArrowLeft,
  Handshake,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle2,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DomainSlug } from "@/constants/strengths-data";

interface MentorData {
  id: string;
  name: string;
  avatarUrl: string | null;
  jobTitle: string | null;
  topStrengths: { name: string; domain: string }[];
}

const FOCUS_AREAS = [
  "Strategic Thinking",
  "Leadership Development",
  "Communication Skills",
  "Project Management",
  "Technical Skills",
  "Career Growth",
  "Work-Life Balance",
  "Team Collaboration",
  "Problem Solving",
  "Time Management",
  "Presentation Skills",
  "Conflict Resolution",
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function MentorshipRequestContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mentorId = searchParams.get("mentor");

  const [mentor, setMentor] = useState<MentorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [customArea, setCustomArea] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (mentorId) {
      fetchMentor();
    } else {
      setLoading(false);
    }
  }, [mentorId]);

  const fetchMentor = async () => {
    try {
      const res = await fetch(`/api/members/${mentorId}`);
      if (res.ok) {
        const result = await res.json();
        setMentor({
          id: result.data.id,
          name: result.data.name,
          avatarUrl: result.data.avatarUrl,
          jobTitle: result.data.jobTitle,
          topStrengths: result.data.topStrengths || [],
        });
      }
    } catch (err) {
      console.error("Failed to fetch mentor:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFocusArea = (area: string) => {
    if (selectedAreas.includes(area)) {
      setSelectedAreas(selectedAreas.filter((a) => a !== area));
    } else if (selectedAreas.length < 5) {
      setSelectedAreas([...selectedAreas, area]);
    }
  };

  const addCustomArea = () => {
    if (customArea.trim() && !selectedAreas.includes(customArea.trim()) && selectedAreas.length < 5) {
      setSelectedAreas([...selectedAreas, customArea.trim()]);
      setCustomArea("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!mentorId) {
      setError("Please select a mentor");
      return;
    }

    if (selectedAreas.length === 0) {
      setError("Please select at least one focus area");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/mentorship", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mentorId,
          focusAreas: selectedAreas,
          notes: notes.trim() || undefined,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error?.message || "Failed to send request");
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Request Sent!</h2>
            <p className="text-muted-foreground mb-6">
              Your mentorship request has been sent to {mentor?.name}. They&apos;ll
              be notified and can accept or discuss further with you.
            </p>
            <div className="flex gap-2 justify-center">
              <Button asChild>
                <Link href="/mentorship">View My Mentorships</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/team">Browse Team</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/mentorship">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Handshake className="h-6 w-6 text-domain-relationship" />
            Request Mentorship
          </CardTitle>
          <CardDescription>
            Connect with a team member for guidance and growth
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

            {/* Mentor Selection */}
            {loading ? (
              <div className="p-4 bg-muted/50 rounded-lg animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-muted" />
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-32" />
                    <div className="h-3 bg-muted rounded w-24" />
                  </div>
                </div>
              </div>
            ) : mentor ? (
              <div className="p-4 bg-domain-relationship-light rounded-lg border border-domain-relationship/20">
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14 ring-2 ring-offset-2 ring-domain-relationship/20">
                    <AvatarImage src={mentor.avatarUrl || undefined} />
                    <AvatarFallback className="bg-domain-relationship text-white">
                      {getInitials(mentor.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold">{mentor.name}</p>
                    {mentor.jobTitle && (
                      <p className="text-sm text-muted-foreground">{mentor.jobTitle}</p>
                    )}
                    <div className="flex gap-1 mt-1">
                      {mentor.topStrengths.slice(0, 5).map((s) => (
                        <DomainIcon key={s.name} domain={s.domain as DomainSlug} size="sm" />
                      ))}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/mentorship">
                      Change
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-muted/50 rounded-lg text-center">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-3">No mentor selected</p>
                <Button asChild>
                  <Link href="/mentorship">Browse Suggested Mentors</Link>
                </Button>
              </div>
            )}

            {/* Focus Areas */}
            <div className="space-y-3">
              <label className="text-sm font-medium">
                Focus Areas <span className="text-red-500">*</span>
                <span className="text-muted-foreground font-normal ml-2">
                  (Select up to 5)
                </span>
              </label>
              <p className="text-sm text-muted-foreground">
                What areas would you like to focus on with your mentor?
              </p>
              <div className="flex flex-wrap gap-2">
                {FOCUS_AREAS.map((area) => (
                  <button
                    key={area}
                    type="button"
                    onClick={() => toggleFocusArea(area)}
                    className={cn(
                      "px-3 py-1.5 text-sm rounded-full border transition-colors",
                      selectedAreas.includes(area)
                        ? "bg-domain-relationship text-white border-domain-relationship"
                        : "hover:bg-muted"
                    )}
                  >
                    {area}
                  </button>
                ))}
              </div>

              {/* Custom area */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customArea}
                  onChange={(e) => setCustomArea(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomArea();
                    }
                  }}
                  placeholder="Add custom focus area..."
                  className="flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  maxLength={50}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCustomArea}
                  disabled={!customArea.trim() || selectedAreas.length >= 5}
                >
                  Add
                </Button>
              </div>

              {/* Selected areas display */}
              {selectedAreas.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  <span className="text-sm text-muted-foreground">Selected:</span>
                  {selectedAreas.map((area) => (
                    <span
                      key={area}
                      className="flex items-center gap-1 px-2 py-1 text-sm bg-domain-relationship/10 text-domain-relationship rounded-full"
                    >
                      {area}
                      <button
                        type="button"
                        onClick={() => toggleFocusArea(area)}
                        className="hover:text-domain-relationship/70"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="notes">
                Personal Message (Optional)
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Share a bit about yourself and why you'd like to connect with this mentor..."
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[100px]"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {notes.length}/500 characters
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" asChild>
              <Link href="/mentorship">Cancel</Link>
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={submitting || !mentor || selectedAreas.length === 0}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Request
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function MentorshipRequestPage() {
  return (
    <Suspense fallback={<div className="animate-pulse">Loading...</div>}>
      <MentorshipRequestContent />
    </Suspense>
  );
}
