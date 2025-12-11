"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { ThemeBadge } from "@/components/strengths/ThemeBadge";
import { DomainIcon } from "@/components/strengths/DomainIcon";
import {
  MessageSquarePlus,
  Search,
  ArrowLeft,
  Send,
  Sparkles,
  Check,
  X,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { THEMES, DOMAINS, type DomainSlug } from "@/constants/strengths-data";

interface Member {
  id: string;
  name: string;
  avatarUrl: string | null;
  jobTitle: string | null;
  topStrengths: {
    themeName: string;
    themeSlug: string;
    domain: string;
  }[];
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function CreateShoutoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedMemberId = searchParams.get("to");

  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [memberSearch, setMemberSearch] = useState("");

  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<DomainSlug | null>(null);
  const [message, setMessage] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch members
  useEffect(() => {
    fetchMembers();
  }, []);

  // Pre-select member from URL
  useEffect(() => {
    if (preselectedMemberId && members.length > 0) {
      const member = members.find((m) => m.id === preselectedMemberId);
      if (member) setSelectedMember(member);
    }
  }, [preselectedMemberId, members]);

  const fetchMembers = async () => {
    setLoadingMembers(true);
    try {
      const response = await fetch("/api/members?limit=100");
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

  // Fetch theme ID from slug
  const getThemeId = async (slug: string): Promise<string | null> => {
    try {
      const response = await fetch(`/api/themes?slug=${slug}`);
      if (response.ok) {
        const result = await response.json();
        return result.data?.id || null;
      }
    } catch (err) {
      console.error("Failed to fetch theme:", err);
    }
    return null;
  };

  const handleSubmit = async () => {
    if (!selectedMember) {
      setError("Please select a recipient");
      return;
    }
    if (message.length < 10) {
      setError("Message must be at least 10 characters");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Get theme ID if selected
      let themeId = null;
      if (selectedThemeId) {
        themeId = await getThemeId(selectedThemeId);
      }

      const response = await fetch("/api/shoutouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: selectedMember.id,
          themeId,
          message,
          isPublic: true,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error?.message || "Failed to create shoutout");
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/shoutouts");
      }, 1500);
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  // Filter members based on search
  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.jobTitle?.toLowerCase().includes(memberSearch.toLowerCase())
  );

  // Filter themes based on domain
  const filteredThemes = selectedDomain
    ? THEMES.filter((t) => t.domain === selectedDomain)
    : THEMES;

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="overflow-hidden">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <div className="h-20 w-20 rounded-full bg-domain-strategic-light flex items-center justify-center mx-auto mb-4">
                <Check className="h-10 w-10 text-domain-strategic" />
              </div>
              <h2 className="text-2xl font-bold">Shoutout Sent!</h2>
              <p className="text-muted-foreground mt-2">
                {selectedMember?.name} will be notified of your recognition
              </p>
              <div className="mt-4 flex gap-2 justify-center text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  +5 points for you
                </span>
                <span className="flex items-center gap-1">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  +10 points for {selectedMember?.name.split(" ")[0]}
                </span>
              </div>
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
          <Link href="/shoutouts">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="font-display text-3xl font-bold flex items-center gap-2">
          <MessageSquarePlus className="h-8 w-8 text-domain-influencing" />
          Give a Shoutout
        </h1>
        <p className="text-muted-foreground mt-1">
          Recognize a teammate for demonstrating their strengths
        </p>
      </div>

      {/* Step 1: Select recipient */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">1. Who do you want to recognize?</CardTitle>
          <CardDescription>Select a team member</CardDescription>
        </CardHeader>
        <CardContent>
          {selectedMember ? (
            <div className="flex items-center justify-between p-4 rounded-xl bg-domain-influencing-light/30 border border-domain-influencing/20">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selectedMember.avatarUrl || undefined} />
                  <AvatarFallback className="bg-domain-influencing-light text-domain-influencing">
                    {getInitials(selectedMember.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{selectedMember.name}</p>
                  {selectedMember.jobTitle && (
                    <p className="text-sm text-muted-foreground">
                      {selectedMember.jobTitle}
                    </p>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedMember(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search team members..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {loadingMembers ? (
                  <div className="text-center py-4 text-muted-foreground">Loading...</div>
                ) : filteredMembers.length > 0 ? (
                  filteredMembers.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => setSelectedMember(member)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.avatarUrl || undefined} />
                        <AvatarFallback className="bg-muted">
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{member.name}</p>
                        {member.jobTitle && (
                          <p className="text-sm text-muted-foreground truncate">
                            {member.jobTitle}
                          </p>
                        )}
                      </div>
                      {member.topStrengths.length > 0 && (
                        <div className="flex gap-1">
                          {member.topStrengths.slice(0, 2).map((s) => (
                            <DomainIcon
                              key={s.themeSlug}
                              domain={s.domain as DomainSlug}
                              size="sm"
                            />
                          ))}
                        </div>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    No members found
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Select theme (optional) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">2. What strength did they show? (optional)</CardTitle>
          <CardDescription>Select a CliftonStrengths theme</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Domain filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setSelectedDomain(null);
                setSelectedThemeId(null);
              }}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium transition-all border",
                !selectedDomain
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border hover:border-primary/50"
              )}
            >
              All
            </button>
            {DOMAINS.map((domain) => (
              <button
                key={domain.slug}
                onClick={() => {
                  setSelectedDomain(domain.slug);
                  setSelectedThemeId(null);
                }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all border",
                  selectedDomain === domain.slug
                    ? `bg-domain-${domain.slug} text-white border-domain-${domain.slug}`
                    : "bg-background border-border hover:border-primary/50"
                )}
              >
                <DomainIcon domain={domain.slug} size="sm" />
                {domain.name.split(" ")[0]}
              </button>
            ))}
          </div>

          {/* Theme selection */}
          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
            {filteredThemes.map((theme) => (
              <button
                key={theme.slug}
                onClick={() =>
                  setSelectedThemeId(selectedThemeId === theme.slug ? null : theme.slug)
                }
                className={cn(
                  "px-3 py-1 rounded-full text-sm transition-all border",
                  selectedThemeId === theme.slug
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/50 border-border hover:border-primary/50"
                )}
              >
                {theme.name}
              </button>
            ))}
          </div>

          {selectedThemeId && (
            <div className="p-3 rounded-lg bg-muted/50">
              <ThemeBadge
                themeName={THEMES.find((t) => t.slug === selectedThemeId)?.name || ""}
                domainSlug={THEMES.find((t) => t.slug === selectedThemeId)?.domain || "executing"}
                size="default"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 3: Write message */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">3. Write your shoutout</CardTitle>
          <CardDescription>Share how they demonstrated this strength</CardDescription>
        </CardHeader>
        <CardContent>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell them specifically what they did and how it made an impact..."
            rows={4}
            className="w-full px-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
          />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>{message.length} characters</span>
            <span>Minimum 10 characters</span>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Submit */}
      <div className="flex gap-3 justify-end">
        <Button variant="outline" asChild>
          <Link href="/shoutouts">Cancel</Link>
        </Button>
        <Button
          variant="influencing"
          onClick={handleSubmit}
          isLoading={submitting}
          disabled={!selectedMember || message.length < 10}
        >
          <Send className="h-4 w-4 mr-2" />
          Send Shoutout
        </Button>
      </div>
    </div>
  );
}
