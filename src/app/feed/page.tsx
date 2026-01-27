"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { DomainIcon } from "@/components/strengths/DomainIcon";
import { ThemeBadge } from "@/components/strengths/ThemeBadge";
import {
  Rss,
  RefreshCw,
  Heart,
  PartyPopper,
  HandHeart,
  MessageCircle,
  Send,
  Trophy,
  Users,
  ShoppingBag,
  Award,
  Megaphone,
  Clock,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import type { DomainSlug } from "@/constants/strengths-data";

interface FeedItem {
  id: string;
  type: string;
  content: Record<string, unknown>;
  createdAt: string;
  creator: {
    id: string;
    name: string;
    avatarUrl: string | null;
    jobTitle: string | null;
  };
  shoutout: {
    message: string;
    receiver: {
      id: string;
      name: string;
      avatarUrl: string | null;
    };
    theme: {
      name: string;
      domain: string;
    } | null;
  } | null;
  skillRequest: {
    id: string;
    title: string;
    status: string;
    urgency: string;
    responseCount: number;
    theme: {
      name: string;
      domain: string;
    } | null;
  } | null;
  challenge: {
    name: string;
    type: string;
    status: string;
  } | null;
  reactions: {
    count: number;
    items: {
      id: string;
      emoji: string;
      memberName: string;
    }[];
    myReaction: string | null;
  };
  comments: {
    count: number;
    items: {
      id: string;
      content: string;
      author: {
        id: string;
        name: string;
        avatarUrl: string | null;
      };
      createdAt: string;
    }[];
  };
  isOwner: boolean;
}

const EMOJI_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  like: Heart,
  celebrate: PartyPopper,
  clap: HandHeart,
};

const EMOJI_LABELS: Record<string, string> = {
  like: "Like",
  celebrate: "Celebrate",
  clap: "Applaud",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getFeedTypeBadge(type: string) {
  const badges: Record<string, { icon: React.ReactNode; label: string; className: string }> = {
    SHOUTOUT: {
      icon: <Award className="h-3.5 w-3.5" />,
      label: "Shoutout",
      className: "bg-domain-influencing-light text-domain-influencing-dark dark:bg-domain-influencing/20 dark:text-domain-influencing",
    },
    SKILL_REQUEST: {
      icon: <ShoppingBag className="h-3.5 w-3.5" />,
      label: "Skill Request",
      className: "bg-domain-strategic-light text-domain-strategic-dark dark:bg-domain-strategic/20 dark:text-domain-strategic",
    },
    BADGE_EARNED: {
      icon: <Trophy className="h-3.5 w-3.5" />,
      label: "Badge",
      className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    },
    CHALLENGE_STARTED: {
      icon: <Trophy className="h-3.5 w-3.5" />,
      label: "Challenge",
      className: "bg-domain-executing-light text-domain-executing-dark dark:bg-domain-executing/20 dark:text-domain-executing",
    },
    CHALLENGE_COMPLETED: {
      icon: <Trophy className="h-3.5 w-3.5" />,
      label: "Challenge",
      className: "bg-domain-executing-light text-domain-executing-dark dark:bg-domain-executing/20 dark:text-domain-executing",
    },
    NEW_MEMBER: {
      icon: <Users className="h-3.5 w-3.5" />,
      label: "New Member",
      className: "bg-domain-relationship-light text-domain-relationship-dark dark:bg-domain-relationship/20 dark:text-domain-relationship",
    },
    ANNOUNCEMENT: {
      icon: <Megaphone className="h-3.5 w-3.5" />,
      label: "Announcement",
      className: "bg-primary/10 text-primary dark:bg-primary/20",
    },
  };

  const badge = badges[type];
  if (!badge) return null;

  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", badge.className)}>
      {badge.icon}
      {badge.label}
    </span>
  );
}

function getFeedItemIcon(type: string) {
  switch (type) {
    case "SHOUTOUT":
      return <Award className="h-5 w-5 text-domain-influencing" />;
    case "SKILL_REQUEST":
      return <ShoppingBag className="h-5 w-5 text-domain-strategic" />;
    case "BADGE_EARNED":
      return <Trophy className="h-5 w-5 text-yellow-500" />;
    case "CHALLENGE_STARTED":
    case "CHALLENGE_COMPLETED":
      return <Trophy className="h-5 w-5 text-domain-executing" />;
    case "NEW_MEMBER":
      return <Users className="h-5 w-5 text-domain-relationship" />;
    case "ANNOUNCEMENT":
      return <Megaphone className="h-5 w-5 text-primary" />;
    default:
      return <Rss className="h-5 w-5 text-muted-foreground" />;
  }
}

