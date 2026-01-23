import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, ApiErrorCode } from "@/lib/api/response";
import { canViewFullProfile } from "@/lib/auth/permissions";
import type { StrengthBlend, ApplySection } from "@/types";

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

    // Check permission level for profile viewing
    const isFullProfile = canViewFullProfile({
      viewerRole: session.user.role,
      viewerMemberId: session.user.memberId,
      targetMemberId: memberId,
    });

    // Build query based on access level
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
          where: isFullProfile ? undefined : { rank: { lte: 5 } }, // Basic view: top 5 only
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
      },
    });

    if (!member) {
      return apiError(ApiErrorCode.NOT_FOUND, "Member not found");
    }

    // For full profile, fetch shoutouts and badges in separate queries
    // This avoids complex type assertions with conditional includes
    let shoutoutsReceived: Array<{
      id: string;
      message: string;
      createdAt: string;
      giver: { user: { name: string } };
      theme: { name: string; domain: { slug: string } } | null;
    }> = [];

    let badgesEarned: Array<{
      id: string;
      earnedAt: string;
      badge: { name: string; description: string; icon: string };
    }> = [];

    if (isFullProfile) {
      // Fetch shoutouts received
      const shoutouts = await prisma.shoutout.findMany({
        where: { receiverId: memberId },
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
        orderBy: { createdAt: "desc" },
        take: 10,
      });

      shoutoutsReceived = shoutouts.map((s) => ({
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
      }));

      // Fetch badges earned
      const badges = await prisma.badgeEarned.findMany({
        where: { memberId },
        include: {
          badge: {
            select: {
              name: true,
              description: true,
              iconUrl: true,
            },
          },
        },
        orderBy: { earnedAt: "desc" },
      });

      badgesEarned = badges.map((b) => ({
        id: b.id,
        earnedAt: b.earnedAt.toISOString(),
        badge: {
          name: b.badge.name,
          description: b.badge.description,
          icon: b.badge.iconUrl,
        },
      }));
    }

    const response = {
      id: member.id,
      title: member.user.jobTitle,
      department: member.user.department,
      // Include stats only for full profile view
      ...(isFullProfile
        ? {
            points: member.points,
            currentStreak: member.streak,
            joinedAt: member.joinedAt.toISOString(),
          }
        : {}),
      isFullProfile, // Flag for frontend to know what level of access
      user: {
        name: member.user.fullName || "Unknown",
        email: member.user.email,
        image: member.user.avatarUrl,
      },
      strengths: member.strengths.map((s) => ({
        id: s.id,
        rank: s.rank,
        // Include personalized data only for full profile view
        ...(isFullProfile
          ? {
              personalizedDescription: s.personalizedDescription,
              personalizedInsights: s.personalizedInsights || [],
              strengthBlends: s.strengthBlends as StrengthBlend[] | null,
              applySection: s.applySection as ApplySection | null,
            }
          : {}),
        theme: {
          slug: s.theme.slug,
          name: s.theme.name,
          shortDescription: s.theme.shortDescription,
          // Include detailed theme info only for full profile view
          ...(isFullProfile
            ? {
                fullDescription: s.theme.fullDescription,
                blindSpots: s.theme.blindSpots,
                actionItems: s.theme.actionItems,
                worksWith: s.theme.worksWith,
              }
            : {}),
          domain: {
            slug: s.theme.domain.slug,
            name: s.theme.domain.name,
          },
        },
      })),
      shoutoutsReceived,
      badgesEarned,
    };

    return apiSuccess(response);
  } catch (error) {
    console.error("Error fetching member profile:", error);
    return apiError(ApiErrorCode.INTERNAL_ERROR, "Failed to fetch member profile");
  }
}
