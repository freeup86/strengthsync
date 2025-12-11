"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { ThemeBadge } from "@/components/strengths/ThemeBadge";
import {
  MessageSquarePlus,
  RefreshCw,
  Filter,
  ArrowRight,
  Heart,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DomainSlug } from "@/constants/strengths-data";

interface Shoutout {
  id: string;
  message: string;
  isPublic: boolean;
  createdAt: string;
  giver: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  receiver: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  theme: {
    id: string;
    name: string;
    slug: string;
    domain: string;
  } | null;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

type FilterType = "all" | "given" | "received";

export default function ShoutoutsPage() {
  const { data: session } = useSession();
  const [shoutouts, setShoutouts] = useState<Shoutout[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");

  useEffect(() => {
    fetchShoutouts();
  }, [filter]);

  const fetchShoutouts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.set("filter", filter);

      const response = await fetch(`/api/shoutouts?${params.toString()}`);
      if (response.ok) {
        const result = await response.json();
        setShoutouts(result.data);
      }
    } catch (err) {
      console.error("Failed to fetch shoutouts:", err);
    } finally {
      setLoading(false);
    }
  };

  const filters: { id: FilterType; label: string }[] = [
    { id: "all", label: "All" },
    { id: "given", label: "Given" },
    { id: "received", label: "Received" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold flex items-center gap-2">
            <Heart className="h-8 w-8 text-domain-influencing" />
            Shoutouts
          </h1>
          <p className="text-muted-foreground mt-1">
            Recognize your teammates for demonstrating their strengths
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchShoutouts}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="influencing" asChild>
            <Link href="/shoutouts/create">
              <MessageSquarePlus className="h-4 w-4 mr-2" />
              Give Shoutout
            </Link>
          </Button>
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

      {/* Shoutouts list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="animate-pulse space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-muted" />
                    <div className="h-4 bg-muted rounded w-1/4" />
                    <div className="h-10 w-10 rounded-full bg-muted" />
                  </div>
                  <div className="h-4 bg-muted rounded w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : shoutouts.length > 0 ? (
        <div className="space-y-4">
          {shoutouts.map((shoutout) => (
            <Card key={shoutout.id} className="overflow-hidden">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  {/* Giver */}
                  <Link href={`/team/${shoutout.giver.id}`} className="flex-shrink-0">
                    <Avatar className="h-12 w-12 ring-2 ring-offset-2 ring-domain-influencing/20 hover:ring-domain-influencing transition-all">
                      <AvatarImage src={shoutout.giver.avatarUrl || undefined} />
                      <AvatarFallback className="bg-domain-influencing-light text-domain-influencing">
                        {getInitials(shoutout.giver.name)}
                      </AvatarFallback>
                    </Avatar>
                  </Link>

                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Link
                        href={`/team/${shoutout.giver.id}`}
                        className="font-semibold hover:text-primary transition-colors"
                      >
                        {shoutout.giver.name}
                      </Link>
                      <span className="text-muted-foreground">recognized</span>
                      <Link
                        href={`/team/${shoutout.receiver.id}`}
                        className="font-semibold hover:text-primary transition-colors"
                      >
                        {shoutout.receiver.name}
                      </Link>
                      {shoutout.theme && (
                        <>
                          <span className="text-muted-foreground">for</span>
                          <ThemeBadge
                            themeName={shoutout.theme.name}
                            domainSlug={shoutout.theme.domain as DomainSlug}
                            size="sm"
                          />
                        </>
                      )}
                    </div>

                    {/* Message */}
                    <p className="text-muted-foreground">{shoutout.message}</p>

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-dashed">
                      <span className="text-xs text-muted-foreground">
                        {new Date(shoutout.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      <Sparkles className="h-4 w-4 text-domain-influencing" />
                    </div>
                  </div>

                  {/* Receiver */}
                  <Link href={`/team/${shoutout.receiver.id}`} className="flex-shrink-0">
                    <Avatar className="h-12 w-12 ring-2 ring-offset-2 ring-domain-strategic/20 hover:ring-domain-strategic transition-all">
                      <AvatarImage src={shoutout.receiver.avatarUrl || undefined} />
                      <AvatarFallback className="bg-domain-strategic-light text-domain-strategic">
                        {getInitials(shoutout.receiver.name)}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <div className="h-16 w-16 rounded-full bg-domain-influencing-light flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-domain-influencing" />
              </div>
              <h3 className="text-lg font-semibold">No Shoutouts Yet</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                {filter === "given"
                  ? "You haven't given any shoutouts yet"
                  : filter === "received"
                  ? "You haven't received any shoutouts yet"
                  : "Be the first to recognize a teammate!"}
              </p>
              <Button variant="influencing" asChild>
                <Link href="/shoutouts/create">
                  <MessageSquarePlus className="h-4 w-4 mr-2" />
                  Give Shoutout
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
