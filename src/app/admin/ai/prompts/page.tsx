"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import {
  FileText,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Copy,
  RefreshCw,
  MessageSquare,
  Lightbulb,
  Target,
  Brain,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { Breadcrumbs } from "@/components/ui/Breadcrumb";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/AlertDialog";

type Category = "WRITING_ASSISTANCE" | "INSIGHTS" | "RECOMMENDATIONS" | "CHAT" | "ADMIN";

interface PromptTemplate {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: Category;
  systemPrompt: string;
  userPrompt: string;
  model: string;
  temperature: number;
  maxTokens: number;
  variables: string[];
  createdAt: string;
  updatedAt: string;
}

const CATEGORY_LABELS: Record<Category, string> = {
  WRITING_ASSISTANCE: "Writing Assistance",
  INSIGHTS: "Insights & Analytics",
  RECOMMENDATIONS: "Recommendations",
  CHAT: "Chat",
  ADMIN: "Admin",
};

const CATEGORY_ICONS: Record<Category, React.ElementType> = {
  WRITING_ASSISTANCE: MessageSquare,
  INSIGHTS: Lightbulb,
  RECOMMENDATIONS: Target,
  CHAT: Brain,
  ADMIN: Settings,
};

const DEFAULT_TEMPLATE: Partial<PromptTemplate> = {
  name: "",
  slug: "",
  description: "",
  category: "WRITING_ASSISTANCE",
  systemPrompt: "",
  userPrompt: "",
  model: "gpt-4o",
  temperature: 0.7,
  maxTokens: 1000,
  variables: [],
};

