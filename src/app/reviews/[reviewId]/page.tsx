"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { ThemeBadge } from "@/components/strengths/ThemeBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  ArrowLeft,
  ClipboardList,
  Target,
  FileText,
  CheckCircle2,
  Clock,
  Users,
  Star,
  Plus,
  Sparkles,
  Trash2,
  Save,
  Loader2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DomainSlug } from "@/constants/strengths-data";

interface ReviewData {
  id: string;
  status: string;
  isSubject: boolean;
  isReviewer: boolean;
  isAdmin: boolean;
  cycle: {
    name: string;
    cycleType: string;
    startsAt: string;
    endsAt: string;
    status: string;
    includeSelfAssessment: boolean;
    includeManagerReview: boolean;
    includeStrengthsContext: boolean;
  };
  member: {
    id: string;
    name: string;
    avatarUrl: string | null;
    jobTitle: string | null;
    department: string | null;
    strengths: Array<{
      rank: number;
      name: string;
      domainSlug: string;
      domainName: string;
      shortDescription: string;
    }>;
  };
  reviewer: { id: string; name: string; avatarUrl: string | null } | null;
  selfAssessment: string | null;
  selfAssessmentAt: string | null;
  strengthsUsed: string[];
  managerAssessment: string | null;
  managerAssessmentAt: string | null;
  overallRating: string | null;
  goals: Array<{
    id: string;
    title: string;
    description: string | null;
    category: string;
    alignedThemes: string[];
    suggestedByAI: boolean;
    status: string;
    progress: number;
    selfRating: string | null;
    managerRating: string | null;
    comments: string | null;
  }>;
  evidence: Array<{
    id: string;
    evidenceType: string;
    title: string;
    description: string | null;
    date: string;
    demonstratedThemes: string[];
  }>;
}

interface GoalSuggestion {
  title: string;
  description: string;
  category: string;
  alignedTheme: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  NOT_STARTED: { label: "Not Started", color: "text-gray-600 dark:text-gray-400", bgColor: "bg-gray-100 dark:bg-gray-800" },
  SELF_ASSESSMENT: { label: "Self-Assessment", color: "text-blue-600 dark:text-blue-400", bgColor: "bg-blue-100 dark:bg-blue-900/30" },
  MANAGER_REVIEW: { label: "Manager Review", color: "text-orange-600 dark:text-orange-400", bgColor: "bg-orange-100 dark:bg-orange-900/30" },
  COMPLETED: { label: "Completed", color: "text-green-600 dark:text-green-400", bgColor: "bg-green-100 dark:bg-green-900/30" },
  ACKNOWLEDGED: { label: "Acknowledged", color: "text-purple-600 dark:text-purple-400", bgColor: "bg-purple-100 dark:bg-purple-900/30" },
};

const RATING_OPTIONS = [
  { value: "EXCEEDS_EXPECTATIONS", label: "Exceeds Expectations", color: "text-green-600 dark:text-green-400" },
  { value: "MEETS_EXPECTATIONS", label: "Meets Expectations", color: "text-blue-600 dark:text-blue-400" },
  { value: "DEVELOPING", label: "Developing", color: "text-orange-600 dark:text-orange-400" },
  { value: "NEEDS_IMPROVEMENT", label: "Needs Improvement", color: "text-red-600 dark:text-red-400" },
];

