// Re-export types for convenience
export type { Domain, Theme, DomainSlug } from "@/constants/strengths-data";

// User and member types
export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  organizationId?: string;
  organizationRole?: "OWNER" | "ADMIN" | "MEMBER";
  memberId?: string;
}

export interface MemberProfile {
  id: string;
  userId: string;
  organizationId: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  status: "ACTIVE" | "INACTIVE" | "PENDING";
  user: {
    id: string;
    email: string;
    fullName: string;
    avatarUrl?: string | null;
    jobTitle?: string | null;
    department?: string | null;
    bio?: string | null;
  };
  strengths: MemberStrengthData[];
  expertiseTags: ExpertiseTag[];
  interests: string[];
  points: number;
  streak: number;
  badgesEarned: BadgeEarned[];
}

export interface MemberStrengthData {
  id: string;
  themeId: string;
  theme: {
    id: string;
    name: string;
    slug: string;
    shortDescription: string;
    domain: {
      slug: string;
      colorHex: string;
    };
  };
  rank: number;
  isTop5: boolean;
  isTop10: boolean;
  personalizedDescription?: string | null;
}

export interface ExpertiseTag {
  id: string;
  name: string;
  category?: string | null;
  endorsements: number;
}

export interface BadgeEarned {
  id: string;
  earnedAt: Date;
  badge: {
    id: string;
    name: string;
    slug: string;
    description: string;
    iconUrl: string;
    category: string;
    tier: "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";
    points: number;
  };
}

// Shoutout types
export interface ShoutoutData {
  id: string;
  message: string;
  isPublic: boolean;
  createdAt: Date;
  giver: {
    id: string;
    user: {
      fullName: string;
      avatarUrl?: string | null;
    };
  };
  receiver: {
    id: string;
    user: {
      fullName: string;
      avatarUrl?: string | null;
    };
  };
  theme?: {
    id: string;
    name: string;
    slug: string;
    domain: {
      slug: string;
      colorHex: string;
    };
  } | null;
}

// Skill request types
export interface SkillRequestData {
  id: string;
  title: string;
  description: string;
  status: "OPEN" | "IN_PROGRESS" | "FULFILLED" | "CLOSED";
  urgency: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  deadline?: Date | null;
  createdAt: Date;
  creator: {
    id: string;
    user: {
      fullName: string;
      avatarUrl?: string | null;
    };
  };
  theme?: {
    id: string;
    name: string;
    slug: string;
    domain: {
      slug: string;
      colorHex: string;
    };
  } | null;
  domainNeeded?: string | null;
  _count: {
    responses: number;
  };
}

// Feed types
export interface FeedItemData {
  id: string;
  itemType:
    | "SHOUTOUT"
    | "SKILL_REQUEST"
    | "BADGE_EARNED"
    | "CHALLENGE_STARTED"
    | "CHALLENGE_COMPLETED"
    | "NEW_MEMBER"
    | "MILESTONE"
    | "ANNOUNCEMENT";
  content: Record<string, unknown>;
  createdAt: Date;
  creator: {
    id: string;
    user: {
      fullName: string;
      avatarUrl?: string | null;
    };
  };
  shoutout?: ShoutoutData | null;
  skillRequest?: SkillRequestData | null;
  reactions: ReactionData[];
  comments: CommentData[];
  _count: {
    reactions: number;
    comments: number;
  };
}

export interface ReactionData {
  id: string;
  emoji: string;
  memberId: string;
}

export interface CommentData {
  id: string;
  content: string;
  createdAt: Date;
  author: {
    id: string;
    user: {
      fullName: string;
      avatarUrl?: string | null;
    };
  };
}

// Team analytics types
export interface TeamComposition {
  totalMembers: number;
  membersWithStrengths: number;
  domainDistribution: {
    domain: string;
    domainSlug: string;
    colorHex: string;
    count: number;
    percentage: number;
  }[];
  topThemes: {
    themeId: string;
    themeName: string;
    themeSlug: string;
    domainSlug: string;
    colorHex: string;
    count: number;
  }[];
  underrepresentedThemes: {
    themeId: string;
    themeName: string;
    themeSlug: string;
    domainSlug: string;
    colorHex: string;
    count: number;
  }[];
}

export interface PartnershipSuggestion {
  member1: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
    topThemes: string[];
  };
  member2: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
    topThemes: string[];
  };
  synergyScore: number;
  matchingPairings: {
    theme1: string;
    theme2: string;
    description: string;
    synergyType: "natural" | "complementary" | "powerful";
  }[];
}

// Challenge types
export interface ChallengeData {
  id: string;
  name: string;
  description: string;
  challengeType:
    | "STRENGTHS_BINGO"
    | "SHOUTOUT_STREAK"
    | "MENTORSHIP_MONTH"
    | "COLLABORATION_QUEST"
    | "MANIFESTO_EXERCISE"
    | "THEME_OF_THE_WEEK";
  rules: Record<string, unknown>;
  rewards: Record<string, unknown>;
  startsAt: Date;
  endsAt: Date;
  status: "UPCOMING" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  _count: {
    participants: number;
  };
}

// Leaderboard types
export interface LeaderboardEntry {
  rank: number;
  member: {
    id: string;
    user: {
      fullName: string;
      avatarUrl?: string | null;
    };
  };
  points: number;
  streak: number;
  badgeCount: number;
}
