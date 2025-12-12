"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { DomainIcon } from "@/components/strengths/DomainIcon";
import {
  Users,
  Search,
  RefreshCw,
  Shield,
  ShieldCheck,
  User,
  MoreVertical,
  UserMinus,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DomainSlug } from "@/constants/strengths-data";

interface Member {
  id: string;
  userId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  jobTitle: string | null;
  department: string | null;
  role: string;
  status: string;
  points: number;
  streak: number;
  hasStrengths: boolean;
  topStrengths: { name: string; domain: string }[];
  shoutoutsReceived: number;
  shoutoutsGiven: number;
  joinedAt: string;
  lastLoginAt: string | null;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getRoleBadge(role: string) {
  switch (role) {
    case "OWNER":
      return (
        <span className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
          <ShieldCheck className="h-3 w-3" />
          Owner
        </span>
      );
    case "ADMIN":
      return (
        <span className="flex items-center gap-1 text-xs font-medium text-domain-executing bg-domain-executing-light px-2 py-0.5 rounded-full">
          <Shield className="h-3 w-3" />
          Admin
        </span>
      );
    default:
      return (
        <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          <User className="h-3 w-3" />
          Member
        </span>
      );
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "ACTIVE":
      return (
        <span className="flex items-center gap-1 text-xs text-green-600">
          <CheckCircle2 className="h-3 w-3" />
          Active
        </span>
      );
    case "INACTIVE":
      return (
        <span className="flex items-center gap-1 text-xs text-red-600">
          <XCircle className="h-3 w-3" />
          Inactive
        </span>
      );
    case "PENDING":
      return (
        <span className="flex items-center gap-1 text-xs text-amber-600">
          <Clock className="h-3 w-3" />
          Pending
        </span>
      );
    default:
      return null;
  }
}

export default function AdminMembersPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [actionMemberId, setActionMemberId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const isOwner = session?.user?.role === "OWNER";
  const isAdmin = session?.user?.role === "OWNER" || session?.user?.role === "ADMIN";

  useEffect(() => {
    if (!isAdmin) {
      router.replace("/dashboard");
      return;
    }
    fetchMembers();
  }, [isAdmin, router, statusFilter]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      if (searchQuery) params.append("search", searchQuery);
      params.append("limit", "50");

      const res = await fetch(`/api/admin/members?${params}`);
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMembers();
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    setProcessing(true);
    try {
      const res = await fetch(`/api/admin/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (res.ok) {
        fetchMembers();
      }
    } catch (err) {
      console.error("Failed to update role:", err);
    } finally {
      setProcessing(false);
      setActionMemberId(null);
    }
  };

  const handleStatusChange = async (memberId: string, newStatus: string) => {
    setProcessing(true);
    try {
      const res = await fetch(`/api/admin/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        fetchMembers();
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setProcessing(false);
      setActionMemberId(null);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from the organization?`)) {
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch(`/api/admin/members/${memberId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchMembers();
      }
    } catch (err) {
      console.error("Failed to remove member:", err);
    } finally {
      setProcessing(false);
      setActionMemberId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            Member Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage organization members, roles, and access
          </p>
        </div>
        <Button variant="outline" onClick={fetchMembers}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col md:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <Button type="submit">Search</Button>
            </form>
            <div className="flex gap-2">
              {["ACTIVE", "INACTIVE", "PENDING"].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(statusFilter === status ? null : status)}
                  className={cn(
                    "px-3 py-2 text-sm rounded-lg transition-colors",
                    statusFilter === status
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80"
                  )}
                >
                  {status.charAt(0) + status.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Members List */}
      {loading ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      ) : members.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-medium">Member</th>
                    <th className="text-left p-4 font-medium">Role</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Strengths</th>
                    <th className="text-left p-4 font-medium">Points</th>
                    <th className="text-left p-4 font-medium">Joined</th>
                    <th className="text-right p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.id} className="border-b hover:bg-muted/30">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={member.avatarUrl || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getInitials(member.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <Link
                              href={`/team/${member.id}`}
                              className="font-medium hover:text-primary"
                            >
                              {member.name}
                            </Link>
                            <p className="text-sm text-muted-foreground">
                              {member.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">{getRoleBadge(member.role)}</td>
                      <td className="p-4">{getStatusBadge(member.status)}</td>
                      <td className="p-4">
                        {member.hasStrengths ? (
                          <div className="flex gap-1">
                            {member.topStrengths.slice(0, 4).map((s) => (
                              <DomainIcon
                                key={s.name}
                                domain={s.domain as DomainSlug}
                                size="sm"
                              />
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            Not uploaded
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="font-medium">{member.points}</span>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {formatDate(member.joinedAt)}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end">
                          <div className="relative">
                            <button
                              onClick={() =>
                                setActionMemberId(
                                  actionMemberId === member.id ? null : member.id
                                )
                              }
                              className="p-2 hover:bg-muted rounded-lg"
                              disabled={member.id === session?.user?.memberId}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>

                            {actionMemberId === member.id && (
                              <div className="absolute right-0 mt-1 w-48 bg-white border rounded-lg shadow-lg z-10">
                                {/* Role options */}
                                {isOwner && member.role !== "OWNER" && (
                                  <button
                                    onClick={() => handleRoleChange(member.id, "ADMIN")}
                                    className="w-full text-left px-4 py-2 text-sm hover:bg-muted flex items-center gap-2"
                                    disabled={processing}
                                  >
                                    <ChevronUp className="h-4 w-4" />
                                    {member.role === "ADMIN" ? "Demote to Member" : "Promote to Admin"}
                                  </button>
                                )}
                                {member.role === "ADMIN" && isOwner && (
                                  <button
                                    onClick={() => handleRoleChange(member.id, "MEMBER")}
                                    className="w-full text-left px-4 py-2 text-sm hover:bg-muted flex items-center gap-2"
                                    disabled={processing}
                                  >
                                    <ChevronDown className="h-4 w-4" />
                                    Demote to Member
                                  </button>
                                )}

                                {/* Status options */}
                                {member.status === "ACTIVE" && (
                                  <button
                                    onClick={() => handleStatusChange(member.id, "INACTIVE")}
                                    className="w-full text-left px-4 py-2 text-sm hover:bg-muted flex items-center gap-2"
                                    disabled={processing}
                                  >
                                    <XCircle className="h-4 w-4" />
                                    Deactivate
                                  </button>
                                )}
                                {member.status === "INACTIVE" && (
                                  <button
                                    onClick={() => handleStatusChange(member.id, "ACTIVE")}
                                    className="w-full text-left px-4 py-2 text-sm hover:bg-muted flex items-center gap-2"
                                    disabled={processing}
                                  >
                                    <CheckCircle2 className="h-4 w-4" />
                                    Activate
                                  </button>
                                )}

                                <hr className="my-1" />

                                {/* Remove */}
                                <button
                                  onClick={() => handleRemoveMember(member.id, member.name)}
                                  className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                                  disabled={processing}
                                >
                                  <UserMinus className="h-4 w-4" />
                                  Remove from org
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold">No Members Found</h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery || statusFilter
                ? "Try adjusting your filters"
                : "Invite team members to get started"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
