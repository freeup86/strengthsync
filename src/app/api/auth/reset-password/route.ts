import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, ApiErrorCode } from "@/lib/api/response";
import { z } from "zod";
import { hash } from "bcryptjs";

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

// Verify token validity
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return apiError(ApiErrorCode.BAD_REQUEST, "Reset token is required");
    }

    // Find user with valid token
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: { gt: new Date() },
      },
      select: { id: true, email: true, fullName: true },
    });

    if (!user) {
      return apiError(ApiErrorCode.BAD_REQUEST, "Invalid or expired reset token");
    }

    return apiSuccess({
      valid: true,
      email: user.email,
      name: user.fullName,
    });
  } catch (error) {
    console.error("[Reset Password Verify Error]", error);
    return apiError(ApiErrorCode.INTERNAL_ERROR, "Failed to verify token");
  }
}

// Reset password with token
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = resetPasswordSchema.safeParse(body);

    if (!validation.success) {
      return apiError(ApiErrorCode.VALIDATION_ERROR, "Invalid input", {
        errors: validation.error.errors,
      });
    }

    const { token, password } = validation.data;

    // Find user with valid token
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: { gt: new Date() },
      },
    });

    if (!user) {
      return apiError(ApiErrorCode.BAD_REQUEST, "Invalid or expired reset token");
    }

    // Hash new password
    const passwordHash = await hash(password, 12);

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    console.log(`[Reset Password] Password reset successful for user: ${user.email}`);

    return apiSuccess({
      message: "Password reset successful. You can now sign in with your new password.",
    });
  } catch (error) {
    console.error("[Reset Password Error]", error);
    return apiError(ApiErrorCode.INTERNAL_ERROR, "Failed to reset password");
  }
}
