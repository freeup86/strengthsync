"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { Input } from "@/components/ui/Input";
import { DomainIcon } from "@/components/strengths/DomainIcon";
import {
  CreditCard,
  Search,
  Star,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import type { DomainSlug } from "@/constants/strengths-data";

interface Member {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  jobTitle: string | null;
  department: string | null;
  points: number;
  topStrengths: {
    rank: number;
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

const DOMAIN_GRADIENTS: Record<string, string> = {
  executing: "from-purple-600 to-purple-400",
  influencing: "from-orange-500 to-amber-400",
  relationship: "from-blue-600 to-sky-400",
  strategic: "from-green-600 to-emerald-400",
};

export default function CardsGalleryPage() {
  const { data: session } = useSession();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const res = await fetch("/api/members?limit=100");
      if (res.ok) {
        const result = await res.json();
        setMembers(result.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch members:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members
    .filter(
      (m) =>
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.jobTitle?.toLowerCase().includes(search.toLowerCase()) ||
        m.department?.toLowerCase().includes(search.toLowerCase()) ||
        m.topStrengths.some((s) =>
          s.themeName.toLowerCase().includes(search.toLowerCase())
        )
    )
    .sort((a, b) => {
      // Current user's card always comes first
      const aIsCurrentUser = a.id === session?.user?.memberId;
      const bIsCurrentUser = b.id === session?.user?.memberId;
      if (aIsCurrentUser && !bIsCurrentUser) return -1;
      if (!aIsCurrentUser && bIsCurrentUser) return 1;
      return 0;
    });

  const getPrimaryDomain = (member: Member): DomainSlug => {
    if (member.topStrengths.length === 0) return "strategic";
    const domainCounts: Record<string, number> = {};
    member.topStrengths.forEach((s) => {
      domainCounts[s.domain] = (domainCounts[s.domain] || 0) + 1;
    });
    const sorted = Object.entries(domainCounts).sort((a, b) => b[1] - a[1]);
    return (sorted[0]?.[0] || "strategic") as DomainSlug;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold flex items-center gap-2">
            <CreditCard className="h-8 w-8 text-domain-influencing" />
            Strengths Cards
          </h1>
          <p className="text-muted-foreground mt-1">
            Digital baseball card-style profiles for your team
          </p>
        </div>
        {session?.user?.memberId && (
          <Button variant="influencing" asChild>
            <Link href={`/cards/${session.user.memberId}`}>
              <Sparkles className="h-4 w-4 mr-2" />
              View My Card
            </Link>
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search by name, title, or strength..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[2.5/3.5] bg-muted rounded-2xl" />
            </div>
          ))}
        </div>
      ) : filteredMembers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMembers.map((member, index) => {
            const primaryDomain = getPrimaryDomain(member);
            const isCurrentUser = member.id === session?.user?.memberId;

            return (
              <ScrollReveal key={member.id} animation="fade-up" delay={index * 60} duration={350} once>
              <Link
                href={`/cards/${member.id}`}
                className="group"
              >
                <div
                  className={cn(
                    "relative aspect-[2.5/3.5] rounded-2xl shadow-lg overflow-hidden transition-all duration-300",
                    "hover:shadow-2xl hover:scale-[1.02]",
                    isCurrentUser && "ring-2 ring-primary ring-offset-2"
                  )}
                >
                  {/* Background Gradient */}
                  <div
                    className={cn(
                      "absolute inset-0 bg-gradient-to-br",
                      DOMAIN_GRADIENTS[primaryDomain] || DOMAIN_GRADIENTS.strategic
                    )}
                  />

                  {/* Card Content */}
                  <div className="relative h-full flex flex-col p-4 text-white">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                        StrengthSync
                      </span>
                      <DomainIcon domain={primaryDomain} size="sm" className="text-white" />
                    </div>

                    {/* Avatar */}
                    <div className="flex justify-center mb-3">
                      <Avatar className="h-16 w-16 ring-2 ring-white/30">
                        <AvatarImage src={member.avatarUrl || undefined} />
                        <AvatarFallback className="text-lg bg-white/20 text-white">
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    {/* Name & Title */}
                    <div className="text-center mb-3">
                      <h2 className="text-base font-bold truncate">{member.name}</h2>
                      {member.jobTitle && (
                        <p className="text-xs opacity-80 truncate">{member.jobTitle}</p>
                      )}
                    </div>

                    {/* Top Strengths */}
                    <div className="flex-1 space-y-1">
                      {member.topStrengths.slice(0, 5).map((strength, i) => (
                        <div
                          key={strength.themeName}
                          className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded px-2 py-1"
                        >
                          <span className="text-[10px] font-bold opacity-60 w-3">
                            {i + 1}
                          </span>
                          <DomainIcon
                            domain={strength.domain as DomainSlug}
                            size="sm"
                            className="text-white h-3 w-3"
                          />
                          <span className="text-[11px] font-medium truncate">
                            {strength.themeName}
                          </span>
                        </div>
                      ))}
                      {member.topStrengths.length === 0 && (
                        <div className="text-center text-xs opacity-60 py-4">
                          No strengths uploaded
                        </div>
                      )}
                    </div>

                    {/* Points */}
                    <div className="flex items-center justify-center gap-1 pt-2 border-t border-white/20 mt-2">
                      <Star className="h-3 w-3" />
                      <span className="text-sm font-bold">{member.points}</span>
                      <span className="text-[10px] opacity-60">points</span>
                    </div>
                  </div>

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-sm font-medium bg-black/50 px-3 py-1 rounded-full">
                      View Card
                    </span>
                  </div>
                </div>
              </Link>
              </ScrollReveal>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold">No cards found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {search
                ? "Try adjusting your search"
                : "No team members have been added yet"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