function FeedItemCard({ item, onReact }: { item: FeedItem; onReact: (emoji: string) => void }) {
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [comments, setComments] = useState(item.comments.items);
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  const loadAllComments = async () => {
    if (comments.length >= item.comments.count) return;

    setLoadingComments(true);
    try {
      const res = await fetch(`/api/feed/${item.id}/comments`);
      if (res.ok) {
        const result = await res.json();
        setComments(result.data || []);
      }
    } catch (err) {
      console.error("Failed to load comments:", err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/feed/${item.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentInput.trim() }),
      });

      if (res.ok) {
        const result = await res.json();
        setComments([...comments, result.data]);
        setCommentInput("");
      }
    } catch (err) {
      console.error("Failed to submit comment:", err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="pt-6">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src={item.creator.avatarUrl || undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getInitials(item.creator.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/team/${item.creator.id}`}
                className="font-semibold hover:text-primary transition-colors"
              >
                {item.creator.name}
              </Link>
              {getFeedTypeBadge(item.type)}
            </div>
            <p className="text-xs text-muted-foreground">
              {item.creator.jobTitle && `${item.creator.jobTitle} · `}
              {formatDate(item.createdAt)}
            </p>
          </div>
        </div>

        {/* Content based on type */}
        {item.type === "SHOUTOUT" && item.shoutout && (
          <div className="space-y-3">
            <p className="text-sm">
              <span className="text-muted-foreground">Gave a shoutout to </span>
              <Link
                href={`/team/${item.shoutout.receiver.id}`}
                className="font-semibold hover:text-primary"
              >
                {item.shoutout.receiver.name}
              </Link>
            </p>
            <div className="p-4 bg-domain-influencing-light dark:bg-domain-influencing/20 rounded-lg border-l-4 border-domain-influencing">
              <p className="italic">&ldquo;{item.shoutout.message}&rdquo;</p>
              {item.shoutout.theme && (
                <div className="mt-2">
                  <ThemeBadge
                    themeName={item.shoutout.theme.name}
                    domainSlug={item.shoutout.theme.domain as DomainSlug}
                    size="sm"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {item.type === "SKILL_REQUEST" && item.skillRequest && (
          <Link href={`/marketplace/${item.skillRequest.id}`} className="block">
            <div className="p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full",
                  item.skillRequest.status === "OPEN" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" :
                  item.skillRequest.status === "IN_PROGRESS" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" :
                  "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400"
                )}>
                  {item.skillRequest.status.replace("_", " ")}
                </span>
                {item.skillRequest.urgency === "URGENT" && (
                  <span className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Urgent
                  </span>
                )}
              </div>
              <h4 className="font-semibold">{item.skillRequest.title}</h4>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MessageCircle className="h-3 w-3" />
                  {item.skillRequest.responseCount} responses
                </span>
                {item.skillRequest.theme && (
                  <ThemeBadge
                    themeName={item.skillRequest.theme.name}
                    domainSlug={item.skillRequest.theme.domain as DomainSlug}
                    size="sm"
                  />
                )}
              </div>
            </div>
          </Link>
        )}

        {(item.type === "CHALLENGE_STARTED" || item.type === "CHALLENGE_COMPLETED") && item.challenge && (
          <div className="p-4 bg-domain-executing-light rounded-lg">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-domain-executing" />
              <span className="font-semibold">{item.challenge.name}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {item.type === "CHALLENGE_STARTED" ? "Challenge started!" : "Challenge completed!"}
            </p>
          </div>
        )}

        {item.type === "BADGE_EARNED" && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <span className="font-semibold">
                Earned a new badge: {(item.content as { badgeName?: string })?.badgeName}
              </span>
            </div>
          </div>
        )}

        {item.type === "NEW_MEMBER" && (
          <div className="p-4 bg-domain-relationship-light rounded-lg">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-domain-relationship" />
              <span className="font-semibold">
                {item.creator.name} joined the team!
              </span>
            </div>
          </div>
        )}

        {item.type === "ANNOUNCEMENT" && (
          <div className="p-4 bg-primary/5 rounded-lg border-l-4 border-primary">
            <div className="flex items-center gap-2 mb-2">
              <Megaphone className="h-5 w-5 text-primary" />
              <span className="font-semibold">Announcement</span>
            </div>
            <p className="text-sm">{(item.content as { message?: string })?.message}</p>
          </div>
        )}

        {/* Reactions */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t">
          <div className="flex items-center gap-1">
            {Object.entries(EMOJI_ICONS).map(([emoji, Icon]) => (
              <button
                key={emoji}
                onClick={() => onReact(emoji)}
                className={cn(
                  "p-2 rounded-full transition-colors",
                  item.reactions.myReaction === emoji
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted"
                )}
                title={EMOJI_LABELS[emoji]}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
          {item.reactions.count > 0 && (
            <span className="text-xs text-muted-foreground">
              {item.reactions.count}
            </span>
          )}
          <div className="ml-auto">
            <button
              onClick={() => {
                setShowComments(!showComments);
                if (!showComments && item.comments.count > comments.length) {
                  loadAllComments();
                }
              }}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              {item.comments.count > 0 ? item.comments.count : "Comment"}
            </button>
          </div>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-4 space-y-4">
            {loadingComments && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}

            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={comment.author.avatarUrl || undefined} />
                  <AvatarFallback className="text-xs bg-muted dark:bg-muted/50">
                    {getInitials(comment.author.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 bg-muted/50 rounded-lg p-2">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/team/${comment.author.id}`}
                      className="text-sm font-semibold hover:text-primary"
                    >
                      {comment.author.name}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm mt-1">{comment.content}</p>
                </div>
              </div>
            ))}

            {/* Comment Input */}
            <form onSubmit={handleSubmitComment} className="flex gap-2">
              <input
                type="text"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 px-3 py-2 text-sm border rounded-full bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <Button
                type="submit"
                size="sm"
                disabled={!commentInput.trim() || submittingComment}
              >
                {submittingComment ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function FeedPage() {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  useEffect(() => {
    fetchFeed();
  }, [typeFilter]);

  const fetchFeed = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter) {
        params.append("type", typeFilter);
      }
      params.append("limit", "30");

      const res = await fetch(`/api/feed?${params}`);
      if (res.ok) {
        const result = await res.json();
        setFeedItems(result.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch feed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReact = async (itemId: string, emoji: string) => {
    const item = feedItems.find((i) => i.id === itemId);
    if (!item) return;

    // Optimistic update
    const wasReacted = item.reactions.myReaction === emoji;

    setFeedItems((items) =>
      items.map((i) =>
        i.id === itemId
          ? {
              ...i,
              reactions: {
                ...i.reactions,
                myReaction: wasReacted ? null : emoji,
                count: wasReacted ? i.reactions.count - 1 : i.reactions.count + (i.reactions.myReaction ? 0 : 1),
              },
            }
          : i
      )
    );

    try {
      if (wasReacted) {
        await fetch(`/api/feed/${itemId}/reactions`, { method: "DELETE" });
      } else {
        await fetch(`/api/feed/${itemId}/reactions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emoji }),
        });
      }
    } catch (err) {
      console.error("Failed to react:", err);
      // Revert optimistic update
      fetchFeed();
    }
  };

  const FEED_TYPES = [
    { value: null, label: "All" },
    { value: "SHOUTOUT", label: "Shoutouts" },
    { value: "SKILL_REQUEST", label: "Skill Requests" },
    { value: "BADGE_EARNED", label: "Badges" },
    { value: "CHALLENGE_STARTED", label: "Challenges" },
    { value: "NEW_MEMBER", label: "New Members" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold flex items-center gap-2">
            <Rss className="h-8 w-8 text-primary" />
            Activity Feed
          </h1>
          <p className="text-muted-foreground mt-1">
            See what&apos;s happening with your team
          </p>
        </div>
        <Button variant="outline" onClick={fetchFeed}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {FEED_TYPES.map((type) => (
          <button
            key={type.value || "all"}
            onClick={() => setTypeFilter(type.value)}
            className={cn(
              "px-3 py-1 text-sm rounded-full transition-colors",
              typeFilter === type.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80"
            )}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* Feed Items */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="py-6">
                <div className="animate-pulse space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-muted" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-muted rounded w-1/4" />
                      <div className="h-3 bg-muted rounded w-1/3" />
                    </div>
                  </div>
                  <div className="h-24 bg-muted rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : feedItems.length > 0 ? (
        <div className="space-y-4">
          {feedItems.map((item, index) => (
            <ScrollReveal key={item.id} animation="fade-up" delay={index * 70} duration={350} once>
              <FeedItemCard
                item={item}
                onReact={(emoji) => handleReact(item.id, emoji)}
              />
            </ScrollReveal>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Rss className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold">No Activity Yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Be the first to share something with your team
            </p>
            <div className="flex gap-2 justify-center mt-4">
              <Button asChild>
                <Link href="/shoutouts/create">Give a Shoutout</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/marketplace/create">Request Help</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
