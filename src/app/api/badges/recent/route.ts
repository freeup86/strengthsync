import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, ApiErrorCode } from "@/lib/api/response";

/**
 * GET /api/badges/recent
 * Returns unacknowledged BadgeEarned records for the current user.
 * Used by the BadgeCelebrationProvider to show celebration modals.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return apiError(ApiErrorCode.UNAUTHORIZED, "Authentication required");
    }

    const memberId = session.user.memberId;
    if (!memberId) {
      return apiError(ApiErrorCode.BAD_REQUEST, "Organization membership required");
    }

    const recentBadges = await prisma.badgeEarned.findMany({
      where: {
        memberId,
        acknowledgedAt: null,
      },
      include: {
        badge: {
          select: {
            name: true,
            description: true,
            iconUrl: true,
            tier: true,
            category: true,
            points: true,
          },
        },
      },
      orderBy: { earnedAt: "asc" }, // Oldest first = queue order
    });

    const data = recentBadges.map((be) => ({
      id: be.id,
      badgeId: be.badgeId,
      earnedAt: be.earnedAt.toISOString(),
      badge: {
        name: be.badge.name,
        description: be.badge.description,
        iconUrl: be.badge.iconUrl,
        tier: be.badge.tier,
        category: be.badge.category,
        points: be.badge.points,
      },
    }));

    return apiSuccess(data);
  } catch (error) {
    console.error("Error fetching recent badges:", error);
    return apiError(ApiErrorCode.INTERNAL_ERROR, "Failed to fetch recent badges");
  }
}

/**
 * PATCH /api/badges/recent
 * Acknowledge a badge celebration (sets acknowledgedAt).
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return apiError(ApiErrorCode.UNAUTHORIZED, "Authentication required");
    }

    const memberId = session.user.memberId;
    if (!memberId) {
      return apiError(ApiErrorCode.BAD_REQUEST, "Organization membership required");
    }

    const body = await request.json();
    const { badgeEarnedId } = body as { badgeEarnedId: string };

    if (!badgeEarnedId) {
      return apiError(ApiErrorCode.VALIDATION_ERROR, "badgeEarnedId is required");
    }

    // Verify ownership
    const badgeEarned = await prisma.badgeEarned.findFirst({
      where: {
        id: badgeEarnedId,
        memberId,
      },
    });

    if (!badgeEarned) {
      return apiError(ApiErrorCode.NOT_FOUND, "Badge not found");
    }

    // Set acknowledgment
    await prisma.badgeEarned.update({
      where: { id: badgeEarnedId },
      data: { acknowledgedAt: new Date() },
    });

    return apiSuccess({ acknowledged: true });
  } catch (error) {
    console.error("Error acknowledging badge:", error);
    return apiError(ApiErrorCode.INTERNAL_ERROR, "Failed to acknowledge badge");
  }
}
