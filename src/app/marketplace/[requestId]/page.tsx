"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { DomainIcon } from "@/components/strengths/DomainIcon";
import { ThemeBadge } from "@/components/strengths/ThemeBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  ArrowLeft,
  Clock,
  AlertCircle,
  CheckCircle2,
  MessageCircle,
  Send,
  Loader2,
  Trash2,
  XCircle,
} from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { cn } from "@/lib/utils";
import { Breadcrumbs } from "@/components/ui/Breadcrumb";
import type { DomainSlug } from "@/constants/strengths-data";

interface SkillRequest {
  id: string;
  title: string;
  description: string;
  status: string;
  urgency: string;
  deadline: string | null;
  domainNeeded: string | null;
  theme: {
    id: string;
    name: string;
    domain: {
      slug: string;
      name: string;
      colorHex: string;
    };
  } | null;
  creator: {
    id: string;
    name: string;
    avatarUrl: string | null;
    jobTitle: string | null;
    topStrengths: { name: string; domain: string }[];
  };
  responses: {
    id: string;
    message: string;
    status: string;
    responder: {
      id: string;
      name: string;
      avatarUrl: string | null;
      jobTitle: string | null;
      topStrengths: { name: string; domain: string }[];
    };
    createdAt: string;
  }[];
  isOwner: boolean;
  hasResponded: boolean;
  createdAt: string;
  updatedAt: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getUrgencyBadge(urgency: string) {
  switch (urgency) {
    case "URGENT":
      return (
        <span className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30 px-2 py-0.5 rounded-full">
          <AlertCircle className="h-3 w-3" />
          Urgent
        </span>
      );
    case "HIGH":
      return (
        <span className="flex items-center gap-1 text-xs font-medium text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/30 px-2 py-0.5 rounded-full">
          <Clock className="h-3 w-3" />
          High Priority
        </span>
      );
    case "NORMAL":
      return (
        <span className="flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
          Normal
        </span>
      );
    case "LOW":
      return (
        <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          Low Priority
        </span>
      );
    default:
      return null;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "OPEN":
      return (
        <span className="flex items-center gap-1 text-sm font-medium text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/30 px-3 py-1 rounded-full">
          <CheckCircle2 className="h-4 w-4" />
          Open
        </span>
      );
    case "IN_PROGRESS":
      return (
        <span className="flex items-center gap-1 text-sm font-medium text-domain-strategic bg-domain-strategic-light dark:bg-domain-strategic/20 dark:text-domain-strategic-muted px-3 py-1 rounded-full">
          <Clock className="h-4 w-4" />
          In Progress
        </span>
      );
    case "FULFILLED":
      return (
        <span className="flex items-center gap-1 text-sm font-medium text-domain-executing bg-domain-executing-light dark:bg-domain-executing/20 dark:text-domain-executing-muted px-3 py-1 rounded-full">
          <CheckCircle2 className="h-4 w-4" />
          Fulfilled
        </span>
      );
    case "CLOSED":
      return (
        <span className="flex items-center gap-1 text-sm font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">
          <XCircle className="h-4 w-4" />
          Closed
        </span>
      );
    default:
      return null;
  }
}

export default function RequestDetailPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = use(params);
  const router = useRouter();
  const [request, setRequest] = useState<SkillRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [responseMessage, setResponseMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    fetchRequest();
  }, [requestId]);

  const fetchRequest = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/skill-requests/${requestId}`);
      if (res.ok) {
        const result = await res.json();
        setRequest(result.data);
      } else if (res.status === 404) {
        router.push("/marketplace");
      }
    } catch (err) {
      console.error("Failed to fetch request:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!responseMessage.trim() || responseMessage.length < 10) {
      setError("Response must be at least 10 characters");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/skill-requests/${requestId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: responseMessage.trim() }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error?.message || "Failed to submit response");
        return;
      }

      setResponseMessage("");
      fetchRequest();
    } catch (err) {
      setError("An unexpected error occurred");
      console.error("Submit response error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptResponse = async (responseId: string) => {
    try {
      const res = await fetch(
        `/api/skill-requests/${requestId}/respond?responseId=${responseId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "ACCEPTED" }),
        }
      );

      if (res.ok) {
        fetchRequest();
      }
    } catch (err) {
      console.error("Accept response error:", err);
    }
  };

  const handleDeclineResponse = async (responseId: string) => {
    try {
      const res = await fetch(
        `/api/skill-requests/${requestId}/respond?responseId=${responseId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "DECLINED" }),
        }
      );

      if (res.ok) {
        fetchRequest();
      }
    } catch (err) {
      console.error("Decline response error:", err);
    }
  };

  const handleCloseRequest = async () => {
    try {
      const res = await fetch(`/api/skill-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CLOSED" }),
      });

      if (res.ok) {
        fetchRequest();
      }
    } catch (err) {
      console.error("Close request error:", err);
    }
  };

  const handleDeleteRequest = () => {
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteRequest = async () => {
    try {
      const res = await fetch(`/api/skill-requests/${requestId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/marketplace");
      }
    } catch (err) {
      console.error("Delete request error:", err);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-9 w-24" />
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-start gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <Skeleton className="h-8 w-24 rounded-full" />
            </div>
            <Skeleton className="h-px w-full" />
            <Skeleton className="h-24 w-full rounded-lg" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 space-y-3">
            <Skeleton className="h-5 w-32" />
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="max-w-7xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Request not found</p>
            <Button asChild className="mt-4">
              <Link href="/marketplace">Back to Marketplace</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canRespond =
    !request.isOwner &&
    !request.hasResponded &&
    (request.status === "OPEN" || request.status === "IN_PROGRESS");

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/marketplace">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
      </div>

      {/* Request Details */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {getStatusBadge(request.status)}
                {getUrgencyBadge(request.urgency)}
              </div>
              <CardTitle className="text-2xl">{request.title}</CardTitle>
            </div>
            {request.isOwner && (
              <div className="flex gap-2">
                {request.status !== "CLOSED" && request.status !== "FULFILLED" && (
                  <Button variant="outline" size="sm" onClick={handleCloseRequest}>
                    <XCircle className="h-4 w-4 mr-1" />
                    Close
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={handleDeleteRequest}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Creator */}
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <Avatar className="h-12 w-12">
              <AvatarImage src={request.creator.avatarUrl || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials(request.creator.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Link
                href={`/team/${request.creator.id}`}
                className="font-semibold hover:text-primary transition-colors"
              >
                {request.creator.name}
              </Link>
              {request.creator.jobTitle && (
                <p className="text-sm text-muted-foreground">
                  {request.creator.jobTitle}
                </p>
              )}
              <div className="flex gap-1 mt-1">
                {request.creator.topStrengths.slice(0, 3).map((s) => (
                  <DomainIcon key={s.name} domain={s.domain as DomainSlug} size="sm" />
                ))}
              </div>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <p>Posted {formatDate(request.createdAt)}</p>
              {request.deadline && (
                <p className="text-orange-600">
                  Deadline: {formatDate(request.deadline)}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="whitespace-pre-wrap">{request.description}</p>
          </div>

          {/* Theme/Domain needed */}
          {(request.theme || request.domainNeeded) && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground">Looking for:</span>
              {request.theme && (
                <ThemeBadge
                  themeName={request.theme.name}
                  domainSlug={request.theme.domain.slug as DomainSlug}
                />
              )}
              {request.domainNeeded && !request.theme && (
                <div className="flex items-center gap-2 px-3 py-1 bg-muted rounded-full">
                  <DomainIcon domain={request.domainNeeded as DomainSlug} size="sm" />
                  <span className="text-sm capitalize">{request.domainNeeded}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Responses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Responses ({request.responses.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {request.responses.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No responses yet. Be the first to offer help!
            </p>
          ) : (
            request.responses.map((response) => (
              <div
                key={response.id}
                className={cn(
                  "p-4 rounded-lg border",
                  response.status === "ACCEPTED"
                    ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                    : response.status === "DECLINED"
                    ? "bg-muted border-border opacity-50"
                    : "bg-card"
                )}
              >
                <div className="flex items-start gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={response.responder.avatarUrl || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(response.responder.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        href={`/team/${response.responder.id}`}
                        className="font-semibold hover:text-primary transition-colors"
                      >
                        {response.responder.name}
                      </Link>
                      {response.status === "ACCEPTED" && (
                        <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">
                          Accepted
                        </span>
                      )}
                      {response.status === "DECLINED" && (
                        <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                          Declined
                        </span>
                      )}
                    </div>
                    {response.responder.jobTitle && (
                      <p className="text-xs text-muted-foreground mb-1">
                        {response.responder.jobTitle}
                      </p>
                    )}
                    <div className="flex gap-1 mb-2">
                      {response.responder.topStrengths.slice(0, 5).map((s) => (
                        <DomainIcon key={s.name} domain={s.domain as DomainSlug} size="sm" />
                      ))}
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{response.message}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDate(response.createdAt)}
                    </p>
                  </div>
                  {request.isOwner && response.status === "OFFERED" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAcceptResponse(response.id)}
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeclineResponse(response.id)}
                      >
                        Decline
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Response Form */}
      {canRespond && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Offer to Help</CardTitle>
            <CardDescription>
              Explain how your strengths can help with this request
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmitResponse}>
            <CardContent>
              {error && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm mb-4">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}
              <textarea
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                placeholder="Describe how you can help and why you're a good match..."
                className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[100px]"
                maxLength={2000}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {responseMessage.length}/2000 characters (minimum 10)
              </p>
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                className="w-full"
                disabled={submitting || responseMessage.length < 10}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Response (+15 pts)
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {request.hasResponded && !request.isOwner && (
        <Card>
          <CardContent className="py-6 text-center">
            <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-muted-foreground">
              You&apos;ve already responded to this request
            </p>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Request"
        description="Are you sure you want to delete this skill request? This action cannot be undone and all responses will be lost."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={confirmDeleteRequest}
        variant="danger"
      />
    </div>
  );
}
