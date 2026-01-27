"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  Settings,
  User,
  Building2,
  Bell,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Copy,
  RefreshCw,
  Users,
  Link as LinkIcon,
  MessageSquare,
  Send,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface OrgData {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  description: string | null;
  inviteCode: string | null;
  inviteCodeEnabled: boolean;
  memberCount: number;
  canEdit: boolean;
  createdAt: string;
}

export default function OrganizationSettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [org, setOrg] = useState<OrgData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [inviteCodeEnabled, setInviteCodeEnabled] = useState(true);

  // Teams webhook state
  const [teamsWebhookUrl, setTeamsWebhookUrl] = useState("");
  const [teamsConfigured, setTeamsConfigured] = useState(false);
  const [teamsMaskedUrl, setTeamsMaskedUrl] = useState("");
  const [teamsSaving, setTeamsSaving] = useState(false);
  const [teamsTesting, setTeamsTesting] = useState(false);
  const [teamsSuccess, setTeamsSuccess] = useState<string | null>(null);
  const [teamsError, setTeamsError] = useState<string | null>(null);

  const isAdmin = session?.user?.role === "OWNER" || session?.user?.role === "ADMIN";

  useEffect(() => {
    if (!isAdmin) {
      router.replace("/settings/profile");
      return;
    }
    fetchOrganization();
    fetchTeamsConfig();
  }, [isAdmin, router]);

  const fetchOrganization = async () => {
    try {
      const res = await fetch("/api/settings/organization");
      if (res.ok) {
        const result = await res.json();
        const data = result.data;
        setOrg(data);
        setName(data.name || "");
        setDescription(data.description || "");
        setInviteCodeEnabled(data.inviteCodeEnabled);
      }
    } catch (err) {
      console.error("Failed to fetch organization:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);

    try {
      const res = await fetch("/api/settings/organization", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description || null,
          inviteCodeEnabled,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error?.message || "Failed to save changes");
        return;
      }

      setOrg((prev) => prev ? { ...prev, ...result.data } : null);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerateCode = async () => {
    setRegenerating(true);
    try {
      const res = await fetch("/api/settings/organization", {
        method: "POST",
      });

      if (res.ok) {
        const result = await res.json();
        setOrg((prev) => prev ? { ...prev, inviteCode: result.data.inviteCode } : null);
      }
    } catch (err) {
      console.error("Failed to regenerate code:", err);
    } finally {
      setRegenerating(false);
    }
  };

  const fetchTeamsConfig = async () => {
    try {
      const res = await fetch("/api/admin/integrations/teams");
      if (res.ok) {
        const result = await res.json();
        setTeamsConfigured(result.data.configured);
        setTeamsMaskedUrl(result.data.maskedUrl);
      }
    } catch (err) {
      console.error("Failed to fetch Teams config:", err);
    }
  };

  const handleTeamsSave = async () => {
    setTeamsSaving(true);
    setTeamsSuccess(null);
    setTeamsError(null);

    try {
      const res = await fetch("/api/admin/integrations/teams", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookUrl: teamsWebhookUrl }),
      });

      const result = await res.json();

      if (!res.ok) {
        setTeamsError(result.error?.message || "Failed to save webhook URL");
        return;
      }

      setTeamsConfigured(!!teamsWebhookUrl);
      setTeamsSuccess("Webhook URL saved!");
      setTeamsWebhookUrl("");
      fetchTeamsConfig();
      setTimeout(() => setTeamsSuccess(null), 3000);
    } catch (err) {
      setTeamsError("An unexpected error occurred");
    } finally {
      setTeamsSaving(false);
    }
  };

  const handleTeamsTest = async () => {
    setTeamsTesting(true);
    setTeamsSuccess(null);
    setTeamsError(null);

    try {
      const res = await fetch("/api/admin/integrations/teams", {
        method: "POST",
      });

      const result = await res.json();

      if (!res.ok) {
        setTeamsError(result.error?.message || "Test failed");
        return;
      }

      setTeamsSuccess("Test message sent! Check your Teams channel.");
      setTimeout(() => setTeamsSuccess(null), 5000);
    } catch (err) {
      setTeamsError("Failed to send test message");
    } finally {
      setTeamsTesting(false);
    }
  };

  const handleTeamsRemove = async () => {
    setTeamsSaving(true);
    setTeamsSuccess(null);
    setTeamsError(null);

    try {
      const res = await fetch("/api/admin/integrations/teams", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookUrl: "" }),
      });

      if (res.ok) {
        setTeamsConfigured(false);
        setTeamsMaskedUrl("");
        setTeamsWebhookUrl("");
        setTeamsSuccess("Teams integration removed");
        setTimeout(() => setTeamsSuccess(null), 3000);
      }
    } catch (err) {
      setTeamsError("Failed to remove integration");
    } finally {
      setTeamsSaving(false);
    }
  };

  const copyInviteLink = () => {
    if (!org?.inviteCode) return;
    const inviteUrl = `${window.location.origin}/auth/join/${org.inviteCode}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8 text-primary" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your account and preferences
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b overflow-x-auto">
        <Link
          href="/settings/profile"
          className="flex items-center gap-2 px-4 py-2 border-b-2 -mb-px border-transparent text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
        >
          <User className="h-4 w-4" />
          Profile
        </Link>
        <Link
          href="/settings/notifications"
          className="flex items-center gap-2 px-4 py-2 border-b-2 -mb-px border-transparent text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
        >
          <Bell className="h-4 w-4" />
          Notifications
        </Link>
        <Link
          href="/settings/organization"
          className={cn(
            "flex items-center gap-2 px-4 py-2 border-b-2 -mb-px transition-colors whitespace-nowrap",
            "border-primary text-primary"
          )}
        >
          <Building2 className="h-4 w-4" />
          Organization
        </Link>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-12">
            <div className="animate-pulse space-y-4 max-w-md mx-auto">
              <div className="h-4 bg-muted rounded w-1/3" />
              <div className="h-10 bg-muted rounded" />
              <div className="h-4 bg-muted rounded w-1/3" />
              <div className="h-20 bg-muted rounded" />
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Organization Info */}
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Organization Details</CardTitle>
                <CardDescription>
                  Manage your organization&apos;s information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                {success && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400 rounded-lg text-sm">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                    Changes saved successfully!
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center gap-6 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <span className="font-semibold">{org?.memberCount}</span>
                    <span className="text-muted-foreground">members</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Created {org?.createdAt ? new Date(org.createdAt).toLocaleDateString() : ""}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="name">
                    Organization Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    readOnly
                    className="w-full px-3 py-2 border rounded-lg bg-muted text-muted-foreground cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground">
                    Organization name cannot be changed. Contact support if needed.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="description">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your organization..."
                    className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[80px]"
                    maxLength={500}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </form>

          {/* Teams Integration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Microsoft Teams Integration
              </CardTitle>
              <CardDescription>
                Send shoutouts, badge awards, and skill requests to a Teams channel via Incoming Webhook.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {teamsError && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {teamsError}
                </div>
              )}

              {teamsSuccess && (
                <div className="flex items-center gap-2 p-3 bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400 rounded-lg text-sm">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                  {teamsSuccess}
                </div>
              )}

              {teamsConfigured ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium text-green-700 dark:text-green-400">Teams Connected</p>
                        <p className="text-xs text-green-600/70 dark:text-green-400/70 font-mono">
                          {teamsMaskedUrl}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleTeamsTest}
                        disabled={teamsTesting}
                      >
                        {teamsTesting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        <span className="ml-1.5">Test</span>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleTeamsRemove}
                        disabled={teamsSaving}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Update Webhook URL</label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={teamsWebhookUrl}
                        onChange={(e) => setTeamsWebhookUrl(e.target.value)}
                        placeholder="https://outlook.office.com/webhook/..."
                        className="flex-1 px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                      />
                      <Button
                        type="button"
                        onClick={handleTeamsSave}
                        disabled={teamsSaving || !teamsWebhookUrl}
                        size="sm"
                      >
                        {teamsSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        <span className="ml-1.5">Save</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      To set up Teams notifications, create an Incoming Webhook in your Teams channel settings,
                      then paste the webhook URL below.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Webhook URL</label>
                    <input
                      type="url"
                      value={teamsWebhookUrl}
                      onChange={(e) => setTeamsWebhookUrl(e.target.value)}
                      placeholder="https://outlook.office.com/webhook/..."
                      className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                    />
                  </div>

                  <Button
                    type="button"
                    onClick={handleTeamsSave}
                    disabled={teamsSaving || !teamsWebhookUrl}
                  >
                    {teamsSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Connect Teams
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invite Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Team Invitations</CardTitle>
              <CardDescription>
                Manage how people can join your organization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Enable/Disable Toggle */}
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">Invite Link</p>
                  <p className="text-sm text-muted-foreground">
                    Allow new members to join via invite link
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setInviteCodeEnabled(!inviteCodeEnabled);
                    // Auto-save this change
                    fetch("/api/settings/organization", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ inviteCodeEnabled: !inviteCodeEnabled }),
                    });
                  }}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                    inviteCodeEnabled ? "bg-primary" : "bg-muted-foreground/30"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-4 w-4 transform rounded-full bg-background shadow-sm transition-transform",
                      inviteCodeEnabled ? "translate-x-6" : "translate-x-1"
                    )}
                  />
                </button>
              </div>

              {/* Invite Code */}
              {inviteCodeEnabled && org?.inviteCode && (
                <div className="space-y-3">
                  <label className="text-sm font-medium">Invite Link</label>
                  <div className="flex gap-2">
                    <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-muted rounded-lg font-mono text-sm">
                      <LinkIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">
                        {typeof window !== "undefined" ? `${window.location.origin}/auth/join/${org.inviteCode}` : ""}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={copyInviteLink}
                    >
                      {copied ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleRegenerateCode}
                      disabled={regenerating}
                    >
                      <RefreshCw className={cn("h-4 w-4", regenerating && "animate-spin")} />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Share this link with team members to let them join your organization.
                    Regenerating the link will invalidate the old one.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