const GOAL_RATING_OPTIONS = [
  { value: "EXCEEDED", label: "Exceeded" },
  { value: "MET", label: "Met" },
  { value: "PARTIALLY_MET", label: "Partially Met" },
  { value: "NOT_MET", label: "Not Met" },
];

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function ReviewDetailPage({ params }: { params: Promise<{ reviewId: string }> }) {
  const { reviewId } = use(params);
  const router = useRouter();

  const [review, setReview] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [selfAssessment, setSelfAssessment] = useState("");
  const [strengthsUsed, setStrengthsUsed] = useState<string[]>([]);
  const [managerAssessment, setManagerAssessment] = useState("");
  const [overallRating, setOverallRating] = useState("");

  // Goals state
  const [showGoalSuggestions, setShowGoalSuggestions] = useState(false);
  const [goalSuggestions, setGoalSuggestions] = useState<GoalSuggestion[]>([]);
  const [showAddGoalForm, setShowAddGoalForm] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: "",
    description: "",
    category: "PERFORMANCE",
    alignedThemes: [] as string[],
  });
  const [addingGoal, setAddingGoal] = useState(false);

  // UI state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    strengths: true,
    selfAssessment: true,
    goals: true,
    evidence: true,
    managerReview: true,
  });

  useEffect(() => {
    fetchReview();
  }, [reviewId]);

  const fetchReview = async () => {
    try {
      const res = await fetch(`/api/reviews/${reviewId}`);
      if (!res.ok) throw new Error("Failed to fetch review");
      const result = await res.json();
      setReview(result.data);
      setSelfAssessment(result.data.selfAssessment || "");
      setStrengthsUsed(result.data.strengthsUsed || []);
      setManagerAssessment(result.data.managerAssessment || "");
      setOverallRating(result.data.overallRating || "");
    } catch (err) {
      setError("Failed to load review");
    } finally {
      setLoading(false);
    }
  };

  const fetchGoalSuggestions = async () => {
    try {
      const res = await fetch(`/api/reviews/${reviewId}/goals`);
      if (res.ok) {
        const result = await res.json();
        setGoalSuggestions(result.data.suggestions || []);
      }
    } catch (err) {
      console.error("Failed to fetch suggestions:", err);
    }
  };

  const handleSaveSelfAssessment = async () => {
    if (!review) return;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selfAssessment, strengthsUsed }),
      });

      if (!res.ok) throw new Error("Failed to save");
      await fetchReview();
    } catch (err) {
      setError("Failed to save self-assessment");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitSelfAssessment = async () => {
    if (!review) return;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selfAssessment, strengthsUsed, submitSelfAssessment: true }),
      });

      if (!res.ok) throw new Error("Failed to submit");
      await fetchReview();
    } catch (err) {
      setError("Failed to submit self-assessment");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveManagerReview = async () => {
    if (!review) return;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ managerAssessment, overallRating }),
      });

      if (!res.ok) throw new Error("Failed to save");
      await fetchReview();
    } catch (err) {
      setError("Failed to save review");
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteReview = async () => {
    if (!review || !overallRating) return;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ managerAssessment, overallRating, completeReview: true }),
      });

      if (!res.ok) throw new Error("Failed to complete");
      await fetchReview();
    } catch (err) {
      setError("Failed to complete review");
    } finally {
      setSaving(false);
    }
  };

  const handleAddGoal = async (suggestion: GoalSuggestion) => {
    try {
      const res = await fetch(`/api/reviews/${reviewId}/goals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: suggestion.title,
          description: suggestion.description,
          category: suggestion.category,
          alignedThemes: [suggestion.alignedTheme],
          suggestedByAI: true,
        }),
      });

      if (res.ok) {
        await fetchReview();
        setShowGoalSuggestions(false);
      }
    } catch (err) {
      console.error("Failed to add goal:", err);
    }
  };

  const handleAddManualGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.title.trim()) return;

    setAddingGoal(true);
    try {
      const res = await fetch(`/api/reviews/${reviewId}/goals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newGoal.title,
          description: newGoal.description || null,
          category: newGoal.category,
          alignedThemes: newGoal.alignedThemes,
          suggestedByAI: false,
        }),
      });

      if (res.ok) {
        await fetchReview();
        setShowAddGoalForm(false);
        setNewGoal({
          title: "",
          description: "",
          category: "PERFORMANCE",
          alignedThemes: [],
        });
      }
    } catch (err) {
      console.error("Failed to add goal:", err);
    } finally {
      setAddingGoal(false);
    }
  };

  const toggleNewGoalTheme = (themeName: string) => {
    setNewGoal((prev) => ({
      ...prev,
      alignedThemes: prev.alignedThemes.includes(themeName)
        ? prev.alignedThemes.filter((t) => t !== themeName)
        : [...prev.alignedThemes, themeName],
    }));
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      const res = await fetch(`/api/reviews/${reviewId}/goals?goalId=${goalId}`, {
        method: "DELETE",
      });
      if (res.ok) await fetchReview();
    } catch (err) {
      console.error("Failed to delete goal:", err);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleStrengthUsed = (themeName: string) => {
    setStrengthsUsed((prev) =>
      prev.includes(themeName) ? prev.filter((t) => t !== themeName) : [...prev, themeName]
    );
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-8 w-24 rounded-full" />
            </div>
            <Skeleton className="h-px w-full" />
            <div className="grid grid-cols-3 gap-4">
              <Skeleton className="h-16 rounded-lg" />
              <Skeleton className="h-16 rounded-lg" />
              <Skeleton className="h-16 rounded-lg" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 space-y-4">
            <Skeleton className="h-5 w-40" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="max-w-7xl mx-auto p-6 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-lg font-medium">Review not found</h2>
        <Link href="/reviews">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reviews
          </Button>
        </Link>
      </div>
    );
  }

  const status = STATUS_CONFIG[review.status] || STATUS_CONFIG.NOT_STARTED;
  const canEditSelfAssessment =
    review.isSubject &&
    review.cycle.includeSelfAssessment &&
    (review.status === "NOT_STARTED" || review.status === "SELF_ASSESSMENT");
  const canEditManagerReview =
    (review.isReviewer || review.isAdmin) &&
    review.cycle.includeManagerReview &&
    review.status === "MANAGER_REVIEW";

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/reviews" className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-flex items-center">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Reviews
          </Link>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="h-7 w-7 text-primary" />
            {review.cycle.name}
          </h1>
          <p className="text-muted-foreground">
            {review.cycle.cycleType.replace("_", " ")} •{" "}
            {new Date(review.cycle.startsAt).toLocaleDateString()} -{" "}
            {new Date(review.cycle.endsAt).toLocaleDateString()}
          </p>
        </div>
        <div className={cn("px-3 py-1.5 rounded-full text-sm font-medium", status.bgColor, status.color)}>
          {status.label}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Member Profile Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={review.member.avatarUrl || undefined} />
              <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                {getInitials(review.member.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-lg font-semibold">{review.member.name}</h2>
              <p className="text-muted-foreground">
                {review.member.jobTitle}
                {review.member.department && ` • ${review.member.department}`}
              </p>
              {review.reviewer && (
                <p className="text-sm text-muted-foreground mt-1">
                  Reviewer: {review.reviewer.name}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Strengths Context */}
      {review.cycle.includeStrengthsContext && review.member.strengths.length > 0 && (
        <Card>
          <CardHeader
            className="cursor-pointer"
            onClick={() => toggleSection("strengths")}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                Top Strengths
              </CardTitle>
              {expandedSections.strengths ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </CardHeader>
          {expandedSections.strengths && (
            <CardContent className="space-y-3">
              {review.member.strengths.slice(0, 5).map((strength) => (
                <div
                  key={strength.name}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                    canEditSelfAssessment && "cursor-pointer hover:bg-muted/50",
                    strengthsUsed.includes(strength.name) && "bg-primary/5 border-primary"
                  )}
                  onClick={() => canEditSelfAssessment && toggleStrengthUsed(strength.name)}
                >
                  <div className="flex items-center gap-2 min-w-[100px]">
                    <span className="text-sm font-medium text-muted-foreground">#{strength.rank}</span>
                    <ThemeBadge themeName={strength.name} domainSlug={strength.domainSlug as DomainSlug} />
                  </div>
                  <p className="text-sm text-muted-foreground flex-1">{strength.shortDescription}</p>
                  {canEditSelfAssessment && (
                    <div className={cn(
                      "h-5 w-5 rounded border-2 flex items-center justify-center",
                      strengthsUsed.includes(strength.name)
                        ? "bg-primary border-primary"
                        : "border-muted-foreground/30"
                    )}>
                      {strengthsUsed.includes(strength.name) && (
                        <CheckCircle2 className="h-4 w-4 text-white" />
                      )}
                    </div>
                  )}
                </div>
              ))}
              {canEditSelfAssessment && (
                <p className="text-xs text-muted-foreground">
                  Click on strengths you applied during this review period
                </p>
              )}
            </CardContent>
          )}
        </Card>
      )}

      {/* Self-Assessment */}
      {review.cycle.includeSelfAssessment && (
        <Card>
          <CardHeader
            className="cursor-pointer"
            onClick={() => toggleSection("selfAssessment")}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                Self-Assessment
                {review.selfAssessmentAt && (
                  <span className="text-xs font-normal text-muted-foreground">
                    (Submitted {new Date(review.selfAssessmentAt).toLocaleDateString()})
                  </span>
                )}
              </CardTitle>
              {expandedSections.selfAssessment ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </CardHeader>
          {expandedSections.selfAssessment && (
            <CardContent>
              {canEditSelfAssessment ? (
                <div className="space-y-4">
                  <textarea
                    value={selfAssessment}
                    onChange={(e) => setSelfAssessment(e.target.value)}
                    placeholder="Reflect on your performance, achievements, and growth during this review period..."
                    className="w-full min-h-[150px] p-3 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleSaveSelfAssessment} disabled={saving} variant="outline">
                      {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                      Save Draft
                    </Button>
                    <Button onClick={handleSubmitSelfAssessment} disabled={saving || !selfAssessment.trim()}>
                      Submit for Review
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="prose prose-sm max-w-none">
                  {review.selfAssessment ? (
                    <p className="whitespace-pre-wrap">{review.selfAssessment}</p>
                  ) : (
                    <p className="text-muted-foreground italic">No self-assessment submitted yet.</p>
                  )}
                </div>
              )}
            </CardContent>
          )}
        </Card>
      )}

      {/* Goals */}
      <Card>
        <CardHeader
          className="cursor-pointer"
          onClick={() => toggleSection("goals")}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-500" />
              Goals ({review.goals.length})
            </CardTitle>
            {expandedSections.goals ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </div>
        </CardHeader>
        {expandedSections.goals && (
          <CardContent className="space-y-4">
            {review.goals.map((goal) => (
              <div key={goal.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-medium">{goal.title}</h4>
                      {goal.suggestedByAI && (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 rounded-full">
                          <Sparkles className="h-3 w-3" />
                          AI Suggested
                        </span>
                      )}
                      <span className="text-xs px-2 py-0.5 bg-muted rounded">
                        {goal.category.replace("_", " ")}
                      </span>
                    </div>
                    {goal.description && (
                      <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>
                    )}
                    {goal.alignedThemes.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {goal.alignedThemes.map((theme) => (
                          <span key={theme} className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded">
                            {theme}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {(canEditSelfAssessment || canEditManagerReview) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteGoal(goal.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
                {/* Progress bar */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Progress</span>
                    <span>{goal.progress}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}

            {/* Add Goal Buttons */}
            {(canEditSelfAssessment || canEditManagerReview) && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddGoalForm(!showAddGoalForm);
                      setShowGoalSuggestions(false);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Manual Goal
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowGoalSuggestions(!showGoalSuggestions);
                      setShowAddGoalForm(false);
                      if (!showGoalSuggestions && goalSuggestions.length === 0) {
                        fetchGoalSuggestions();
                      }
                    }}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    AI Suggestions
                  </Button>
                </div>

                {/* Manual Goal Form */}
                {showAddGoalForm && (
                  <form onSubmit={handleAddManualGoal} className="p-4 border rounded-lg bg-muted/30 space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Goal Title <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="text"
                        value={newGoal.title}
                        onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                        placeholder="e.g., Improve presentation skills"
                        className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1 block">Description</label>
                      <textarea
                        value={newGoal.description}
                        onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                        placeholder="Describe the goal and how you plan to achieve it..."
                        className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[80px]"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1 block">Category</label>
                      <select
                        value={newGoal.category}
                        onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="PERFORMANCE">Performance</option>
                        <option value="DEVELOPMENT">Development</option>
                        <option value="CAREER">Career</option>
                        <option value="LEADERSHIP">Leadership</option>
                        <option value="COLLABORATION">Collaboration</option>
                      </select>
                    </div>

                    {review.member.strengths.length > 0 && (
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Align with Strengths (optional)
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {review.member.strengths.slice(0, 10).map((strength) => (
                            <button
                              type="button"
                              key={strength.name}
                              onClick={() => toggleNewGoalTheme(strength.name)}
                              className={cn(
                                "px-3 py-1.5 text-xs rounded-full border transition-colors",
                                newGoal.alignedThemes.includes(strength.name)
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-background hover:bg-muted"
                              )}
                            >
                              {strength.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowAddGoalForm(false)}
                        disabled={addingGoal}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={addingGoal || !newGoal.title.trim()}
                      >
                        {addingGoal ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Goal
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                )}

                {/* AI Suggestions */}
                {showGoalSuggestions && goalSuggestions.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-purple-500" />
                      Suggested Goals Based on Your Strengths
                    </p>
                    {goalSuggestions.slice(0, 5).map((suggestion, idx) => (
                      <div
                        key={idx}
                        className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => handleAddGoal(suggestion)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h5 className="font-medium text-sm">{suggestion.title}</h5>
                            <p className="text-xs text-muted-foreground mt-1">{suggestion.description}</p>
                            <span className="text-xs text-primary mt-1 inline-block">
                              Aligned with: {suggestion.alignedTheme}
                            </span>
                          </div>
                          <Plus className="h-4 w-4 text-primary flex-shrink-0" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Manager Review */}
      {review.cycle.includeManagerReview && (review.isReviewer || review.isAdmin || review.status === "COMPLETED" || review.status === "ACKNOWLEDGED") && (
        <Card>
          <CardHeader
            className="cursor-pointer"
            onClick={() => toggleSection("managerReview")}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-orange-500" />
                Manager Review
                {review.managerAssessmentAt && (
                  <span className="text-xs font-normal text-muted-foreground">
                    (Completed {new Date(review.managerAssessmentAt).toLocaleDateString()})
                  </span>
                )}
              </CardTitle>
              {expandedSections.managerReview ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </CardHeader>
          {expandedSections.managerReview && (
            <CardContent className="space-y-4">
              {canEditManagerReview ? (
                <>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Overall Rating</label>
                    <select
                      value={overallRating}
                      onChange={(e) => setOverallRating(e.target.value)}
                      className="w-full p-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Select rating...</option>
                      {RATING_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Assessment Comments</label>
                    <textarea
                      value={managerAssessment}
                      onChange={(e) => setManagerAssessment(e.target.value)}
                      placeholder="Provide feedback on performance, achievements, and areas for growth..."
                      className="w-full min-h-[150px] p-3 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveManagerReview} disabled={saving} variant="outline">
                      {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                      Save Draft
                    </Button>
                    <Button onClick={handleCompleteReview} disabled={saving || !overallRating}>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Complete Review
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  {review.overallRating && (
                    <div>
                      <span className="text-sm text-muted-foreground">Overall Rating:</span>
                      <span className={cn(
                        "ml-2 font-medium",
                        RATING_OPTIONS.find((r) => r.value === review.overallRating)?.color
                      )}>
                        {RATING_OPTIONS.find((r) => r.value === review.overallRating)?.label}
                      </span>
                    </div>
                  )}
                  {review.managerAssessment ? (
                    <p className="whitespace-pre-wrap">{review.managerAssessment}</p>
                  ) : (
                    <p className="text-muted-foreground italic">Manager review not yet completed.</p>
                  )}
                </div>
              )}
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}
