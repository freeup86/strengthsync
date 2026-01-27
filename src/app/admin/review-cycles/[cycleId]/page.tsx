"use client";

import { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/Avatar";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Breadcrumbs } from "@/components/ui/Breadcrumb";
import {
  ClipboardList,
  ArrowLeft,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  Play,
  Pause,
  AlertCircle,
  Loader2,
  Settings,
  FileText,
  Target,
  UserCheck,
  ChevronRight,
} from "lucide-react";

interface ReviewMember {
  id: string;
  name: string;
  avatarUrl: string | null;
  jobTitle: string | null;
}

interface Review {
  id: string;
  status: string;
  overallRating: string | null;
  member: ReviewMember;
  reviewer: { id: string; name: string } | null;
  goalCount: number;
  evidenceCount: number;
  selfAssessmentAt: string | null;
  managerAssessmentAt: string | null;
  completedAt: string | null;
}

interface ReviewCycleDetail {
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
  createdAt: string;
  reviews: Review[];
  stats: {
    totalReviews: number;
    completed: number;
    inProgress: number;
    notStarted: number;
  };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  NOT_STARTED: { label: "Not Started", color: "text-muted-foreground", bgColor: "bg-muted" },
  SELF_ASSESSMENT: { label: "Self Assessment", color: "text-amber-600 dark:text-amber-400", bgColor: "bg-amber-100 dark:bg-amber-900/30" },
  MANAGER_REVIEW: { label: "Manager Review", color: "text-blue-600 dark:text-blue-400", bgColor: "bg-blue-100 dark:bg-blue-900/30" },
  COMPLETED: { label: "Completed", color: "text-green-600 dark:text-green-400", bgColor: "bg-green-100 dark:bg-green-900/30" },
  ACKNOWLEDGED: { label: "Acknowledged", color: "text-purple-600 dark:text-purple-400", bgColor: "bg-purple-100 dark:bg-purple-900/30" },
};

const CYCLE_STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  DRAFT: { label: "Draft", color: "text-muted-foreground", bgColor: "bg-muted" },
  ACTIVE: { label: "Active", color: "text-green-600 dark:text-green-400", bgColor: "bg-green-100 dark:bg-green-900/30" },
  COMPLETED: { label: "Completed", color: "text-blue-600 dark:text-blue-400", bgColor: "bg-blue-100 dark:bg-blue-900/30" },
  CANCELLED: { label: "Cancelled", color: "text-red-600 dark:text-red-400", bgColor: "bg-red-100 dark:bg-red-900/30" },
};

