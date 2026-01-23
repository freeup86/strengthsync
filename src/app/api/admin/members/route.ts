import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { hash } from "bcryptjs";
import { z } from "zod";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiListSuccess, apiError, ApiErrorCode, apiCreated } from "@/lib/api/response";
import { generateTempPassword } from "@/lib/utils";

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

const createMemberSchema = z.object({
  email: z.string().email("Invalid email address"),
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  jobTitle: z.string().optional(),
  department: z.string().optional(),
  role: z.enum(["MEMBER", "MANAGER", "ADMIN"]).default("MEMBER"),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return apiError(ApiErrorCode.UNAUTHORIZED, "Authentication required");
    }

    const organizationId = session.user.organizationId;
    const userRole = session.user.role;

    if (!organizationId) {
      return apiError(ApiErrorCode.BAD_REQUEST, "Organization membership required");
    }

    // Only admins can add members
    if (userRole !== "OWNER" && userRole !== "ADMIN") {
      return apiError(ApiErrorCode.FORBIDDEN, "Admin access required");
    }

    // Only owners can create admins
    const body = await request.json();
    const validation = createMemberSchema.safeParse(body);

    if (!validation.success) {
      return apiError(ApiErrorCode.VALIDATION_ERROR, "Invalid input", {
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const { email, fullName, jobTitle, department, role } = validation.data;
    const normalizedEmail = email.toLowerCase();

    // Only owners can add admins or managers
    if ((role === "ADMIN" || role === "MANAGER") && userRole !== "OWNER") {
      return apiError(ApiErrorCode.FORBIDDEN, "Only owners can add admin or manager members");
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        organizationMemberships: {
          where: { organizationId },
        },
      },
    });

    if (existingUser) {
      // User exists - check if already member of this org
      if (existingUser.organizationMemberships.length > 0) {
        return apiError(ApiErrorCode.CONFLICT, "This user is already a member of your organization");
      }

      // Add existing user to organization
      const membership = await prisma.organizationMember.create({
        data: {
          userId: existingUser.id,
          organizationId,
          role,
          status: "ACTIVE",
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              avatarUrl: true,
              jobTitle: true,
              department: true,
            },
          },
        },
      });

      console.log(`[Admin Members] Added existing user ${existingUser.email} to organization`);

      return apiCreated({
        id: membership.id,
        userId: membership.user.id,
        email: membership.user.email,
        name: membership.user.fullName,
        role: membership.role,
        status: membership.status,
        isNewUser: false,
      });
    }

    // Create new user with temp password
    const tempPassword = generateTempPassword();
    const passwordHash = await hash(tempPassword, 12);

    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          fullName,
          jobTitle: jobTitle || null,
          department: department || null,
        },
      });

      // Create membership
      const membership = await tx.organizationMember.create({
        data: {
          userId: user.id,
          organizationId,
          role,
          status: "ACTIVE",
        },
      });

      return { user, membership, tempPassword };
    });

    console.log(`[Admin Members] Created new user ${normalizedEmail} with temp password`);

    return apiCreated({
      id: result.membership.id,
      userId: result.user.id,
      email: result.user.email,
      name: result.user.fullName,
      role: result.membership.role,
      status: result.membership.status,
      isNewUser: true,
      tempPassword: result.tempPassword, // Return temp password so admin can share it
    });
  } catch (error) {
    console.error("Error creating member:", error);
    return apiError(ApiErrorCode.INTERNAL_ERROR, "Failed to create member");
  }
}
