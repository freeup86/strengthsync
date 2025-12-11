import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiListSuccess, apiError, ApiErrorCode } from "@/lib/api/response";

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
    const search = searchParams.get("search") || "";
    const domain = searchParams.get("domain");
    const theme = searchParams.get("theme");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    // Build where clause
    const where: Record<string, unknown> = {
      organizationId,
      status: "ACTIVE",
    };

    // Search by name
    if (search) {
      where.user = {
        fullName: {
          contains: search,
          mode: "insensitive",
        },
      };
    }

    // Filter by theme
    if (theme) {
      where.strengths = {
        some: {
          theme: { slug: theme },
          rank: { lte: 10 }, // Only consider top 10
        },
      };
    }

    // Filter by domain
    if (domain) {
      where.strengths = {
        ...(where.strengths as object || {}),
        some: {
          ...(where.strengths as { some?: object })?.some || {},
          theme: {
            domain: { slug: domain },
          },
          rank: { lte: 10 },
        },
      };
    }

    // Get total count
    const total = await prisma.organizationMember.count({ where });

    // Get members
    const members = await prisma.organizationMember.findMany({
      where,
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
          where: { rank: { lte: 5 } },
          include: {
            theme: {
              include: {
                domain: {
                  select: { slug: true, name: true },
                },
              },
            },
          },
          orderBy: { rank: "asc" },
        },
      },
      orderBy: [
        { user: { fullName: "asc" } },
      ],
      skip: (page - 1) * limit,
      take: limit,
    });

    // Format response
    const data = members.map((m) => ({
      id: m.id,
      name: m.user.fullName || "Unknown",
      email: m.user.email,
      avatarUrl: m.user.avatarUrl,
      jobTitle: m.user.jobTitle,
      department: m.user.department,
      points: m.points,
      topStrengths: m.strengths.map((s) => ({
        rank: s.rank,
        themeName: s.theme.name,
        themeSlug: s.theme.slug,
        domain: s.theme.domain.slug,
      })),
    }));

    return apiListSuccess(data, {
      page,
      limit,
      total,
      hasMore: page * limit < total,
    });
  } catch (error) {
    console.error("Error fetching members:", error);
    return apiError(ApiErrorCode.INTERNAL_ERROR, "Failed to fetch members");
  }
}
