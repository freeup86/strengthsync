import { prisma } from "@/lib/prisma";

// Rate limit configuration
export const RATE_LIMITS = {
  // Per-user limits
  user: {
    requestsPerMinute: 10,
    requestsPerHour: 100,
    requestsPerDay: 500,
  },
  // Per-organization limits
  organization: {
    requestsPerMinute: 50,
    requestsPerHour: 500,
    requestsPerDay: 5000,
  },
  // Token limits (to control costs)
  tokens: {
    perUserPerDay: 100000, // ~100k tokens per user per day
    perOrgPerDay: 1000000, // ~1M tokens per org per day
  },
} as const;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  reason?: string;
}

// Get window duration in milliseconds
function getWindowDuration(window: "minute" | "hour" | "day"): number {
  switch (window) {
    case "minute":
      return 60 * 1000;
    case "hour":
      return 60 * 60 * 1000;
    case "day":
      return 24 * 60 * 60 * 1000;
  }
}

// Check rate limit for a user. Counts are read from AIUsageLog (rather than an
// in-memory Map) so the limit holds across serverless instances, which don't
// share memory. Counts every logged request regardless of success/failure —
// mirrors the original in-memory counter, which incremented on every check
// regardless of how the underlying AI call turned out.
export async function checkUserRateLimit(
  memberId: string,
  organizationId: string
): Promise<RateLimitResult> {
  const now = Date.now();
  const minuteMs = getWindowDuration("minute");
  const hourMs = getWindowDuration("hour");
  const dayMs = getWindowDuration("day");

  const [minuteCount, hourCount, dayCount] = await Promise.all([
    prisma.aIUsageLog.count({
      where: { memberId, createdAt: { gte: new Date(now - minuteMs) } },
    }),
    prisma.aIUsageLog.count({
      where: { memberId, createdAt: { gte: new Date(now - hourMs) } },
    }),
    prisma.aIUsageLog.count({
      where: { memberId, createdAt: { gte: new Date(now - dayMs) } },
    }),
  ]);

  if (minuteCount >= RATE_LIMITS.user.requestsPerMinute) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(now + minuteMs),
      reason: "Rate limit exceeded: too many requests per minute",
    };
  }

  if (hourCount >= RATE_LIMITS.user.requestsPerHour) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(now + hourMs),
      reason: "Rate limit exceeded: too many requests per hour",
    };
  }

  if (dayCount >= RATE_LIMITS.user.requestsPerDay) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(now + dayMs),
      reason: "Rate limit exceeded: daily limit reached",
    };
  }

  // Check organization limits
  const orgResult = await checkOrganizationRateLimit(organizationId);
  if (!orgResult.allowed) {
    return orgResult;
  }

  return {
    allowed: true,
    remaining: Math.min(
      RATE_LIMITS.user.requestsPerMinute - minuteCount,
      RATE_LIMITS.user.requestsPerHour - hourCount,
      RATE_LIMITS.user.requestsPerDay - dayCount
    ),
    resetAt: new Date(now + minuteMs),
  };
}

// Check rate limit for an organization. Same AIUsageLog-backed approach as
// checkUserRateLimit above.
export async function checkOrganizationRateLimit(
  organizationId: string
): Promise<RateLimitResult> {
  const now = Date.now();
  const minuteMs = getWindowDuration("minute");
  const hourMs = getWindowDuration("hour");
  const dayMs = getWindowDuration("day");

  const [minuteCount, hourCount, dayCount] = await Promise.all([
    prisma.aIUsageLog.count({
      where: { organizationId, createdAt: { gte: new Date(now - minuteMs) } },
    }),
    prisma.aIUsageLog.count({
      where: { organizationId, createdAt: { gte: new Date(now - hourMs) } },
    }),
    prisma.aIUsageLog.count({
      where: { organizationId, createdAt: { gte: new Date(now - dayMs) } },
    }),
  ]);

  if (minuteCount >= RATE_LIMITS.organization.requestsPerMinute) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(now + minuteMs),
      reason: "Organization rate limit exceeded: too many requests per minute",
    };
  }

  if (hourCount >= RATE_LIMITS.organization.requestsPerHour) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(now + hourMs),
      reason: "Organization rate limit exceeded: too many requests per hour",
    };
  }

  if (dayCount >= RATE_LIMITS.organization.requestsPerDay) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(now + dayMs),
      reason: "Organization rate limit exceeded: daily limit reached",
    };
  }

  return {
    allowed: true,
    remaining: Math.min(
      RATE_LIMITS.organization.requestsPerMinute - minuteCount,
      RATE_LIMITS.organization.requestsPerHour - hourCount,
      RATE_LIMITS.organization.requestsPerDay - dayCount
    ),
    resetAt: new Date(now + minuteMs),
  };
}

