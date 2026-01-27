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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/Dialog";
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
  UserPlus,
  Copy,
  Check,
  AlertCircle,
  KeyRound,
  Upload,
} from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { cn } from "@/lib/utils";
import { Breadcrumbs } from "@/components/ui/Breadcrumb";
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
        <span className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
          <ShieldCheck className="h-3 w-3" />
          Owner
        </span>
      );
    case "ADMIN":
      return (
        <span className="flex items-center gap-1 text-xs font-medium text-domain-executing bg-domain-executing-light dark:bg-domain-executing/20 dark:text-domain-executing-muted px-2 py-0.5 rounded-full">
          <Shield className="h-3 w-3" />
          Admin
        </span>
      );
    case "MANAGER":
      return (
        <span className="flex items-center gap-1 text-xs font-medium text-domain-strategic bg-domain-strategic-light dark:bg-domain-strategic/20 dark:text-domain-strategic-muted px-2 py-0.5 rounded-full">
          <Users className="h-3 w-3" />
          Manager
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
  const [processing, setProcessing] = useState(false);
  const [removeConfirm, setRemoveConfirm] = useState<{ open: boolean; memberId: string; memberName: string }>({
    open: false,
    memberId: "",
    memberName: "",
  });

  // Add member modal state
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [addMemberForm, setAddMemberForm] = useState({
    email: "",
    fullName: "",
    jobTitle: "",
    department: "",
    role: "MEMBER" as "MEMBER" | "MANAGER" | "ADMIN",
  });
  const [addMemberLoading, setAddMemberLoading] = useState(false);
  const [addMemberError, setAddMemberError] = useState<string | null>(null);
  const [addMemberSuccess, setAddMemberSuccess] = useState<{
    isNewUser: boolean;
    tempPassword?: string;
    email: string;
    name: string;
  } | null>(null);
  const [copiedPassword, setCopiedPassword] = useState(false);

  // Reset password state
  const [resetPasswordDialog, setResetPasswordDialog] = useState<{
    open: boolean;
    memberId: string;
    memberName: string;
    memberEmail: string;
    memberRole: string;
  }>({
    open: false,
    memberId: "",
    memberName: "",
    memberEmail: "",
    memberRole: "",
  });
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [resetPasswordResult, setResetPasswordResult] = useState<{
    tempPassword: string;
    email: string;
    name: string;
  } | null>(null);
  const [copiedResetPassword, setCopiedResetPassword] = useState(false);

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
    }
  };

  const handleRemoveMember = (memberId: string, memberName: string) => {
    setRemoveConfirm({ open: true, memberId, memberName });
  };

  const confirmRemoveMember = async () => {
    setProcessing(true);
    try {
      const res = await fetch(`/api/admin/members/${removeConfirm.memberId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchMembers();
      }
    } catch (err) {
      console.error("Failed to remove member:", err);
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddMemberLoading(true);
    setAddMemberError(null);

    try {
      const res = await fetch("/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addMemberForm),
      });

      const result = await res.json();

      if (!res.ok) {
        setAddMemberError(result.error?.message || "Failed to add member");
        return;
      }

      // Show success with credentials if new user
      setAddMemberSuccess({
        isNewUser: result.data.isNewUser,
        tempPassword: result.data.tempPassword,
        email: result.data.email,
        name: result.data.name,
      });

      // Refresh member list
      fetchMembers();
    } catch (err) {
      setAddMemberError("An unexpected error occurred");
    } finally {
      setAddMemberLoading(false);
    }
  };

  const resetAddMemberModal = () => {
    setAddMemberForm({
      email: "",
      fullName: "",
      jobTitle: "",
      department: "",
      role: "MEMBER",
    });
    setAddMemberError(null);
    setAddMemberSuccess(null);
    setCopiedPassword(false);
  };

  const copyTempPassword = () => {
    if (addMemberSuccess?.tempPassword) {
      navigator.clipboard.writeText(addMemberSuccess.tempPassword);
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
    }
  };

  const handleResetPassword = (member: Member) => {
    setResetPasswordResult(null);
    setCopiedResetPassword(false);
    setResetPasswordDialog({
      open: true,
      memberId: member.id,
      memberName: member.name,
      memberEmail: member.email,
      memberRole: member.role,
    });
  };

  const confirmResetPassword = async () => {
    setResetPasswordLoading(true);
    try {
      const res = await fetch(`/api/admin/members/${resetPasswordDialog.memberId}`, {
        method: "POST",
      });

      const result = await res.json();

      if (!res.ok) {
        console.error("Failed to reset password:", result.error?.message);
        return;
      }

      setResetPasswordResult({
        tempPassword: result.data.tempPassword,
        email: result.data.email,
        name: result.data.name,
      });
    } catch (err) {
      console.error("Failed to reset password:", err);
    } finally {
      setResetPasswordLoading(false);
    }
  };

  const copyResetPassword = () => {
    if (resetPasswordResult?.tempPassword) {
      navigator.clipboard.writeText(resetPasswordResult.tempPassword);
      setCopiedResetPassword(true);
      setTimeout(() => setCopiedResetPassword(false), 2000);
    }
  };

  const closeResetPasswordDialog = () => {
    setResetPasswordDialog((prev) => ({ ...prev, open: false }));
    setResetPasswordResult(null);
    setCopiedResetPassword(false);
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Breadcrumbs
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Members" },
        ]}
      />

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
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchMembers}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/import">
              <Upload className="h-4 w-4 mr-2" />
              Bulk Import
            </Link>
          </Button>
          <Button onClick={() => { resetAddMemberModal(); setAddMemberOpen(true); }}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Member
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-2">
          <div className="flex flex-col md:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                  <tr className="border-b border-border">
                    <th className="text-left p-4 font-medium">Member</th>
                    <th className="text-left p-4 font-medium">Role</th>
                    <th className="text-left p-4 font-medium hidden sm:table-cell">Status</th>
                    <th className="text-left p-4 font-medium hidden md:table-cell">Strengths</th>
                    <th className="text-left p-4 font-medium hidden lg:table-cell">Points</th>
                    <th className="text-left p-4 font-medium hidden lg:table-cell">Joined</th>
                    <th className="text-right p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.id} className="border-b border-border last:border-b-0 hover:bg-muted/30">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10" ring="none">
                            <AvatarImage src={member.avatarUrl || undefined} />
                            <AvatarFallback className="bg-primary text-primary-foreground">
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
                      <td className="p-4 hidden sm:table-cell">{getStatusBadge(member.status)}</td>
                      <td className="p-4 hidden md:table-cell">
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
                      <td className="p-4 hidden lg:table-cell">
                        <span className="font-medium">{member.points}</span>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground hidden lg:table-cell">
                        {formatDate(member.joinedAt)}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end">
                          {member.id === session?.user?.memberId ? (
                            <div className="p-2 opacity-50 cursor-not-allowed">
                              <MoreVertical className="h-4 w-4" />
                            </div>
                          ) : (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                className="p-2 rounded-lg hover:bg-muted cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
                                aria-label="Member actions"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              {/* Role options - only owners can change roles */}
                              {isOwner && member.role === "MEMBER" && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => handleRoleChange(member.id, "MANAGER")}
                                    disabled={processing}
                                  >
                                    <ChevronUp className="h-4 w-4 mr-2" />
                                    Promote to Manager
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleRoleChange(member.id, "ADMIN")}
                                    disabled={processing}
                                  >
                                    <ChevronUp className="h-4 w-4 mr-2" />
                                    Promote to Admin
                                  </DropdownMenuItem>
                                </>
                              )}
                              {isOwner && member.role === "MANAGER" && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => handleRoleChange(member.id, "ADMIN")}
                                    disabled={processing}
                                  >
                                    <ChevronUp className="h-4 w-4 mr-2" />
                                    Promote to Admin
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleRoleChange(member.id, "MEMBER")}
                                    disabled={processing}
                                  >
                                    <ChevronDown className="h-4 w-4 mr-2" />
                                    Demote to Member
                                  </DropdownMenuItem>
                                </>
                              )}
                              {isOwner && member.role === "ADMIN" && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => handleRoleChange(member.id, "MANAGER")}
                                    disabled={processing}
                                  >
                                    <ChevronDown className="h-4 w-4 mr-2" />
                                    Demote to Manager
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleRoleChange(member.id, "MEMBER")}
                                    disabled={processing}
                                  >
                                    <ChevronDown className="h-4 w-4 mr-2" />
                                    Demote to Member
                                  </DropdownMenuItem>
                                </>
                              )}

                              {/* Status options */}
                              {member.status === "ACTIVE" && (
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(member.id, "INACTIVE")}
                                  disabled={processing}
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Deactivate
                                </DropdownMenuItem>
                              )}
                              {(member.status === "INACTIVE" || member.status === "PENDING") && (
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(member.id, "ACTIVE")}
                                  disabled={processing}
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Activate
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuSeparator />

                              {/* Reset Password - only if user can manage this member */}
                              {(isOwner || (member.role !== "OWNER" && member.role !== "ADMIN")) && (
                                <DropdownMenuItem
                                  onClick={() => handleResetPassword(member)}
                                  disabled={processing}
                                >
                                  <KeyRound className="h-4 w-4 mr-2" />
                                  Reset Password
                                </DropdownMenuItem>
                              )}

                              {/* Remove */}
                              <DropdownMenuItem
                                onClick={() => handleRemoveMember(member.id, member.name)}
                                disabled={processing}
                                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                              >
                                <UserMinus className="h-4 w-4 mr-2" />
                                Remove from org
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          )}
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

      <ConfirmDialog
        open={removeConfirm.open}
        onOpenChange={(open) => setRemoveConfirm((prev) => ({ ...prev, open }))}
        title="Remove Member"
        description={`Are you sure you want to remove ${removeConfirm.memberName} from the organization? This action cannot be undone.`}
        confirmLabel="Remove"
        cancelLabel="Cancel"
        onConfirm={confirmRemoveMember}
        variant="danger"
        isLoading={processing}
      />

      {/* Add Member Dialog */}
      <Dialog open={addMemberOpen} onOpenChange={(open) => { if (!open) resetAddMemberModal(); setAddMemberOpen(open); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Add a new member to your organization. They&apos;ll receive login credentials.
            </DialogDescription>
          </DialogHeader>

          {addMemberSuccess ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-medium mb-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Member Added Successfully
                </div>
                <p className="text-sm text-green-600 dark:text-green-500">
                  {addMemberSuccess.name} ({addMemberSuccess.email}) has been added to your organization.
                </p>
              </div>

              {addMemberSuccess.isNewUser && addMemberSuccess.tempPassword && (
                <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-2">
                    Temporary Password (share this securely)
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 rounded border font-mono text-sm">
                      {addMemberSuccess.tempPassword}
                    </code>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={copyTempPassword}
                      aria-label="Copy temporary password"
                    >
                      {copiedPassword ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                    The user should change this password after their first login.
                  </p>
                </div>
              )}

              {!addMemberSuccess.isNewUser && (
                <p className="text-sm text-muted-foreground">
                  This user already had an account and has been added to your organization with their existing credentials.
                </p>
              )}

              <DialogFooter>
                <Button onClick={() => { resetAddMemberModal(); setAddMemberOpen(false); }}>
                  Done
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={handleAddMember} className="space-y-4">
              {addMemberError && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {addMemberError}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="add-email">
                  Email <span className="text-destructive">*</span>
                </label>
                <input
                  id="add-email"
                  type="email"
                  value={addMemberForm.email}
                  onChange={(e) => setAddMemberForm({ ...addMemberForm, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="member@company.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="add-name">
                  Full Name <span className="text-destructive">*</span>
                </label>
                <input
                  id="add-name"
                  type="text"
                  value={addMemberForm.fullName}
                  onChange={(e) => setAddMemberForm({ ...addMemberForm, fullName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="John Smith"
                  required
                  minLength={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="add-title">
                    Job Title
                  </label>
                  <input
                    id="add-title"
                    type="text"
                    value={addMemberForm.jobTitle}
                    onChange={(e) => setAddMemberForm({ ...addMemberForm, jobTitle: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Engineer"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="add-dept">
                    Department
                  </label>
                  <input
                    id="add-dept"
                    type="text"
                    value={addMemberForm.department}
                    onChange={(e) => setAddMemberForm({ ...addMemberForm, department: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Engineering"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>
                <div className="flex flex-wrap gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value="MEMBER"
                      checked={addMemberForm.role === "MEMBER"}
                      onChange={(e) => setAddMemberForm({ ...addMemberForm, role: e.target.value as "MEMBER" | "MANAGER" | "ADMIN" })}
                      className="w-4 h-4 text-primary"
                    />
                    <span className="text-sm">Member</span>
                  </label>
                  {isOwner && (
                    <>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="role"
                          value="MANAGER"
                          checked={addMemberForm.role === "MANAGER"}
                          onChange={(e) => setAddMemberForm({ ...addMemberForm, role: e.target.value as "MEMBER" | "MANAGER" | "ADMIN" })}
                          className="w-4 h-4 text-primary"
                        />
                        <span className="text-sm">Manager</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="role"
                          value="ADMIN"
                          checked={addMemberForm.role === "ADMIN"}
                          onChange={(e) => setAddMemberForm({ ...addMemberForm, role: e.target.value as "MEMBER" | "MANAGER" | "ADMIN" })}
                          className="w-4 h-4 text-primary"
                        />
                        <span className="text-sm">Admin</span>
                      </label>
                    </>
                  )}
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddMemberOpen(false)}
                  disabled={addMemberLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={addMemberLoading || !addMemberForm.email || !addMemberForm.fullName}
                >
                  {addMemberLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Member
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordDialog.open} onOpenChange={(open) => { if (!open) closeResetPasswordDialog(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              {resetPasswordResult
                ? "Password has been reset successfully."
                : `Reset password for ${resetPasswordDialog.memberName}?`}
            </DialogDescription>
          </DialogHeader>

          {resetPasswordResult ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-medium mb-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Password Reset Successfully
                </div>
                <p className="text-sm text-green-600 dark:text-green-500">
                  A new temporary password has been generated for {resetPasswordResult.name}.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-2">
                  New Temporary Password (share this securely)
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 rounded border font-mono text-sm">
                    {resetPasswordResult.tempPassword}
                  </code>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={copyResetPassword}
                    aria-label="Copy reset password"
                  >
                    {copiedResetPassword ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                  The user should change this password after logging in.
                </p>
              </div>

              <DialogFooter>
                <Button onClick={closeResetPasswordDialog}>
                  Done
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This will generate a new temporary password for <strong>{resetPasswordDialog.memberName}</strong> ({resetPasswordDialog.memberEmail}).
                They will need to use this new password to log in.
              </p>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeResetPasswordDialog}
                  disabled={resetPasswordLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmResetPassword}
                  disabled={resetPasswordLoading}
                >
                  {resetPasswordLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    <>
                      <KeyRound className="h-4 w-4 mr-2" />
                      Reset Password
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
