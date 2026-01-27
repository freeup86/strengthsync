"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import {
  Settings,
  User,
  Building2,
  Bell,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Check,
  X,
  Camera,
  Trash2,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileData {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  jobTitle: string | null;
  department: string | null;
  location: string | null;
  bio: string | null;
  linkedInUrl: string | null;
  pronouns: string | null;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function ProfileSettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [linkedInUrl, setLinkedInUrl] = useState("");
  const [pronouns, setPronouns] = useState("");

  // AI Bio generation state
  const [generating, setGenerating] = useState(false);
  const [generatedBio, setGeneratedBio] = useState<string | null>(null);
  const [showGenerated, setShowGenerated] = useState(false);

  // Avatar upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/settings/profile");
      if (res.ok) {
        const result = await res.json();
        const data = result.data;
        setProfile(data);
        setFullName(data.fullName || "");
        setJobTitle(data.jobTitle || "");
        setDepartment(data.department || "");
        setLocation(data.location || "");
        setBio(data.bio || "");
        setLinkedInUrl(data.linkedInUrl || "");
        setPronouns(data.pronouns || "");
        setAvatarUrl(data.avatarUrl || null);
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    } finally {
      setLoading(false);
    }
  };

  // AI Bio generation handler
  const handleGenerateBio = async () => {
    setGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/generate-bio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          style: "professional",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error?.message || "Failed to generate bio");
        return;
      }

      setGeneratedBio(result.data.bio);
      setShowGenerated(true);
    } catch (err) {
      console.error("AI bio generation error:", err);
      setError("Failed to generate bio. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  // Accept generated bio
  const acceptGeneratedBio = () => {
    if (generatedBio) setBio(generatedBio);
    setGeneratedBio(null);
    setShowGenerated(false);
  };

  // Reject generated bio
  const rejectGeneratedBio = () => {
    setGeneratedBio(null);
    setShowGenerated(false);
  };

  // Avatar upload handler
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await fetch("/api/settings/avatar", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error?.message || "Failed to upload avatar");
        return;
      }

      setAvatarUrl(result.data.avatarUrl);
      // Refresh session so other components get the new avatar
      await updateSession();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Avatar upload error:", err);
      setError("Failed to upload avatar. Please try again.");
    } finally {
      setUploadingAvatar(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Avatar remove handler
  const handleAvatarRemove = async () => {
    setUploadingAvatar(true);
    setError(null);

    try {
      const res = await fetch("/api/settings/avatar", {
        method: "DELETE",
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error?.message || "Failed to remove avatar");
        return;
      }

      setAvatarUrl(null);
      // Refresh session so other components get the update
      await updateSession();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Avatar remove error:", err);
      setError("Failed to remove avatar. Please try again.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Password change handler
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);
    setPasswordSaving(true);

    try {
      const res = await fetch("/api/settings/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setPasswordError(result.error?.message || "Failed to change password");
        return;
      }

      // Clear form and show success
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSuccess(true);
      setTimeout(() => setPasswordSuccess(false), 5000);
    } catch (err) {
      console.error("Password change error:", err);
      setPasswordError("An unexpected error occurred");
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);

    try {
      const res = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          jobTitle: jobTitle || null,
          department: department || null,
          location: location || null,
          bio: bio || null,
          linkedInUrl: linkedInUrl || null,
          pronouns: pronouns || null,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error?.message || "Failed to save changes");
        return;
      }

      setProfile(result.data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const isAdmin = session?.user?.role === "OWNER" || session?.user?.role === "ADMIN";

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
          className={cn(
            "flex items-center gap-2 px-4 py-2 border-b-2 -mb-px transition-colors whitespace-nowrap",
            "border-primary text-primary"
          )}
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
        {isAdmin && (
          <Link
            href="/settings/organization"
            className="flex items-center gap-2 px-4 py-2 border-b-2 -mb-px border-transparent text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
          >
            <Building2 className="h-4 w-4" />
            Organization
          </Link>
        )}
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-12">
            <div className="animate-pulse space-y-4">
              <div className="h-20 w-20 rounded-full bg-muted mx-auto" />
              <div className="h-4 bg-muted rounded w-1/3 mx-auto" />
              <div className="space-y-2 max-w-md mx-auto">
                <div className="h-10 bg-muted rounded" />
                <div className="h-10 bg-muted rounded" />
                <div className="h-10 bg-muted rounded" />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information visible to your team
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

              {/* Avatar */}
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={avatarUrl || undefined} />
                    <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                      {getInitials(fullName || "U")}
                    </AvatarFallback>
                  </Avatar>
                  {/* Upload overlay */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed"
                  >
                    {uploadingAvatar ? (
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    ) : (
                      <Camera className="h-6 w-6 text-white" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </div>
                <div className="space-y-2">
                  <p className="font-medium">{profile?.email}</p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="text-xs"
                    >
                      <Camera className="h-3 w-3 mr-1.5" />
                      {avatarUrl ? "Change" : "Upload"} Photo
                    </Button>
                    {avatarUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleAvatarRemove}
                        disabled={uploadingAvatar}
                        className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3 w-3 mr-1.5" />
                        Remove
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    JPEG, PNG, GIF, or WebP. Max 5MB.
                  </p>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="fullName">
                    Full Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    required
                    minLength={2}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="pronouns">
                    Pronouns
                  </label>
                  <input
                    id="pronouns"
                    type="text"
                    value={pronouns}
                    onChange={(e) => setPronouns(e.target.value)}
                    placeholder="e.g., they/them, she/her, he/him"
                    className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="jobTitle">
                    Job Title
                  </label>
                  <input
                    id="jobTitle"
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g., Software Engineer"
                    className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="department">
                    Department
                  </label>
                  <input
                    id="department"
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g., Engineering"
                    className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="location">
                    Location
                  </label>
                  <input
                    id="location"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., San Francisco, CA"
                    className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="linkedInUrl">
                    LinkedIn URL
                  </label>
                  <input
                    id="linkedInUrl"
                    type="url"
                    value={linkedInUrl}
                    onChange={(e) => setLinkedInUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                    className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="bio">
                  Bio
                </label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell your team a bit about yourself..."
                  className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[100px]"
                  maxLength={500}
                />
                <div className="flex justify-between items-center">
                  <p className="text-xs text-muted-foreground">
                    {bio.length}/500 characters
                  </p>
                  {/* AI Generate Bio Button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleGenerateBio}
                    disabled={generating}
                    className="text-xs gap-1.5 text-domain-strategic hover:text-domain-strategic hover:bg-domain-strategic/10"
                  >
                    {generating ? (
                      <>
                        <div className="h-3 w-3 border-2 border-domain-strategic border-t-transparent rounded-full animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3 w-3" />
                        Generate with AI
                      </>
                    )}
                  </Button>
                </div>

                {/* AI Generated Bio Panel */}
                {showGenerated && generatedBio && (
                  <div className="p-4 rounded-xl bg-domain-strategic/10 border border-domain-strategic/30 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-domain-strategic">
                      <Sparkles className="h-4 w-4" />
                      AI-Generated Bio
                    </div>
                    <p className="text-sm leading-relaxed bg-background/50 p-3 rounded-lg">
                      {generatedBio}
                    </p>
                    <div className="flex gap-2 justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={rejectGeneratedBio}
                        className="text-xs"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Discard
                      </Button>
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onClick={acceptGeneratedBio}
                        className="text-xs bg-domain-strategic hover:bg-domain-strategic/90"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Use This Bio
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={saving || !fullName.trim()}>
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

          {/* Change Password Card */}
          <form onSubmit={handlePasswordChange} className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Change Password
                </CardTitle>
                <CardDescription>
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {passwordError && (
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {passwordError}
                  </div>
                )}

                {passwordSuccess && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400 rounded-lg text-sm">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                    Password changed successfully!
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="currentPassword">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-3 py-2 pr-10 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                      aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="newPassword">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 pr-10 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                      aria-label={showNewPassword ? "Hide password" : "Show password"}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Must be at least 8 characters with uppercase, lowercase, and a number
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="confirmPassword">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 pr-10 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-destructive">Passwords do not match</p>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  disabled={
                    passwordSaving ||
                    !currentPassword ||
                    !newPassword ||
                    !confirmPassword ||
                    newPassword !== confirmPassword
                  }
                >
                  {passwordSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Changing Password...
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Change Password
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </>
      )}
    </div>
  );
}