// Check token usage for the day (from database)
export async function checkTokenLimit(
  memberId: string,
  organizationId: string
): Promise<RateLimitResult> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  // Get today's token usage from AIUsageLog
  const [userUsage, orgUsage] = await Promise.all([
    prisma.aIUsageLog.aggregate({
      where: {
        memberId,
        createdAt: { gte: startOfDay },
        success: true,
      },
      _sum: {
        totalTokens: true,
      },
    }),
    prisma.aIUsageLog.aggregate({
      where: {
        organizationId,
        createdAt: { gte: startOfDay },
        success: true,
      },
      _sum: {
        totalTokens: true,
      },
    }),
  ]);

  const userTokensUsed = userUsage._sum.totalTokens || 0;
  const orgTokensUsed = orgUsage._sum.totalTokens || 0;

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  if (userTokensUsed >= RATE_LIMITS.tokens.perUserPerDay) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: endOfDay,
      reason: "Daily token limit reached for user",
    };
  }

  if (orgTokensUsed >= RATE_LIMITS.tokens.perOrgPerDay) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: endOfDay,
      reason: "Daily token limit reached for organization",
    };
  }

  return {
    allowed: true,
    remaining: Math.min(
      RATE_LIMITS.tokens.perUserPerDay - userTokensUsed,
      RATE_LIMITS.tokens.perOrgPerDay - orgTokensUsed
    ),
    resetAt: endOfDay,
  };
}

// Combined rate limit check
export async function checkAllLimits(
  memberId: string,
  organizationId: string
): Promise<RateLimitResult> {
  // Check request rate limits
  const rateLimitResult = await checkUserRateLimit(memberId, organizationId);
  if (!rateLimitResult.allowed) {
    return rateLimitResult;
  }

  // Check token limits
  const tokenLimitResult = await checkTokenLimit(memberId, organizationId);
  if (!tokenLimitResult.allowed) {
    return tokenLimitResult;
  }

  return {
    allowed: true,
    remaining: Math.min(rateLimitResult.remaining, tokenLimitResult.remaining),
    resetAt: rateLimitResult.resetAt,
  };
}

// Get current usage statistics
export async function getUsageStats(
  memberId: string,
  organizationId: string
): Promise<{
  user: { requests: number; tokens: number };
  organization: { requests: number; tokens: number };
  limits: typeof RATE_LIMITS;
}> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [userStats, orgStats] = await Promise.all([
    prisma.aIUsageLog.aggregate({
      where: {
        memberId,
        createdAt: { gte: startOfDay },
      },
      _count: { id: true },
      _sum: { totalTokens: true },
    }),
    prisma.aIUsageLog.aggregate({
      where: {
        organizationId,
        createdAt: { gte: startOfDay },
      },
      _count: { id: true },
      _sum: { totalTokens: true },
    }),
  ]);

  return {
    user: {
      requests: userStats._count.id,
      tokens: userStats._sum.totalTokens || 0,
    },
    organization: {
      requests: orgStats._count.id,
      tokens: orgStats._sum.totalTokens || 0,
    },
    limits: RATE_LIMITS,
  };
}
