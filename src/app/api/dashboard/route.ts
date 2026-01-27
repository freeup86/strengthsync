import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, ApiErrorCode } from "@/lib/api/response";
import { generatePartnershipSuggestions, type MemberStrengthData } from "@/lib/strengths/analytics";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return apiError(ApiErrorCode.UNAUTHORIZED, "Authentication required");
    }

    const organizationId = session.user.organizationId;
    const memberId = session.user.memberId;

    if (!organizationId) {
      return apiError(ApiErrorCode.BAD_REQUEST, "No organization associated with user");
    }

    // Get a week ago date
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Fetch data in parallel
    const [
      myMember,
      allMembers,
      recentShoutouts,
      shoutoutsCount,
      actionableRequests,
    ] = await Promise.all([
      // Get current user's member data with strengths
      memberId
        ? prisma.organizationMember.findUnique({
            where: { id: memberId },
            include: {
              user: true,
              strengths: {
                include: {
                  theme: {
                    include: { domain: true },
                  },
                },
                orderBy: { rank: "asc" },
              },
            },
          })
        : null,

      // Get all members with strengths for analytics
      prisma.organizationMember.findMany({
        where: {
          organizationId,
          status: "ACTIVE",
        },
        include: {
          user: {
            select: { fullName: true, jobTitle: true },
          },
          strengths: {
            include: {
              theme: {
                include: { domain: true },
              },
            },
            orderBy: { rank: "asc" },
          },
        },
      }),

      // Get recent shoutouts
      prisma.shoutout.findMany({
        where: {
          organizationId,
        },
        include: {
          giver: {
            include: { user: { select: { fullName: true } } },
          },
          receiver: {
            include: { user: { select: { fullName: true } } },
          },
          theme: {
            include: { domain: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),

      // Count shoutouts this week
      prisma.shoutout.count({
        where: {
          organizationId,
          createdAt: { gte: oneWeekAgo },
        },
      }),

      // Actionable skill requests: OPEN, not created by me, and I haven't responded to
      memberId
        ? prisma.skillRequest.findMany({
            where: {
              organizationId,
              status: "OPEN",
              creatorId: { not: memberId },
              responses: { none: { responderId: memberId } },
            },
            include: {
              creator: { include: { user: { select: { fullName: true } } } },
              theme: { include: { domain: true } },
              _count: { select: { responses: true } },
            },
            orderBy: [{ urgency: "desc" }, { createdAt: "desc" }],
            take: 5,
          })
        : [],
    ]);

    // Process my strengths
    const myStrengths = myMember?.strengths.map((s) => ({
      themeSlug: s.theme.slug,
      themeName: s.theme.name,
      domain: s.theme.domain.slug as "executing" | "influencing" | "relationship" | "strategic",
      rank: s.rank,
    })) || [];

    // Transform for partnership suggestions
    const memberStrengths: MemberStrengthData[] = [];
    for (const member of allMembers) {
      for (const strength of member.strengths) {
        memberStrengths.push({
          memberId: member.id,
          memberName: member.user.fullName || member.user.jobTitle || "Unknown",
          themeSlug: strength.theme.slug,
          themeName: strength.theme.name,
          domain: strength.theme.domain.slug as "executing" | "influencing" | "relationship" | "strategic",
          rank: strength.rank,
        });
      }
    }

    // Generate partnership suggestions
    const partnerships = generatePartnershipSuggestions(memberStrengths, 10);

    // Find a suggested partner for the current user (someone different from them)
    let suggestedPartner = null;
    if (memberId && partnerships.length > 0) {
      const partnershipForMe = partnerships.find(
        (p) => p.member1.id === memberId || p.member2.id === memberId
      );
      if (partnershipForMe) {
        const partner =
          partnershipForMe.member1.id === memberId
            ? partnershipForMe.member2
            : partnershipForMe.member1;
        suggestedPartner = {
          memberId: partner.id,
          memberName: partner.name,
          topTheme: partner.topTheme,
          reason: partnershipForMe.reason,
        };
      }
    }

    // Calculate stats
    const totalMembers = allMembers.length;
    const membersWithStrengths = allMembers.filter((m) => m.strengths.length > 0).length;

    // Format recent shoutouts
    const formattedShoutouts = recentShoutouts.map((s) => ({
      id: s.id,
      message: s.message,
      createdAt: s.createdAt.toISOString(),
      giver: { name: s.giver.user.fullName || "Unknown" },
      receiver: { name: s.receiver.user.fullName || "Unknown" },
      theme: s.theme
        ? { name: s.theme.name, domain: { slug: s.theme.domain.slug } }
        : undefined,
    }));

    // Get user points and streak
    const myPoints = myMember?.points || 0;
    const myStreak = myMember?.streak || 0;

    // Format actionable skill requests
    const formattedSkillRequests = actionableRequests.map((r) => ({
      id: r.id,
      title: r.title,
      urgency: r.urgency,
      domainNeeded: r.domainNeeded,
      creator: { name: r.creator.user.fullName || "Unknown" },
      theme: r.theme
        ? { name: r.theme.name, domain: { slug: r.theme.domain.slug } }
        : null,
      responseCount: r._count.responses,
      createdAt: r.createdAt.toISOString(),
    }));

    return apiSuccess({
      myStrengths,
      teamStats: {
        totalMembers,
        membersWithStrengths,
        shoutoutsThisWeek: shoutoutsCount,
      },
      recentShoutouts: formattedShoutouts,
      suggestedPartner,
      myPoints,
      myStreak,
      actionableSkillRequests: formattedSkillRequests,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return apiError(ApiErrorCode.INTERNAL_ERROR, "Failed to fetch dashboard data");
  }
}
