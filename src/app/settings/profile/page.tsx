"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import {
  Settings,
  User,
  Building2,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
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
  const { data: session } = useSession();
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
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
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
    <div className="max-w-4xl mx-auto space-y-6">
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
      <div className="flex gap-2 border-b">
        <Link
          href="/settings/profile"
          className={cn(
            "flex items-center gap-2 px-4 py-2 border-b-2 -mb-px transition-colors",
            "border-primary text-primary"
          )}
        >
          <User className="h-4 w-4" />
          Profile
        </Link>
        {isAdmin && (
          <Link
            href="/settings/organization"
            className="flex items-center gap-2 px-4 py-2 border-b-2 -mb-px border-transparent text-muted-foreground hover:text-foreground transition-colors"
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
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 p-3 bg-green-50 text-green-600 rounded-lg text-sm">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                  Changes saved successfully!
                </div>
              )}

              {/* Avatar */}
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile?.avatarUrl || undefined} />
                  <AvatarFallback className="text-xl bg-primary/10 text-primary">
                    {getInitials(fullName || "U")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{profile?.email}</p>
                  <p className="text-sm text-muted-foreground">
                    Avatar can be changed via Gravatar
                  </p>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="fullName">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
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
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
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
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
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
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
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
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
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
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
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
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[100px]"
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground">
                  {bio.length}/500 characters
                </p>
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
      )}
    </div>
  );
}
