import { prisma } from "@/lib/prisma";
import { sendTeamsNotification, buildBadgeEarnedCard } from "@/lib/integrations/teams-webhook";

/**
 * Badge Evaluation Engine
 *
 * Evaluates badge criteria and awards newly earned badges after user actions.
 * Called from action endpoints (shoutouts, skill requests, mentorship, challenges).
 *
 * Design: fire-and-forget from caller's perspective.
 * The engine is wrapped in try/catch — badge evaluation errors never break the primary action.
 */

export interface NewlyEarnedBadge {
  id: string;
  badgeId: string;
  name: string;
  description: string;
  iconUrl: string;
  tier: "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";
  category: string;
  points: number;
}

// Maps action types to the badge categories that should be checked
const ACTION_CATEGORY_MAP: Record<string, string[]> = {
  shoutout_given: ["SHOUTOUT", "MILESTONE"],
  shoutout_received: ["SHOUTOUT", "MILESTONE"],
  skill_response: ["COLLABORATION", "MILESTONE"],
  skill_response_accepted: ["COLLABORATION", "MILESTONE"],
  mentorship_started: ["MENTORSHIP", "MILESTONE"],
  mentorship_completed: ["MENTORSHIP", "MILESTONE"],
  challenge_joined: ["CHALLENGE", "MILESTONE"],
  challenge_completed: ["CHALLENGE", "MILESTONE"],
  strengths_imported: ["MILESTONE"],
  profile_updated: ["MILESTONE"],
};

interface BadgeRequirement {
  type: string;
  count?: number;
  value?: boolean;
}

interface MemberStats {
  shoutouts_given: number;
  shoutouts_received: number;
  skill_responses: number;
  skill_responses_accepted: number;
  mentorships: number;
  mentorships_as_mentor: number;
  challenges_joined: number;
  challenges_completed: number;
  bingo_wins: number;
  points: number;
  streak: number;
  strengths_imported: boolean;
  profile_complete: boolean;
}

/**
 * Gather all stats for a member in a single transaction for consistency.
 */
async function gatherMemberStats(memberId: string): Promise<MemberStats> {
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
          select: {
            fullName: true,
            bio: true,
            jobTitle: true,
            avatarUrl: true,
          },
        },
      },
    }),
  ]);

  const user = member.user;
  const profileComplete =
    !!user.fullName?.trim() &&
    !!user.bio?.trim() &&
    !!user.jobTitle?.trim() &&
    !!user.avatarUrl?.trim();

  return {
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
    profile_complete: profileComplete,
  };
}

/**
 * Evaluate whether a single badge requirement is satisfied by the member's stats.
 */
function isRequirementMet(requirement: BadgeRequirement, stats: MemberStats): boolean {
  const { type } = requirement;

  // Boolean requirements (profile_complete, strengths_imported)
  if ("value" in requirement && requirement.value !== undefined) {
    if (type === "profile_complete") return stats.profile_complete === requirement.value;
    if (type === "strengths_imported") return stats.strengths_imported === requirement.value;
    return false;
  }

  // Count-based requirements
  if ("count" in requirement && requirement.count !== undefined) {
    const statValue = stats[type as keyof MemberStats];
    if (typeof statValue === "number") {
      return statValue >= requirement.count;
    }
    return false;
  }

  return false;
}

/**
 * Main engine entry point.
 * Checks all relevant badges for the given action type and awards any newly earned badges.
 *
 * Returns newly earned badges (for optional use by caller, e.g., to include in response).
 * NEVER throws — errors are logged and an empty array is returned.
 */