const CYCLE_TYPES: Record<string, string> = {
  QUARTERLY: "Quarterly",
  SEMI_ANNUAL: "Semi-Annual",
  ANNUAL: "Annual",
  PROJECT: "Project-Based",
  PROBATION: "Probation",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ReviewCycleDetailPage({
  params,
}: {
  params: Promise<{ cycleId: string }>;
}) {
  const { cycleId } = use(params);
  const { data: session } = useSession();
  const router = useRouter();

  const [cycle, setCycle] = useState<ReviewCycleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completeConfirm, setCompleteConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "OWNER";

  useEffect(() => {
    if (!isAdmin) {
      router.replace("/dashboard");
      return;
    }
    fetchCycle();
  }, [isAdmin, router, cycleId]);

  const fetchCycle = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/review-cycles/${cycleId}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError("Review cycle not found");
        } else {
          const result = await res.json();
          setError(result.error?.message || "Failed to load review cycle");
        }
        return;
      }
      const result = await res.json();
      setCycle(result.data);
    } catch (err) {
      console.error("Failed to fetch cycle:", err);
      setError("Failed to load review cycle");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteCycle = async () => {
    if (!cycle) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/review-cycles/${cycleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      });

      if (res.ok) {
        await fetchCycle();
      }
    } catch (err) {
      console.error("Failed to complete cycle:", err);
    } finally {
      setSaving(false);
      setCompleteConfirm(false);
    }
  };

  if (!isAdmin) return null;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error || !cycle) {
    return (
      <div className="max-w-7xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Error</h3>
            <p className="text-muted-foreground mb-4">{error || "Review cycle not found"}</p>
            <Button variant="outline" asChild>
              <Link href="/admin/review-cycles">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Review Cycles
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const cycleStatus = CYCLE_STATUS_CONFIG[cycle.status] || CYCLE_STATUS_CONFIG.DRAFT;
  const completionPercentage = cycle.stats.totalReviews > 0
    ? Math.round((cycle.stats.completed / cycle.stats.totalReviews) * 100)
    : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Breadcrumbs
        items={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Review Cycles", href: "/admin/review-cycles" },
          { label: cycle.name },
        ]}
      />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/admin/review-cycles"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Review Cycles
          </Link>
          <h1 className="font-display text-3xl font-bold flex items-center gap-3">
            <ClipboardList className="h-8 w-8 text-primary" />
            {cycle.name}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", cycleStatus.bgColor, cycleStatus.color)}>
              {cycleStatus.label}
            </span>
            <span className="text-sm text-muted-foreground">
              {CYCLE_TYPES[cycle.cycleType] || cycle.cycleType}
            </span>
          </div>
        </div>
        {cycle.status === "ACTIVE" && (
          <Button
            variant="outline"
            onClick={() => setCompleteConfirm(true)}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Complete Cycle
          </Button>
        )}
      </div>

      {/* Cycle Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="font-medium">
                  {formatDate(cycle.startsAt)} - {formatDate(cycle.endsAt)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Reviews</p>
                <p className="font-medium">{cycle.stats.totalReviews} team members</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completion</p>
                <p className="font-medium">{completionPercentage}% ({cycle.stats.completed}/{cycle.stats.totalReviews})</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Review Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Progress bar */}
            <div className="h-3 bg-muted rounded-full overflow-hidden flex">
              {cycle.stats.completed > 0 && (
                <div
                  className="bg-green-500 h-full"
                  style={{ width: `${(cycle.stats.completed / cycle.stats.totalReviews) * 100}%` }}
                />
              )}
              {cycle.stats.inProgress > 0 && (
                <div
                  className="bg-amber-500 h-full"
                  style={{ width: `${(cycle.stats.inProgress / cycle.stats.totalReviews) * 100}%` }}
                />
              )}
              {cycle.stats.notStarted > 0 && (
                <div
                  className="bg-muted-foreground/30 h-full"
                  style={{ width: `${(cycle.stats.notStarted / cycle.stats.totalReviews) * 100}%` }}
                />
              )}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span>Completed: {cycle.stats.completed}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span>In Progress: {cycle.stats.inProgress}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
                <span>Not Started: {cycle.stats.notStarted}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Cycle Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={cn("p-3 rounded-lg", cycle.includeSelfAssessment ? "bg-green-100 dark:bg-green-900/30" : "bg-muted")}>
              <p className="text-sm font-medium">Self Assessment</p>
              <p className={cn("text-xs", cycle.includeSelfAssessment ? "text-green-600 dark:text-green-400" : "text-muted-foreground")}>
                {cycle.includeSelfAssessment ? "Enabled" : "Disabled"}
              </p>
            </div>
            <div className={cn("p-3 rounded-lg", cycle.includeManagerReview ? "bg-green-100 dark:bg-green-900/30" : "bg-muted")}>
              <p className="text-sm font-medium">Manager Review</p>
              <p className={cn("text-xs", cycle.includeManagerReview ? "text-green-600 dark:text-green-400" : "text-muted-foreground")}>
                {cycle.includeManagerReview ? "Enabled" : "Disabled"}
              </p>
            </div>
            <div className={cn("p-3 rounded-lg", cycle.includePeerFeedback ? "bg-green-100 dark:bg-green-900/30" : "bg-muted")}>
              <p className="text-sm font-medium">Peer Feedback</p>
              <p className={cn("text-xs", cycle.includePeerFeedback ? "text-green-600 dark:text-green-400" : "text-muted-foreground")}>
                {cycle.includePeerFeedback ? "Enabled" : "Disabled"}
              </p>
            </div>
            <div className={cn("p-3 rounded-lg", cycle.includeStrengthsContext ? "bg-green-100 dark:bg-green-900/30" : "bg-muted")}>
              <p className="text-sm font-medium">Strengths Context</p>
              <p className={cn("text-xs", cycle.includeStrengthsContext ? "text-green-600 dark:text-green-400" : "text-muted-foreground")}>
                {cycle.includeStrengthsContext ? "Enabled" : "Disabled"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Individual Reviews</CardTitle>
          <CardDescription>
            Track progress for each team member&apos;s review
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cycle.reviews.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No reviews have been created yet.
            </div>
          ) : (
            <div className="space-y-2">
              {cycle.reviews.map((review) => {
                const status = STATUS_CONFIG[review.status] || STATUS_CONFIG.NOT_STARTED;

                return (
                  <div
                    key={review.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar size="sm">
                        <AvatarImage src={review.member.avatarUrl || undefined} />
                        <AvatarFallback className="bg-primary text-primary-foreground">{getInitials(review.member.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{review.member.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {review.member.jobTitle || "Team Member"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Goals and Evidence count */}
                      <div className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Target className="h-4 w-4" />
                          {review.goalCount} goals
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          {review.evidenceCount} evidence
                        </span>
                      </div>

                      {/* Reviewer */}
                      {review.reviewer && (
                        <div className="hidden lg:flex items-center gap-1 text-sm text-muted-foreground">
                          <UserCheck className="h-4 w-4" />
                          <span>{review.reviewer.name}</span>
                        </div>
                      )}

                      {/* Status badge */}
                      <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", status.bgColor, status.color)}>
                        {status.label}
                      </span>

                      {/* View button */}
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/reviews/${review.id}`}>
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Complete Confirmation */}
      {completeConfirm && (
        <ConfirmDialog
          open={true}
          onOpenChange={() => setCompleteConfirm(false)}
          title="Complete Review Cycle"
          description={`Are you sure you want to mark "${cycle.name}" as completed? This will close the cycle and prevent further changes to reviews.`}
          confirmLabel="Complete Cycle"
          onConfirm={handleCompleteCycle}
          isLoading={saving}
        />
      )}
    </div>
  );
}
