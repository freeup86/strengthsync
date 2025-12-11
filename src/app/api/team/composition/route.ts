import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, ApiErrorCode } from "@/lib/api/response";
import {
  calculateDomainComposition,
  calculateThemeFrequency,
  type MemberStrengthData,
} from "@/lib/strengths/analytics";

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

    // Get all members with their strengths
    const members = await prisma.organizationMember.findMany({
      where: {
        organizationId,
        status: "ACTIVE",
      },
      include: {
        user: {
          select: {
            fullName: true,
            jobTitle: true,
          },
        },
        strengths: {
          include: {
            theme: {
              include: {
                domain: true,
              },
            },
          },
          orderBy: {
            rank: "asc",
          },
        },
      },
    });

    // Transform to analytics format
    const memberStrengths: MemberStrengthData[] = [];

    for (const member of members) {
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

    const totalMembers = members.length;
    const domainComposition = calculateDomainComposition(memberStrengths, totalMembers);
    const themeFrequency = calculateThemeFrequency(memberStrengths, totalMembers, 10);

    // Get top themes (most common in team)
    const topThemes = themeFrequency.slice(0, 10);

    // Get members with strengths uploaded
    const membersWithStrengths = members.filter((m) => m.strengths.length > 0).length;

    return apiSuccess({
      totalMembers,
      membersWithStrengths,
      domainComposition,
      topThemes,
      themeFrequency,
    });
  } catch (error) {
    console.error("Error fetching team composition:", error);
    return apiError(ApiErrorCode.INTERNAL_ERROR, "Failed to fetch team composition");
  }
}
