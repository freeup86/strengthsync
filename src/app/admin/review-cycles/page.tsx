"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/Dialog";
import {
  ClipboardList,
  Plus,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  Play,
  Trash2,
  Edit,
  Eye,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Breadcrumbs } from "@/components/ui/Breadcrumb";

interface ReviewCycle {
  id: string;
  name: string;
  description: string | null;
  cycleType: string;
  startsAt: string;
  endsAt: string;
  status: string;
  includeSelfAssessment: boolean;
  includeManagerReview: boolean;
  includePeerFeedback: boolean;
  includeStrengthsContext: boolean;
  reviewCount: number;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  DRAFT: { label: "Draft", color: "text-muted-foreground bg-muted", icon: Edit },
  ACTIVE: { label: "Active", color: "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30", icon: Play },
  COMPLETED: { label: "Completed", color: "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30", icon: CheckCircle2 },
  CANCELLED: { label: "Cancelled", color: "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30", icon: X },
};

const CYCLE_TYPES = [
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "SEMI_ANNUAL", label: "Semi-Annual" },
  { value: "ANNUAL", label: "Annual" },
  { value: "PROJECT", label: "Project-Based" },
  { value: "PROBATION", label: "Probation" },
];

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AdminReviewCyclesPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [cycles, setCycles] = useState<ReviewCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCycle, setEditingCycle] = useState<ReviewCycle | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<ReviewCycle | null>(null);
  const [activateConfirm, setActivateConfirm] = useState<ReviewCycle | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    cycleType: "QUARTERLY",
    startsAt: "",
    endsAt: "",
    includeSelfAssessment: true,
    includeManagerReview: true,
    includePeerFeedback: false,
    includeStrengthsContext: true,
  });

  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "OWNER";

  useEffect(() => {
    if (!isAdmin) {
      router.replace("/dashboard");
      return;
    }
    fetchCycles();
  }, [isAdmin, router]);

  const fetchCycles = async () => {
    try {
      const res = await fetch("/api/admin/review-cycles");
      if (res.ok) {
        const result = await res.json();
        setCycles(result.data);
      }
    } catch (err) {
      console.error("Failed to fetch cycles:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCycle = async () => {
    if (!formData.name || !formData.startsAt || !formData.endsAt) {
      setError("Please fill in all required fields");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/review-cycles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error?.message || "Failed to create cycle");
      }

      await fetchCycles();
      setShowCreateModal(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create cycle");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCycle = async () => {
    if (!editingCycle) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/review-cycles/${editingCycle.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error?.message || "Failed to update cycle");
      }

      await fetchCycles();
      setEditingCycle(null);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update cycle");
    } finally {
      setSaving(false);
    }
  };

  const handleActivateCycle = async (cycle: ReviewCycle) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/review-cycles/${cycle.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACTIVE" }),
      });

      if (res.ok) {
        await fetchCycles();
      }
    } catch (err) {
      console.error("Failed to activate:", err);
    } finally {
      setSaving(false);
      setActivateConfirm(null);
    }
  };

  const handleDeleteCycle = async (cycle: ReviewCycle) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/review-cycles/${cycle.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchCycles();
      }
    } catch (err) {
      console.error("Failed to delete:", err);
    } finally {
      setSaving(false);
      setDeleteConfirm(null);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      cycleType: "QUARTERLY",
      startsAt: "",
      endsAt: "",
      includeSelfAssessment: true,
      includeManagerReview: true,
      includePeerFeedback: false,
      includeStrengthsContext: true,
    });
    setError(null);
  };

  const openEditModal = (cycle: ReviewCycle) => {
    setFormData({
      name: cycle.name,
      description: cycle.description || "",
      cycleType: cycle.cycleType,
      startsAt: cycle.startsAt.split("T")[0],
      endsAt: cycle.endsAt.split("T")[0],
      includeSelfAssessment: cycle.includeSelfAssessment,
      includeManagerReview: cycle.includeManagerReview,
      includePeerFeedback: cycle.includePeerFeedback,
      includeStrengthsContext: cycle.includeStrengthsContext,
    });
    setEditingCycle(cycle);
  };

  if (!isAdmin) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Breadcrumbs
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Review Cycles" },
        ]}
      />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold flex items-center gap-2">
            <ClipboardList className="h-8 w-8 text-primary" />
            Review Cycles
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage performance review cycles for your organization
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Cycle
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{cycles.length}</div>
            <div className="text-sm text-muted-foreground">Total Cycles</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {cycles.filter((c) => c.status === "ACTIVE").length}
            </div>
            <div className="text-sm text-muted-foreground">Active</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-muted-foreground">
              {cycles.filter((c) => c.status === "DRAFT").length}
            </div>
            <div className="text-sm text-muted-foreground">Draft</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {cycles.filter((c) => c.status === "COMPLETED").length}
            </div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
      </div>

      {/* Cycles List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="animate-pulse flex items-center gap-4">
                  <div className="h-12 w-12 rounded bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/3" />
                    <div className="h-3 bg-muted rounded w-1/4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : cycles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Review Cycles</h3>
            <p className="text-muted-foreground mb-4">
              Create your first review cycle to start tracking performance
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Cycle
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {cycles.map((cycle) => {
            const status = STATUS_CONFIG[cycle.status] || STATUS_CONFIG.DRAFT;
            const StatusIcon = status.icon;

            return (
              <Card key={cycle.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{cycle.name}</h3>
                        <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", status.color)}>
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </span>
                      </div>
                      {cycle.description && (
                        <p className="text-sm text-muted-foreground mb-2">{cycle.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(cycle.startsAt)} - {formatDate(cycle.endsAt)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {cycle.reviewCount} reviews
                        </div>
                        <span className="px-2 py-0.5 bg-muted rounded text-xs">
                          {CYCLE_TYPES.find((t) => t.value === cycle.cycleType)?.label}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {cycle.status === "DRAFT" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(cycle)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setActivateConfirm(cycle)}
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Activate
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteConfirm(cycle)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
                      )}
                      {cycle.status === "ACTIVE" && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={`/admin/review-cycles/${cycle.id}`}>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog
        open={showCreateModal || !!editingCycle}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateModal(false);
            setEditingCycle(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCycle ? "Edit Review Cycle" : "Create Review Cycle"}
            </DialogTitle>
            <DialogDescription>
              {editingCycle
                ? "Update the review cycle settings"
                : "Set up a new performance review cycle"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {error && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Q4 2024 Review"
                className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description..."
                className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Cycle Type</label>
              <select
                value={formData.cycleType}
                onChange={(e) => setFormData({ ...formData, cycleType: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {CYCLE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Start Date <span className="text-destructive">*</span>
                </label>
                <input
                  type="date"
                  value={formData.startsAt}
                  onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  End Date <span className="text-destructive">*</span>
                </label>
                <input
                  type="date"
                  value={formData.endsAt}
                  onChange={(e) => setFormData({ ...formData, endsAt: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="text-sm font-medium">Review Components</label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.includeSelfAssessment}
                  onChange={(e) => setFormData({ ...formData, includeSelfAssessment: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Include self-assessment</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.includeManagerReview}
                  onChange={(e) => setFormData({ ...formData, includeManagerReview: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Include manager review</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.includeStrengthsContext}
                  onChange={(e) => setFormData({ ...formData, includeStrengthsContext: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Show strengths context in reviews</span>
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                setEditingCycle(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={editingCycle ? handleUpdateCycle : handleCreateCycle}
              disabled={saving}
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingCycle ? "Update Cycle" : "Create Cycle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Activate Confirmation */}
      {activateConfirm && (
        <ConfirmDialog
          open={true}
          onOpenChange={() => setActivateConfirm(null)}
          title="Activate Review Cycle"
          description={`This will create reviews for all active team members and start the "${activateConfirm.name}" review cycle. This action cannot be undone.`}
          confirmLabel="Activate"
          onConfirm={() => handleActivateCycle(activateConfirm)}
          isLoading={saving}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <ConfirmDialog
          open={true}
          onOpenChange={() => setDeleteConfirm(null)}
          title="Delete Review Cycle"
          description={`Are you sure you want to delete "${deleteConfirm.name}"? This action cannot be undone.`}
          confirmLabel="Delete"
          variant="danger"
          onConfirm={() => handleDeleteCycle(deleteConfirm)}
          isLoading={saving}
        />
      )}
    </div>
  );
}
