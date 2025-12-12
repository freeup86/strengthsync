import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, ApiErrorCode } from "@/lib/api/response";
import { z } from "zod";

const updateOrgSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  inviteCodeEnabled: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return apiError(ApiErrorCode.UNAUTHORIZED, "Authentication required");
    }

    const organizationId = session.user.organizationId;
    const role = session.user.role;

    if (!organizationId) {
      return apiError(ApiErrorCode.BAD_REQUEST, "No organization associated");
    }

    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        description: true,
        inviteCode: true,
        inviteCodeEnabled: true,
        settings: true,
        createdAt: true,
        _count: {
          select: { members: true },
        },
      },
    });

    if (!org) {
      return apiError(ApiErrorCode.NOT_FOUND, "Organization not found");
    }

    // Only show invite code to admins
    const isAdmin = role === "OWNER" || role === "ADMIN";

    return apiSuccess({
      ...org,
      inviteCode: isAdmin ? org.inviteCode : null,
      memberCount: org._count.members,
      canEdit: isAdmin,
    });
  } catch (error) {
    console.error("Error fetching organization:", error);
    return apiError(ApiErrorCode.INTERNAL_ERROR, "Failed to fetch organization");
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return apiError(ApiErrorCode.UNAUTHORIZED, "Authentication required");
    }

    const organizationId = session.user.organizationId;
    const role = session.user.role;

    if (!organizationId) {
      return apiError(ApiErrorCode.BAD_REQUEST, "No organization associated");
    }

    // Only admins can update organization
    if (role !== "OWNER" && role !== "ADMIN") {
      return apiError(ApiErrorCode.FORBIDDEN, "Only admins can update organization settings");
    }

    const body = await request.json();
    const validation = updateOrgSchema.safeParse(body);

    if (!validation.success) {
      return apiError(ApiErrorCode.VALIDATION_ERROR, "Invalid input", {
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const updated = await prisma.organization.update({
      where: { id: organizationId },
      data: validation.data,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        inviteCode: true,
        inviteCodeEnabled: true,
      },
    });

    return apiSuccess(updated);
  } catch (error) {
    console.error("Error updating organization:", error);
    return apiError(ApiErrorCode.INTERNAL_ERROR, "Failed to update organization");
  }
}

// Regenerate invite code
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return apiError(ApiErrorCode.UNAUTHORIZED, "Authentication required");
    }

    const organizationId = session.user.organizationId;
    const role = session.user.role;

    if (!organizationId) {
      return apiError(ApiErrorCode.BAD_REQUEST, "No organization associated");
    }

    // Only admins can regenerate invite code
    if (role !== "OWNER" && role !== "ADMIN") {
      return apiError(ApiErrorCode.FORBIDDEN, "Only admins can regenerate invite codes");
    }

    // Generate new invite code
    const newInviteCode = `${organizationId.slice(0, 4)}-${Math.random().toString(36).substring(2, 8)}`.toUpperCase();

    const updated = await prisma.organization.update({
      where: { id: organizationId },
      data: { inviteCode: newInviteCode },
      select: { inviteCode: true },
    });

    return apiSuccess({ inviteCode: updated.inviteCode });
  } catch (error) {
    console.error("Error regenerating invite code:", error);
    return apiError(ApiErrorCode.INTERNAL_ERROR, "Failed to regenerate invite code");
  }
}