export default function AdminAIPromptsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<PromptTemplate>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const isAdmin = session?.user?.role === "OWNER" || session?.user?.role === "ADMIN";

  useEffect(() => {
    if (!isAdmin) {
      router.push("/dashboard");
      return;
    }
    fetchTemplates();
  }, [isAdmin, router]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/ai/prompts");
      if (response.ok) {
        const result = await response.json();
        setTemplates(result.data);
      }
    } catch (err) {
      console.error("Failed to fetch templates:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setIsCreating(true);
    setEditForm({ ...DEFAULT_TEMPLATE });
    setExpandedId(null);
    setEditingId(null);
  };

  const handleEdit = (template: PromptTemplate) => {
    setEditingId(template.id);
    setEditForm({ ...template });
    setExpandedId(template.id);
    setIsCreating(false);
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingId(null);
    setEditForm({});
    setError(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const url = "/api/admin/ai/prompts";
      const method = isCreating ? "POST" : "PATCH";
      const body = isCreating ? editForm : { id: editingId, ...editForm };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error?.message || "Failed to save template");
        return;
      }

      await fetchTemplates();
      handleCancel();
    } catch (err) {
      setError("Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/ai/prompts?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchTemplates();
      }
    } catch (err) {
      console.error("Failed to delete template:", err);
    }
    setDeleteConfirm(null);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const extractVariables = (text: string): string[] => {
    const matches = text.match(/\{\{(\w+)\}\}/g) || [];
    return [...new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, "")))];
  };

  if (!isAdmin) {
    return null;
  }

  const groupedTemplates = templates.reduce((acc, t) => {
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category].push(t);
    return acc;
  }, {} as Record<Category, PromptTemplate[]>);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Breadcrumbs
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "AI Usage", href: "/admin/ai" },
          { label: "Prompt Templates" },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/ai">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Link>
            </Button>
          </div>
          <h1 className="font-display text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8 text-domain-strategic" />
            Prompt Templates
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage AI prompt templates for different features
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchTemplates} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button onClick={handleCreate} disabled={isCreating}>
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </div>
      </div>

      {/* Create Form */}
      {isCreating && (
        <Card className="border-domain-strategic/30">
          <CardHeader>
            <CardTitle className="text-lg">Create New Template</CardTitle>
          </CardHeader>
          <CardContent>
            <TemplateForm
              form={editForm}
              setForm={setEditForm}
              onSave={handleSave}
              onCancel={handleCancel}
              saving={saving}
              error={error}
              generateSlug={generateSlug}
              extractVariables={extractVariables}
            />
          </CardContent>
        </Card>
      )}

      {/* Templates List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-5 w-48 bg-muted rounded" />
                  <div className="h-4 w-72 bg-muted rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : templates.length === 0 && !isCreating ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No Templates Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first AI prompt template to customize how AI features work.
            </p>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        Object.entries(groupedTemplates).map(([category, categoryTemplates]) => {
          const Icon = CATEGORY_ICONS[category as Category];
          return (
            <div key={category} className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Icon className="h-5 w-5 text-domain-strategic" />
                {CATEGORY_LABELS[category as Category]}
                <span className="text-sm font-normal text-muted-foreground">
                  ({categoryTemplates.length})
                </span>
              </h2>

              {categoryTemplates.map((template) => (
                <Card key={template.id} className={cn(expandedId === template.id && "ring-2 ring-domain-strategic/30")}>
                  <CardContent className="pt-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <button
                        onClick={() => setExpandedId(expandedId === template.id ? null : template.id)}
                        className="flex-1 text-left"
                      >
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{template.name}</h3>
                          <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">
                            {template.slug}
                          </span>
                        </div>
                        {template.description && (
                          <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span>{template.model}</span>
                          <span>Temp: {template.temperature}</span>
                          <span>Max: {template.maxTokens} tokens</span>
                          {template.variables.length > 0 && (
                            <span>{template.variables.length} variables</span>
                          )}
                        </div>
                      </button>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleEdit(template)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setDeleteConfirm(template.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setExpandedId(expandedId === template.id ? null : template.id)}
                        >
                          {expandedId === template.id ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {expandedId === template.id && (
                      <div className="mt-4 pt-4 border-t space-y-4">
                        {editingId === template.id ? (
                          <TemplateForm
                            form={editForm}
                            setForm={setEditForm}
                            onSave={handleSave}
                            onCancel={handleCancel}
                            saving={saving}
                            error={error}
                            generateSlug={generateSlug}
                            extractVariables={extractVariables}
                          />
                        ) : (
                          <>
                            <div>
                              <h4 className="text-sm font-medium mb-2">System Prompt</h4>
                              <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto whitespace-pre-wrap">
                                {template.systemPrompt}
                              </pre>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium mb-2">User Prompt Template</h4>
                              <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto whitespace-pre-wrap">
                                {template.userPrompt}
                              </pre>
                            </div>
                            {template.variables.length > 0 && (
                              <div>
                                <h4 className="text-sm font-medium mb-2">Variables</h4>
                                <div className="flex flex-wrap gap-1">
                                  {template.variables.map((v) => (
                                    <span
                                      key={v}
                                      className="text-xs bg-domain-strategic/10 text-domain-strategic px-2 py-1 rounded"
                                    >
                                      {`{{${v}}}`}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          );
        })
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this prompt template? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Template Form Component
function TemplateForm({
  form,
  setForm,
  onSave,
  onCancel,
  saving,
  error,
  generateSlug,
  extractVariables,
}: {
  form: Partial<PromptTemplate>;
  setForm: (form: Partial<PromptTemplate>) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  error: string | null;
  generateSlug: (name: string) => string;
  extractVariables: (text: string) => string[];
}) {
  const updateForm = (updates: Partial<PromptTemplate>) => {
    const newForm = { ...form, ...updates };

    // Auto-generate slug from name
    if (updates.name && !form.slug) {
      newForm.slug = generateSlug(updates.name);
    }

    // Auto-extract variables from prompts
    if (updates.systemPrompt !== undefined || updates.userPrompt !== undefined) {
      const allText = `${newForm.systemPrompt || ""} ${newForm.userPrompt || ""}`;
      newForm.variables = extractVariables(allText);
    }

    setForm(newForm);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium mb-1 block">Name</label>
          <Input
            value={form.name || ""}
            onChange={(e) => updateForm({ name: e.target.value })}
            placeholder="e.g., Shoutout Enhancer"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Slug</label>
          <Input
            value={form.slug || ""}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            placeholder="e.g., shoutout-enhancer"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-1 block">Description</label>
        <Input
          value={form.description || ""}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Brief description of what this template does"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Category</label>
          <select
            value={form.category || "WRITING_ASSISTANCE"}
            onChange={(e) => setForm({ ...form, category: e.target.value as Category })}
            className="w-full h-10 px-3 rounded-lg border bg-background"
          >
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Model</label>
          <select
            value={form.model || "gpt-4o"}
            onChange={(e) => setForm({ ...form, model: e.target.value })}
            className="w-full h-10 px-3 rounded-lg border bg-background"
          >
            <option value="gpt-4o">GPT-4o</option>
            <option value="gpt-4o-mini">GPT-4o Mini</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Temperature</label>
          <Input
            type="number"
            step="0.1"
            min="0"
            max="2"
            value={form.temperature || 0.7}
            onChange={(e) => setForm({ ...form, temperature: parseFloat(e.target.value) })}
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Max Tokens</label>
          <Input
            type="number"
            step="100"
            min="100"
            max="4000"
            value={form.maxTokens || 1000}
            onChange={(e) => setForm({ ...form, maxTokens: parseInt(e.target.value) })}
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-1 block">System Prompt</label>
        <textarea
          value={form.systemPrompt || ""}
          onChange={(e) => updateForm({ systemPrompt: e.target.value })}
          placeholder="Instructions for the AI model..."
          rows={4}
          className="w-full px-3 py-2 rounded-lg border bg-background resize-none font-mono text-sm"
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-1 block">
          User Prompt Template
          <span className="font-normal text-muted-foreground ml-2">
            (use {"{{variable}}"} syntax)
          </span>
        </label>
        <textarea
          value={form.userPrompt || ""}
          onChange={(e) => updateForm({ userPrompt: e.target.value })}
          placeholder="Template with {{variables}}..."
          rows={4}
          className="w-full px-3 py-2 rounded-lg border bg-background resize-none font-mono text-sm"
        />
      </div>

      {form.variables && form.variables.length > 0 && (
        <div>
          <label className="text-sm font-medium mb-1 block">Detected Variables</label>
          <div className="flex flex-wrap gap-1">
            {form.variables.map((v) => (
              <span
                key={v}
                className="text-xs bg-domain-strategic/10 text-domain-strategic px-2 py-1 rounded"
              >
                {`{{${v}}}`}
              </span>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-2 justify-end pt-2">
        <Button variant="outline" onClick={onCancel} disabled={saving}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button onClick={onSave} disabled={saving || !form.name || !form.slug}>
          {saving ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Template
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
