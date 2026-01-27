"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Settings,
  Database,
  Palette,
  Sparkles,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Breadcrumbs } from "@/components/ui/Breadcrumb";

interface Domain {
  id: string;
  name: string;
  slug: string;
  description: string;
  colorHex: string;
  colorName: string;
  iconName: string;
  _count?: { themes: number };
}

interface Theme {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  domainId: string;
  domain?: { name: string; slug: string };
  blindSpots: string[];
  actionItems: string[];
  worksWith: string[];
  keywords: string[];
}

type TabType = "domains" | "themes";

export default function AdminConstantsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("domains");
  const [domains, setDomains] = useState<Domain[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDomain, setExpandedDomain] = useState<string | null>(null);
  const [expandedTheme, setExpandedTheme] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = session?.user?.role === "OWNER" || session?.user?.role === "ADMIN";

  useEffect(() => {
    if (!isAdmin) {
      router.replace("/dashboard");
      return;
    }
    fetchData();
  }, [isAdmin, router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [domainsRes, themesRes] = await Promise.all([
        fetch("/api/admin/constants/domains"),
        fetch("/api/admin/constants/themes"),
      ]);

      if (domainsRes.ok) {
        const domainsData = await domainsRes.json();
        setDomains(domainsData.data || []);
      }

      if (themesRes.ok) {
        const themesData = await themesRes.json();
        setThemes(themesData.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleDomainChange = (id: string, field: keyof Domain, value: string) => {
    setDomains(prev =>
      prev.map(d => (d.id === id ? { ...d, [field]: value } : d))
    );
  };

  const handleThemeChange = (id: string, field: keyof Theme, value: string | string[]) => {
    setThemes(prev =>
      prev.map(t => (t.id === id ? { ...t, [field]: value } : t))
    );
  };

  const handleThemeArrayChange = (id: string, field: "blindSpots" | "actionItems" | "worksWith" | "keywords", index: number, value: string) => {
    setThemes(prev =>
      prev.map(t => {
        if (t.id !== id) return t;
        const arr = [...t[field]];
        arr[index] = value;
        return { ...t, [field]: arr };
      })
    );
  };

  const handleAddArrayItem = (id: string, field: "blindSpots" | "actionItems" | "worksWith" | "keywords") => {
    setThemes(prev =>
      prev.map(t => {
        if (t.id !== id) return t;
        return { ...t, [field]: [...t[field], ""] };
      })
    );
  };

  const handleRemoveArrayItem = (id: string, field: "blindSpots" | "actionItems" | "worksWith" | "keywords", index: number) => {
    setThemes(prev =>
      prev.map(t => {
        if (t.id !== id) return t;
        const arr = [...t[field]];
        arr.splice(index, 1);
        return { ...t, [field]: arr };
      })
    );
  };

  const saveDomain = async (domain: Domain) => {
    setSavingId(domain.id);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/admin/constants/domains/${domain.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: domain.name,
          description: domain.description,
          colorHex: domain.colorHex,
          colorName: domain.colorName,
          iconName: domain.iconName,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error?.message || "Failed to save domain");
        return;
      }

      setSuccess(`${domain.name} saved successfully`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to save domain");
    } finally {
      setSavingId(null);
    }
  };

  const saveTheme = async (theme: Theme) => {
    setSavingId(theme.id);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/admin/constants/themes/${theme.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: theme.name,
          shortDescription: theme.shortDescription,
          fullDescription: theme.fullDescription,
          blindSpots: theme.blindSpots.filter(s => s.trim()),
          actionItems: theme.actionItems.filter(s => s.trim()),
          worksWith: theme.worksWith.filter(s => s.trim()),
          keywords: theme.keywords.filter(s => s.trim()),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error?.message || "Failed to save theme");
        return;
      }

      setSuccess(`${theme.name} saved successfully`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to save theme");
    } finally {
      setSavingId(null);
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Breadcrumbs
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Constants" },
        ]}
      />

      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold flex items-center gap-2">
          <Database className="h-8 w-8 text-primary" />
          Strength Constants
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage CliftonStrengths domains and themes data
        </p>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400 rounded-lg text-sm">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab("domains")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 border-b-2 -mb-px transition-colors",
            activeTab === "domains"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Palette className="h-4 w-4" />
          Domains ({domains.length})
        </button>
        <button
          onClick={() => setActiveTab("themes")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 border-b-2 -mb-px transition-colors",
            activeTab === "themes"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Sparkles className="h-4 w-4" />
          Themes ({themes.length})
        </button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading...
            </div>
          </CardContent>
        </Card>
      ) : activeTab === "domains" ? (
        /* Domains Tab */
        <div className="space-y-4">
          {domains.map(domain => (
            <Card key={domain.id} className="overflow-hidden">
              <button
                onClick={() => setExpandedDomain(expandedDomain === domain.id ? null : domain.id)}
                className="w-full text-left"
              >
                <CardHeader className="flex flex-row items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: domain.colorHex + "20" }}
                    >
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: domain.colorHex }}
                      />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{domain.name}</CardTitle>
                      <CardDescription>
                        {domain._count?.themes || 0} themes · {domain.slug}
                      </CardDescription>
                    </div>
                  </div>
                  {expandedDomain === domain.id ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </CardHeader>
              </button>

              {expandedDomain === domain.id && (
                <CardContent className="border-t pt-4 space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Name</label>
                      <Input
                        value={domain.name}
                        onChange={(e) => handleDomainChange(domain.id, "name", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Slug (read-only)</label>
                      <Input value={domain.slug} disabled className="bg-muted" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Color Hex</label>
                      <div className="flex gap-2">
                        <Input
                          value={domain.colorHex}
                          onChange={(e) => handleDomainChange(domain.id, "colorHex", e.target.value)}
                          className="flex-1"
                        />
                        <input
                          type="color"
                          value={domain.colorHex}
                          onChange={(e) => handleDomainChange(domain.id, "colorHex", e.target.value)}
                          className="w-11 h-11 rounded-lg border cursor-pointer"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Color Name</label>
                      <Input
                        value={domain.colorName}
                        onChange={(e) => handleDomainChange(domain.id, "colorName", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Icon Name (Lucide)</label>
                      <Input
                        value={domain.iconName}
                        onChange={(e) => handleDomainChange(domain.id, "iconName", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <textarea
                      value={domain.description}
                      onChange={(e) => handleDomainChange(domain.id, "description", e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[80px]"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={() => saveDomain(domain)} disabled={savingId === domain.id}>
                      {savingId === domain.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Domain
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      ) : (
        /* Themes Tab */
        <div className="space-y-4">
          {themes.map(theme => (
            <Card key={theme.id} className="overflow-hidden">
              <button
                onClick={() => setExpandedTheme(expandedTheme === theme.id ? null : theme.id)}
                className="w-full text-left"
              >
                <CardHeader className="flex flex-row items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-lg">{theme.name}</CardTitle>
                      <CardDescription>
                        {theme.domain?.name || "Unknown"} · {theme.slug}
                      </CardDescription>
                    </div>
                  </div>
                  {expandedTheme === theme.id ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </CardHeader>
              </button>

              {expandedTheme === theme.id && (
                <CardContent className="border-t pt-4 space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Name</label>
                      <Input
                        value={theme.name}
                        onChange={(e) => handleThemeChange(theme.id, "name", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Slug (read-only)</label>
                      <Input value={theme.slug} disabled className="bg-muted" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Short Description</label>
                    <Input
                      value={theme.shortDescription}
                      onChange={(e) => handleThemeChange(theme.id, "shortDescription", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Full Description</label>
                    <textarea
                      value={theme.fullDescription}
                      onChange={(e) => handleThemeChange(theme.id, "fullDescription", e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[120px]"
                    />
                  </div>

                  {/* Array Fields */}
                  {(["blindSpots", "actionItems", "worksWith", "keywords"] as const).map(field => (
                    <div key={field} className="space-y-2">
                      <label className="text-sm font-medium capitalize">
                        {field.replace(/([A-Z])/g, " $1").trim()}
                      </label>
                      <div className="space-y-2">
                        {theme[field].map((item, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              value={item}
                              onChange={(e) => handleThemeArrayChange(theme.id, field, index, e.target.value)}
                              className="flex-1"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveArrayItem(theme.id, field, index)}
                              className="px-2"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddArrayItem(theme.id, field)}
                        >
                          + Add {field.replace(/([A-Z])/g, " $1").trim().toLowerCase()}
                        </Button>
                      </div>
                    </div>
                  ))}

                  <div className="flex justify-end pt-4">
                    <Button onClick={() => saveTheme(theme)} disabled={savingId === theme.id}>
                      {savingId === theme.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Theme
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
