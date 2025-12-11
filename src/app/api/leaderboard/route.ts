import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, ApiErrorCode } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return apiError(ApiErrorCode.UNAUTHORIZED, "Authentication required");
    }

    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return apiError(ApiErrorCode.BAD_REQUEST, "No organization associated with user");
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    // Get top members by points
    const members = await prisma.organizationMember.findMany({
      where: {
        organizationId,
        status: "ACTIVE",
      },
      include: {
        user: {
          select: {
            fullName: true,
            avatarUrl: true,
            jobTitle: true,
          },
        },
        badgesEarned: {
          include: {
            badge: {
              select: {
                name: true,
                iconUrl: true,
                tier: true,
              },
            },
          },
          orderBy: { earnedAt: "desc" },
          take: 5,
        },
        strengths: {
          where: { rank: { lte: 3 } },
          include: {
            theme: {
              include: {
                domain: { select: { slug: true } },
              },
            },
          },
          orderBy: { rank: "asc" },
        },
        _count: {
          select: {
            shoutoutsGiven: true,
            shoutoutsReceived: true,
          },
        },
      },
      orderBy: { points: "desc" },
      take: limit,
    });

    // Format response
    const data = members.map((m, index) => ({
      rank: index + 1,
      id: m.id,
      name: m.user.fullName || "Unknown",
      avatarUrl: m.user.avatarUrl,
      jobTitle: m.user.jobTitle,
      points: m.points,
      streak: m.streak,
      shoutoutsGiven: m._count.shoutoutsGiven,
      shoutoutsReceived: m._count.shoutoutsReceived,
      topStrengths: m.strengths.map((s) => ({
        name: s.theme.name,
        domain: s.theme.domain.slug,
      })),
      badges: m.badgesEarned.map((b) => ({
        name: b.badge.name,
        iconUrl: b.badge.iconUrl,
        tier: b.badge.tier,
      })),
    }));

    // Get current user's rank
    const memberId = session.user.memberId;
    let myRank = null;
    if (memberId) {
      const myPosition = data.findIndex((m) => m.id === memberId);
      if (myPosition >= 0) {
        myRank = myPosition + 1;
      } else {
        // User not in top list, get their actual rank
        const membersBefore = await prisma.organizationMember.count({
          where: {
            organizationId,
            status: "ACTIVE",
            points: {
              gt: (await prisma.organizationMember.findUnique({
                where: { id: memberId },
                select: { points: true },
              }))?.points || 0,
            },
          },
        });
        myRank = membersBefore + 1;
      }
    }

    return apiSuccess({
      leaderboard: data,
      myRank,
      totalMembers: await prisma.organizationMember.count({
        where: { organizationId, status: "ACTIVE" },
      }),
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return apiError(ApiErrorCode.INTERNAL_ERROR, "Failed to fetch leaderboard");
  }
}