export async function checkAndAwardBadges(
  memberId: string,
  actionType: string
): Promise<NewlyEarnedBadge[]> {
  try {
    const categories = ACTION_CATEGORY_MAP[actionType];
    if (!categories || categories.length === 0) {
      console.warn(`[Badge Engine] Unknown action type: ${actionType}`);
      return [];
    }

    // Get member with organization info for feed items and notifications
    const member = await prisma.organizationMember.findUnique({
      where: { id: memberId },
      include: {
        user: { select: { id: true, fullName: true } },
      },
    });

    if (!member) {
      console.warn(`[Badge Engine] Member not found: ${memberId}`);
      return [];
    }

    // Get all badges in the relevant categories
    const badges = await prisma.badge.findMany({
      where: { category: { in: categories as never[] } },
    });

    if (badges.length === 0) return [];

    // Get badges already earned by this member
    const alreadyEarned = await prisma.badgeEarned.findMany({
      where: {
        memberId,
        badgeId: { in: badges.map((b) => b.id) },
      },
      select: { badgeId: true },
    });

    const earnedBadgeIds = new Set(alreadyEarned.map((e) => e.badgeId));

    // Filter to only unearneed badges
    const unearnedBadges = badges.filter((b) => !earnedBadgeIds.has(b.id));

    if (unearnedBadges.length === 0) return [];

    // Gather member stats
    const stats = await gatherMemberStats(memberId);

    // Evaluate each unearned badge
    const newlyEarned: NewlyEarnedBadge[] = [];

    for (const badge of unearnedBadges) {
      const requirement = badge.requirement as unknown as BadgeRequirement;

      if (!requirement || !requirement.type) {
        console.warn(`[Badge Engine] Badge "${badge.name}" has invalid requirement:`, requirement);
        continue;
      }

      if (isRequirementMet(requirement, stats)) {
        try {
          // Create BadgeEarned record (unique constraint prevents duplicates)
          const badgeEarned = await prisma.badgeEarned.create({
            data: {
              memberId,
              badgeId: badge.id,
            },
          });

          // Award bonus points
          await prisma.organizationMember.update({
            where: { id: memberId },
            data: { points: { increment: badge.points } },
          });

          // Create notification (uses userId, not memberId)
          await prisma.notification.create({
            data: {
              userId: member.user.id,
              type: "BADGE_EARNED",
              title: "Badge Earned!",
              message: `You earned the "${badge.name}" badge! +${badge.points} points`,
              link: "/leaderboard",
              metadata: JSON.parse(
                JSON.stringify({
                  badgeId: badge.id,
                  badgeName: badge.name,
                  badgeTier: badge.tier,
                  badgeCategory: badge.category,
                  points: badge.points,
                })
              ),
            },
          });

          // Create feed item
          await prisma.feedItem.create({
            data: {
              organizationId: member.organizationId,
              creatorId: memberId,
              itemType: "BADGE_EARNED",
              content: JSON.parse(
                JSON.stringify({
                  memberName: member.user.fullName,
                  badgeName: badge.name,
                  badgeDescription: badge.description,
                  badgeTier: badge.tier,
                  badgeCategory: badge.category,
                  badgeIconUrl: badge.iconUrl,
                  points: badge.points,
                })
              ),
            },
          });

          console.log(`[Badge Engine] Awarded: ${badge.name} to member: ${memberId}`);

          // Teams webhook: fire-and-forget badge notification
          sendTeamsNotification(
            member.organizationId,
            buildBadgeEarnedCard(
              member.user.fullName || "A team member",
              badge.name,
              badge.tier,
              badge.points
            )
          );

          newlyEarned.push({
            id: badgeEarned.id,
            badgeId: badge.id,
            name: badge.name,
            description: badge.description,
            iconUrl: badge.iconUrl,
            tier: badge.tier as NewlyEarnedBadge["tier"],
            category: badge.category,
            points: badge.points,
          });
        } catch (err) {
          // Unique constraint violation is expected if race condition — silently skip
          if (
            err instanceof Error &&
            err.message.includes("Unique constraint")
          ) {
            console.log(`[Badge Engine] Badge "${badge.name}" already earned by member ${memberId} (race condition)`);
          } else {
            console.error(`[Badge Engine] Error awarding badge "${badge.name}":`, err);
          }
        }
      }
    }

    return newlyEarned;
  } catch (error) {
    console.error("[Badge Engine] Fatal error:", error);
    return [];
  }
}
