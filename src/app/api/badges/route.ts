import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, ApiErrorCode } from "@/lib/api/response";

/**
 * GET /api/badges
 * Returns all badges with the current user's earned status and progress toward unearned badges.
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

    // Get all badges
    const badges = await prisma.badge.findMany({
      orderBy: [{ category: "asc" }, { tier: "asc" }],
    });

    // Get user's earned badges
    const earnedBadges = await prisma.badgeEarned.findMany({
      where: { memberId },
      select: { badgeId: true, earnedAt: true },
    });

    const earnedMap = new Map(earnedBadges.map((e) => [e.badgeId, e.earnedAt]));

    // Gather current stats for progress calculation
    const [
      shoutoutsGiven,
      shoutoutsReceived,
      skillResponses,
      skillResponsesAccepted,
      mentorships,
      mentorshipsAsMentor,
      challengesJoined,
      challengesCompleted,
      bingoWins,
      member,
    ] = await prisma.$transaction([
      prisma.shoutout.count({ where: { giverId: memberId } }),
      prisma.shoutout.count({ where: { receiverId: memberId } }),
      prisma.skillRequestResponse.count({ where: { responderId: memberId } }),
      prisma.skillRequestResponse.count({
        where: { responderId: memberId, status: "ACCEPTED" },
      }),
      prisma.mentorship.count({
        where: {
          OR: [{ mentorId: memberId }, { menteeId: memberId }],
          status: { in: ["ACTIVE", "COMPLETED"] },
        },
      }),
      prisma.mentorship.count({
        where: { mentorId: memberId, status: "COMPLETED" },
      }),
      prisma.challengeParticipant.count({ where: { memberId } }),
      prisma.challengeParticipant.count({
        where: { memberId, completedAt: { not: null } },
      }),
      prisma.challengeParticipant.count({
        where: {
          memberId,
          completedAt: { not: null },
          challenge: { challengeType: "STRENGTHS_BINGO" },
        },
      }),
      prisma.organizationMember.findUniqueOrThrow({
        where: { id: memberId },
        include: {
          user: {
            select: { fullName: true, bio: true, jobTitle: true, avatarUrl: true },
          },
        },
      }),
    ]);

    const statsMap: Record<string, number | boolean> = {
      shoutouts_given: shoutoutsGiven,
      shoutouts_received: shoutoutsReceived,
      skill_responses: skillResponses,
      skill_responses_accepted: skillResponsesAccepted,
      mentorships,
      mentorships_as_mentor: mentorshipsAsMentor,
      challenges_joined: challengesJoined,
      challenges_completed: challengesCompleted,
      bingo_wins: bingoWins,
      points: member.points,
      streak: member.streak,
      strengths_imported: !!member.strengthsImportedAt,
      profile_complete:
        !!member.user.fullName?.trim() &&
        !!member.user.bio?.trim() &&
        !!member.user.jobTitle?.trim() &&
        !!member.user.avatarUrl?.trim(),
    };

    // Build response with progress info
    const data = badges.map((badge) => {
      const earned = earnedMap.has(badge.id);
      const earnedAt = earnedMap.get(badge.id) || null;
      const requirement = badge.requirement as { type: string; count?: number; value?: boolean };

      let progress: { current: number; target: number; percentage: number } | null = null;

      if (!earned && requirement && requirement.count) {
        const current = (statsMap[requirement.type] as number) || 0;
        const target = requirement.count;
        progress = {
          current: Math.min(current, target),
          target,
          percentage: Math.min(Math.round((current / target) * 100), 100),
        };
      }

      return {
        id: badge.id,
        name: badge.name,
        slug: badge.slug,
        description: badge.description,
        iconUrl: badge.iconUrl,
        category: badge.category,
        tier: badge.tier,
        points: badge.points,
        earned,
        earnedAt: earnedAt ? earnedAt.toISOString() : null,
        progress,
      };
    });

    return apiSuccess(data);
  } catch (error) {
    console.error("Error fetching badges:", error);
    return apiError(ApiErrorCode.INTERNAL_ERROR, "Failed to fetch badges");
  }
}
