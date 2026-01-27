"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { ThemeBadge } from "@/components/strengths/ThemeBadge";
import { DomainIcon } from "@/components/strengths/DomainIcon";
import {
  Search,
  Users,
  Filter,
  X,
  ArrowRight,
  RefreshCw,
  UserCircle,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { DOMAINS, THEMES, type DomainSlug } from "@/constants/strengths-data";

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

interface Pagination {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function DirectoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [members, setMembers] = useState<Member[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [selectedDomain, setSelectedDomain] = useState<DomainSlug | null>(
    (searchParams.get("domain") as DomainSlug) || null
  );
  const [selectedTheme, setSelectedTheme] = useState<string | null>(
    searchParams.get("theme") || null
  );
  const [showFilters, setShowFilters] = useState(false);

  const fetchMembers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      if (search) params.set("search", search);
      if (selectedDomain) params.set("domain", selectedDomain);
      if (selectedTheme) params.set("theme", selectedTheme);

      const response = await fetch(`/api/members?${params.toString()}`);
      if (response.ok) {
        const result = await response.json();
        setMembers(result.data);
        setPagination(result.pagination);
      }
    } catch (err) {
      console.error("Failed to fetch members:", err);
    } finally {
      setLoading(false);
    }
  }, [search, selectedDomain, selectedTheme]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (selectedDomain) params.set("domain", selectedDomain);
    if (selectedTheme) params.set("theme", selectedTheme);

    const newUrl = params.toString() ? `?${params.toString()}` : "/directory";
    router.replace(newUrl, { scroll: false });
  }, [search, selectedDomain, selectedTheme, router]);

  const clearFilters = () => {
    setSearch("");
    setSelectedDomain(null);
    setSelectedTheme(null);
  };

  const hasFilters = search || selectedDomain || selectedTheme;

  // Get themes for selected domain
  const filteredThemes = selectedDomain
    ? THEMES.filter((t) => t.domain === selectedDomain)
    : THEMES;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Team Directory</h1>
          <p className="text-muted-foreground mt-1">
            Find team members by name, strength, or expertise
          </p>
        </div>
        <Button variant="outline" onClick={() => fetchMembers()}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Search and filters */}
      <Card>
        <CardContent className="p-2">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter toggle */}
            <Button
              variant={showFilters ? "default" : "outline"}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {hasFilters && (
                <span className="ml-2 h-5 w-5 rounded-full bg-primary-foreground text-primary text-xs flex items-center justify-center">
                  {[selectedDomain, selectedTheme].filter(Boolean).length}
                </span>
              )}
            </Button>

            {hasFilters && (
              <Button variant="ghost" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>

          {/* Filter panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t space-y-4">
              {/* Domain filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Domain</label>
                <div className="flex flex-wrap gap-2">
                  {DOMAINS.map((domain) => (
                    <button
                      key={domain.slug}
                      onClick={() =>
                        setSelectedDomain(
                          selectedDomain === domain.slug ? null : domain.slug
                        )
                      }
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                        "border hover:shadow-sm",
                        selectedDomain === domain.slug
                          ? `bg-domain-${domain.slug} text-white border-domain-${domain.slug}`
                          : "bg-background border-border hover:border-primary/50"
                      )}
                    >
                      <DomainIcon domain={domain.slug} size="sm" />
                      {domain.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Theme {selectedDomain && `(${DOMAINS.find((d) => d.slug === selectedDomain)?.name})`}
                </label>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                  {filteredThemes.slice(0, 20).map((theme) => (
                    <button
                      key={theme.slug}
                      onClick={() =>
                        setSelectedTheme(selectedTheme === theme.slug ? null : theme.slug)
                      }
                      className={cn(
                        "px-3 py-1 rounded-full text-sm transition-all border",
                        selectedTheme === theme.slug
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted/50 border-border hover:border-primary/50"
                      )}
                    >
                      {theme.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results count */}
      {pagination && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {members.length} of {pagination.total} team members
          </span>
          {hasFilters && (
            <span className="text-primary">Filtered results</span>
          )}
        </div>
      )}

      {/* Members grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
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
                  <div className="flex gap-2">
                    <div className="h-6 w-16 bg-muted rounded-full" />
                    <div className="h-6 w-16 bg-muted rounded-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : members.length > 0 ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {members.map((member, index) => (
              <ScrollReveal key={member.id} animation="fade-up" delay={index * 60} duration={350} once>
              <Link href={`/team/${member.id}`}>
                <Card
                  interactive
                  className="h-full hover:shadow-md transition-all duration-200"
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-14 w-14">
                        <AvatarImage src={member.avatarUrl || undefined} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{member.name}</h3>
                        {member.jobTitle && (
                          <p className="text-sm text-muted-foreground truncate">
                            {member.jobTitle}
                          </p>
                        )}
                        {member.department && (
                          <p className="text-xs text-muted-foreground truncate">
                            {member.department}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Top strengths */}
                    {member.topStrengths.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {member.topStrengths.slice(0, 3).map((strength) => (
                          <ThemeBadge
                            key={strength.themeSlug}
                            themeName={strength.themeName}
                            domainSlug={strength.domain as DomainSlug}
                            size="sm"
                          />
                        ))}
                        {member.topStrengths.length > 3 && (
                          <span className="text-xs text-muted-foreground px-2 py-0.5">
                            +{member.topStrengths.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* View profile link */}
                    <div className="mt-4 pt-3 border-t flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {member.points} points
                      </span>
                      <span className="text-xs text-primary flex items-center gap-1">
                        View Profile
                        <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              </ScrollReveal>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={() => fetchMembers(pagination.page + 1)}
              >
                Load More
              </Button>
            </div>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <UserCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">No members found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {hasFilters
                  ? "Try adjusting your filters"
                  : "No team members have been added yet"}
              </p>
              {hasFilters && (
                <Button variant="outline" className="mt-4" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
