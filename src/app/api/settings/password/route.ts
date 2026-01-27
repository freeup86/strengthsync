import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, ApiErrorCode } from "@/lib/api/response";
import { z } from "zod";
import { compare, hash } from "bcryptjs";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  });

/**
 * PATCH /api/settings/password
 *
 * Change password for authenticated user.
 * Requires current password verification.
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return apiError(ApiErrorCode.UNAUTHORIZED, "Authentication required");
    }

    const body = await request.json();
    const validation = changePasswordSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return apiError(ApiErrorCode.VALIDATION_ERROR, firstError.message, {
        errors: validation.error.errors,
      });
    }

    const { currentPassword, newPassword } = validation.data;

    // Fetch user with password hash
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, passwordHash: true },
    });

    if (!user) {
      return apiError(ApiErrorCode.NOT_FOUND, "User not found");
    }

    // Check if user has a password (might be OAuth-only user)
    if (!user.passwordHash) {
      return apiError(
        ApiErrorCode.BAD_REQUEST,
        "Your account does not have a password set. You may have signed up with a social login."
      );
    }

    // Verify current password
    const isCurrentPasswordValid = await compare(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      return apiError(ApiErrorCode.BAD_REQUEST, "Current password is incorrect");
    }

    // Hash new password
    const newPasswordHash = await hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    });

    console.log(`[Settings] Password changed for user: ${user.email}`);

    return apiSuccess({
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("[Settings Password Error]", error);
    return apiError(ApiErrorCode.INTERNAL_ERROR, "Failed to change password");
  }
}
