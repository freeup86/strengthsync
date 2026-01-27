"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useSession } from "next-auth/react";
import { BadgeCelebration } from "@/components/gamification/BadgeCelebration";

/**
 * BadgeCelebrationProvider
 *
 * Wraps the app to poll for unacknowledged badges and show celebration modals.
 * Processes the badge queue sequentially — one celebration at a time.
 *
 * Polls on mount + every 60 seconds when authenticated.
 * Exposes a hook for components to trigger immediate checks.
 */

interface BadgeData {
  name: string;
  description: string;
  iconUrl: string;
  tier: "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";
  category: string;
  points: number;
}

interface QueuedBadge {
  badgeEarnedId: string;
  badge: BadgeData;
}

interface BadgeCelebrationContextValue {
  checkForNewBadges: () => Promise<void>;
}

const BadgeCelebrationContext = createContext<BadgeCelebrationContextValue>({
  checkForNewBadges: async () => {},
});

export function useBadgeCelebration() {
  return useContext(BadgeCelebrationContext);
}

const POLL_INTERVAL = 60_000; // 60 seconds

export function BadgeCelebrationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const [queue, setQueue] = useState<QueuedBadge[]>([]);
  const [currentBadge, setCurrentBadge] = useState<QueuedBadge | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const seenIds = useRef(new Set<string>());
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  const isAuthenticated = status === "authenticated" && !!session?.user?.memberId;

  const fetchRecentBadges = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const res = await fetch("/api/badges/recent");
      if (!res.ok) return;

      const result = await res.json();
      const badges: { id: string; badge: BadgeData }[] = result.data || [];

      // Filter out already-seen badges (deduplication)
      const newBadges: QueuedBadge[] = [];
      for (const item of badges) {
        if (!seenIds.current.has(item.id)) {
          seenIds.current.add(item.id);
          newBadges.push({
            badgeEarnedId: item.id,
            badge: item.badge,
          });
        }
      }

      if (newBadges.length > 0) {
        setQueue((prev) => [...prev, ...newBadges]);
      }
    } catch (err) {
      // Silent fail — badge celebration is non-critical
      console.error("[BadgeCelebration] Poll error:", err);
    }
  }, [isAuthenticated]);

  // Show next badge from queue
  useEffect(() => {
    if (!isOpen && queue.length > 0 && !currentBadge) {
      const next = queue[0];
      setCurrentBadge(next);
      setQueue((prev) => prev.slice(1));
      setIsOpen(true);
    }
  }, [queue, isOpen, currentBadge]);

  // Handle modal close
  const handleClose = useCallback(async () => {
    if (currentBadge) {
      // Acknowledge the badge (fire-and-forget)
      fetch("/api/badges/recent", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ badgeEarnedId: currentBadge.badgeEarnedId }),
      }).catch((err) =>
        console.error("[BadgeCelebration] Acknowledge error:", err)
      );
    }

    setIsOpen(false);
    // Brief delay before showing next badge
    setTimeout(() => {
      setCurrentBadge(null);
    }, 500);
  }, [currentBadge]);

  // Poll on mount + interval when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    // Initial fetch (with a slight delay to avoid blocking initial render)
    const initialTimer = setTimeout(() => {
      fetchRecentBadges();
    }, 2000);

    // Set up polling interval
    pollTimerRef.current = setInterval(fetchRecentBadges, POLL_INTERVAL);

    return () => {
      clearTimeout(initialTimer);
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, [isAuthenticated, fetchRecentBadges]);

  const contextValue: BadgeCelebrationContextValue = {
    checkForNewBadges: fetchRecentBadges,
  };

  return (
    <BadgeCelebrationContext.Provider value={contextValue}>
      {children}
      <BadgeCelebration
        badge={currentBadge?.badge || null}
        isOpen={isOpen}
        onClose={handleClose}
      />
    </BadgeCelebrationContext.Provider>
  );
}
