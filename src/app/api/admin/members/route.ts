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
    const role = session.user.role;

    if (!organizationId) {
      return apiError(ApiErrorCode.BAD_REQUEST, "Organization membership required");
    }

    // Only admins can view member management
    if (role !== "OWNER" && role !== "ADMIN") {
      return apiError(ApiErrorCode.FORBIDDEN, "Admin access required");
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const where: Record<string, unknown> = { organizationId };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.user = {
        OR: [
          { fullName: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    const total = await prisma.organizationMember.count({ where });

    const members = await prisma.organizationMember.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
            jobTitle: true,
            department: true,
            lastLoginAt: true,
            createdAt: true,
          },
        },
        strengths: {
          where: { rank: { lte: 5 } },
          include: {
            theme: { include: { domain: { select: { slug: true } } } },
          },
          orderBy: { rank: "asc" },
        },
        _count: {
          select: {
            shoutoutsReceived: true,
            shoutoutsGiven: true,
          },
        },
      },
      orderBy: [
        { role: "asc" },
        { joinedAt: "desc" },
      ],
      skip: (page - 1) * limit,
      take: limit,
    });

    const data = members.map((m) => ({
      id: m.id,
      userId: m.user.id,
      email: m.user.email,
      name: m.user.fullName,
      avatarUrl: m.user.avatarUrl,
      jobTitle: m.user.jobTitle,
      department: m.user.department,
      role: m.role,
      status: m.status,
      points: m.points,
      streak: m.streak,
      hasStrengths: m.strengths.length > 0,
      topStrengths: m.strengths.map((s) => ({
        name: s.theme.name,
        domain: s.theme.domain.slug,
      })),
      shoutoutsReceived: m._count.shoutoutsReceived,
      shoutoutsGiven: m._count.shoutoutsGiven,
      joinedAt: m.joinedAt.toISOString(),
      lastLoginAt: m.user.lastLoginAt?.toISOString(),
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
