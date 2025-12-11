import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, ApiErrorCode } from "@/lib/api/response";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return apiError(ApiErrorCode.UNAUTHORIZED, "Authentication required");
    }

    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return apiError(ApiErrorCode.BAD_REQUEST, "No organization associated with user");
    }

    const { memberId } = await params;

    // Fetch member with all related data
    const member = await prisma.organizationMember.findFirst({
      where: {
        id: memberId,
        organizationId, // Ensure user can only view members from their org
        status: "ACTIVE",
      },
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
            avatarUrl: true,
            jobTitle: true,
            department: true,
          },
        },
        strengths: {
          include: {
            theme: {
              include: {
                domain: {
                  select: {
                    slug: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: {
            rank: "asc",
          },
        },
        shoutoutsReceived: {
          include: {
            giver: {
              include: {
                user: {
                  select: { fullName: true },
                },
              },
            },
            theme: {
              include: {
                domain: {
                  select: { slug: true },
                },
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
        },
        badgesEarned: {
          include: {
            badge: {
              select: {
                name: true,
                description: true,
                iconUrl: true,
              },
            },
          },
          orderBy: {
            earnedAt: "desc",
          },
        },
      },
    });

    if (!member) {
      return apiError(ApiErrorCode.NOT_FOUND, "Member not found");
    }

    // Format response
    const response = {
      id: member.id,
      title: member.user.jobTitle,
      department: member.user.department,
      points: member.points,
      currentStreak: member.streak,
      joinedAt: member.joinedAt.toISOString(),
      user: {
        name: member.user.fullName || "Unknown",
        email: member.user.email,
        image: member.user.avatarUrl,
      },
      strengths: member.strengths.map((s) => ({
        id: s.id,
        rank: s.rank,
        theme: {
          slug: s.theme.slug,
          name: s.theme.name,
          shortDescription: s.theme.shortDescription,
          domain: {
            slug: s.theme.domain.slug,
            name: s.theme.domain.name,
          },
        },
      })),
      shoutoutsReceived: member.shoutoutsReceived.map((s) => ({
        id: s.id,
        message: s.message,
        createdAt: s.createdAt.toISOString(),
        giver: {
          user: { name: s.giver.user.fullName || "Unknown" },
        },
        theme: s.theme
          ? {
              name: s.theme.name,
              domain: { slug: s.theme.domain.slug },
            }
          : null,
      })),
      badgesEarned: member.badgesEarned.map((b) => ({
        id: b.id,
        earnedAt: b.earnedAt.toISOString(),
        badge: {
          name: b.badge.name,
          description: b.badge.description,
          icon: b.badge.iconUrl,
        },
      })),
    };

    return apiSuccess(response);
  } catch (error) {
    console.error("Error fetching member profile:", error);
    return apiError(ApiErrorCode.INTERNAL_ERROR, "Failed to fetch member profile");
  }
}
