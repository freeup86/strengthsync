import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { hash } from "bcryptjs";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, ApiErrorCode } from "@/lib/api/response";
import { generateTempPassword } from "@/lib/utils";
import { z } from "zod";

const updateMemberSchema = z.object({
  role: z.enum(["OWNER", "ADMIN", "MANAGER", "MEMBER"]).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "PENDING"]).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const { memberId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return apiError(ApiErrorCode.UNAUTHORIZED, "Authentication required");
    }

    const organizationId = session.user.organizationId;
    const currentMemberId = session.user.memberId;
    const role = session.user.role;

    if (!organizationId || !currentMemberId) {
      return apiError(ApiErrorCode.BAD_REQUEST, "Organization membership required");
    }

    // Only admins can manage members
    if (role !== "OWNER" && role !== "ADMIN") {
      return apiError(ApiErrorCode.FORBIDDEN, "Admin access required");
    }

    const member = await prisma.organizationMember.findFirst({
      where: { id: memberId, organizationId },
    });

    if (!member) {
      return apiError(ApiErrorCode.NOT_FOUND, "Member not found");
    }

    // Can't modify yourself
    if (memberId === currentMemberId) {
      return apiError(ApiErrorCode.BAD_REQUEST, "Cannot modify your own membership");
    }

    // Only owners can change roles to/from OWNER or ADMIN
    const body = await request.json();
    const validation = updateMemberSchema.safeParse(body);

    if (!validation.success) {
      return apiError(ApiErrorCode.VALIDATION_ERROR, "Invalid input", {
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const { role: newRole, status: newStatus } = validation.data;

    // Role change restrictions
    if (newRole) {
      if (role !== "OWNER") {
        // Admins can only promote to MEMBER or demote to MEMBER (not MANAGER, ADMIN, or OWNER)
        if (newRole === "OWNER" || newRole === "ADMIN" || newRole === "MANAGER") {
          return apiError(ApiErrorCode.FORBIDDEN, "Only owners can assign manager or admin roles");
        }
        if (member.role === "OWNER" || member.role === "ADMIN" || member.role === "MANAGER") {
          return apiError(ApiErrorCode.FORBIDDEN, "Only owners can modify manager or admin members");
        }
      }

      // Can't have 0 owners
      if (member.role === "OWNER" && newRole !== "OWNER") {
        const ownerCount = await prisma.organizationMember.count({
          where: { organizationId, role: "OWNER" },
        });
        if (ownerCount <= 1) {
          return apiError(ApiErrorCode.BAD_REQUEST, "Organization must have at least one owner");
        }
      }
    }

    const updated = await prisma.organizationMember.update({
      where: { id: memberId },
      data: {
        ...(newRole && { role: newRole }),
        ...(newStatus && { status: newStatus }),
      },
      include: {
        user: { select: { fullName: true, email: true } },
      },
    });

    return apiSuccess({
      id: updated.id,
      name: updated.user.fullName,
      email: updated.user.email,
      role: updated.role,
      status: updated.status,
    });
  } catch (error) {
    console.error("Error updating member:", error);
    return apiError(ApiErrorCode.INTERNAL_ERROR, "Failed to update member");
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const { memberId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return apiError(ApiErrorCode.UNAUTHORIZED, "Authentication required");
    }

    const organizationId = session.user.organizationId;
    const currentMemberId = session.user.memberId;
    const role = session.user.role;

    if (!organizationId || !currentMemberId) {
      return apiError(ApiErrorCode.BAD_REQUEST, "Organization membership required");
    }

    // Only admins can remove members
    if (role !== "OWNER" && role !== "ADMIN") {
      return apiError(ApiErrorCode.FORBIDDEN, "Admin access required");
    }

    const member = await prisma.organizationMember.findFirst({
      where: { id: memberId, organizationId },
    });

    if (!member) {
      return apiError(ApiErrorCode.NOT_FOUND, "Member not found");
    }

    // Can't remove yourself
    if (memberId === currentMemberId) {
      return apiError(ApiErrorCode.BAD_REQUEST, "Cannot remove yourself");
    }

    // Can't remove owners unless you're an owner
    if (member.role === "OWNER" && role !== "OWNER") {
      return apiError(ApiErrorCode.FORBIDDEN, "Only owners can remove other owners");
    }

    // Can't remove last owner
    if (member.role === "OWNER") {
      const ownerCount = await prisma.organizationMember.count({
        where: { organizationId, role: "OWNER" },
      });
      if (ownerCount <= 1) {
        return apiError(ApiErrorCode.BAD_REQUEST, "Cannot remove the last owner");
      }
    }

    // Remove member (cascade will handle related data)
    await prisma.organizationMember.delete({ where: { id: memberId } });

    return apiSuccess({ deleted: true });
  } catch (error) {
    console.error("Error removing member:", error);
    return apiError(ApiErrorCode.INTERNAL_ERROR, "Failed to remove member");
  }
}

// POST - Reset user password
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const { memberId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return apiError(ApiErrorCode.UNAUTHORIZED, "Authentication required");
    }

    const organizationId = session.user.organizationId;
    const currentMemberId = session.user.memberId;
    const role = session.user.role;

    if (!organizationId || !currentMemberId) {
      return apiError(ApiErrorCode.BAD_REQUEST, "Organization membership required");
    }

    // Only admins can reset passwords
    if (role !== "OWNER" && role !== "ADMIN") {
      return apiError(ApiErrorCode.FORBIDDEN, "Admin access required");
    }

    const member = await prisma.organizationMember.findFirst({
      where: { id: memberId, organizationId },
      include: {
        user: { select: { id: true, email: true, fullName: true } },
      },
    });

    if (!member) {
      return apiError(ApiErrorCode.NOT_FOUND, "Member not found");
    }

    // Can't reset your own password through admin panel
    if (memberId === currentMemberId) {
      return apiError(ApiErrorCode.BAD_REQUEST, "Cannot reset your own password here. Use profile settings.");
    }

    // Only owners can reset passwords for other admins/owners
    if ((member.role === "OWNER" || member.role === "ADMIN") && role !== "OWNER") {
      return apiError(ApiErrorCode.FORBIDDEN, "Only owners can reset admin passwords");
    }

    // Generate new temp password
    const tempPassword = generateTempPassword();
    const passwordHash = await hash(tempPassword, 12);

    // Update user's password
    await prisma.user.update({
      where: { id: member.user.id },
      data: { passwordHash },
    });

    console.log(`[Admin Members] Password reset for ${member.user.email} by ${session.user.email}`);

    return apiSuccess({
      memberId: member.id,
      email: member.user.email,
      name: member.user.fullName,
      tempPassword,
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    return apiError(ApiErrorCode.INTERNAL_ERROR, "Failed to reset password");
  }
}
