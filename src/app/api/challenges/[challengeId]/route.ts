import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, ApiErrorCode } from "@/lib/api/response";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ challengeId: string }> }
) {
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

    const { challengeId } = await params;

    const challenge = await prisma.teamChallenge.findFirst({
      where: {
        id: challengeId,
        organizationId,
      },
      include: {
        participants: {
          include: {
            member: {
              include: {
                user: { select: { fullName: true, avatarUrl: true } },
                strengths: {
                  where: { rank: { lte: 5 } },
                  include: {
                    theme: {
                      include: { domain: { select: { slug: true } } },
                    },
                  },
                  orderBy: { rank: "asc" },
                },
              },
            },
          },
          orderBy: { score: "desc" },
        },
      },
    });

    if (!challenge) {
      return apiError(ApiErrorCode.NOT_FOUND, "Challenge not found");
    }

    // Find current user's participation
    const myParticipation = memberId
      ? challenge.participants.find((p) => p.memberId === memberId)
      : null;

    return apiSuccess({
      id: challenge.id,
      name: challenge.name,
      description: challenge.description,
      challengeType: challenge.challengeType,
      status: challenge.status,
      startsAt: challenge.startsAt.toISOString(),
      endsAt: challenge.endsAt.toISOString(),
      rules: challenge.rules,
      rewards: challenge.rewards,
      participants: challenge.participants.map((p) => ({
        id: p.memberId,
        name: p.member.user.fullName,
        avatarUrl: p.member.user.avatarUrl,
        score: p.score,
        progress: p.progress,
        completedAt: p.completedAt?.toISOString(),
        topStrengths: p.member.strengths.map((s) => ({
          name: s.theme.name,
          domain: s.theme.domain.slug,
        })),
      })),
      isParticipating: !!myParticipation,
      myProgress: myParticipation?.progress || null,
      myScore: myParticipation?.score || 0,
    });
  } catch (error) {
    console.error("Error fetching challenge:", error);
    return apiError(ApiErrorCode.INTERNAL_ERROR, "Failed to fetch challenge");
  }
}
