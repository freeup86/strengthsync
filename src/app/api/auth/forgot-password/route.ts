import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, ApiErrorCode } from "@/lib/api/response";
import { sendEmail, isEmailConfigured } from "@/lib/email";
import { z } from "zod";
import crypto from "crypto";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

// Token expires in 1 hour
const TOKEN_EXPIRY_HOURS = 1;

function generateResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function generatePasswordResetEmail(resetUrl: string, userName: string): { html: string; text: string } {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #7B68EE; margin: 0;">StrengthSync</h1>
  </div>

  <div style="background: #f8f9fa; border-radius: 12px; padding: 30px; margin-bottom: 20px;">
    <h2 style="margin-top: 0; color: #1a1d24;">Reset Your Password</h2>
    <p>Hi ${userName},</p>
    <p>We received a request to reset your password. Click the button below to create a new password:</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" style="display: inline-block; background: #7B68EE; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">Reset Password</a>
    </div>

    <p style="color: #666; font-size: 14px;">This link will expire in ${TOKEN_EXPIRY_HOURS} hour.</p>
    <p style="color: #666; font-size: 14px;">If you didn't request this, you can safely ignore this email. Your password won't be changed.</p>
  </div>

  <div style="text-align: center; color: #999; font-size: 12px;">
    <p>If the button doesn't work, copy and paste this link:</p>
    <p style="word-break: break-all;">${resetUrl}</p>
  </div>
</body>
</html>
  `.trim();

  const text = `
Reset Your Password

Hi ${userName},

We received a request to reset your password. Visit the link below to create a new password:

${resetUrl}

This link will expire in ${TOKEN_EXPIRY_HOURS} hour.

If you didn't request this, you can safely ignore this email. Your password won't be changed.

- StrengthSync Team
  `.trim();

  return { html, text };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = forgotPasswordSchema.safeParse(body);

    if (!validation.success) {
      return apiError(ApiErrorCode.VALIDATION_ERROR, "Invalid email address", {
        errors: validation.error.errors,
      });
    }

    const { email } = validation.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true, fullName: true },
    });

    // Always return success to prevent email enumeration attacks
    // Even if user doesn't exist, we don't reveal that information
    if (!user) {
      console.log(`[Forgot Password] No user found for email: ${normalizedEmail}`);
      return apiSuccess({
        message: "If an account exists with that email, you will receive a password reset link.",
      });
    }

    // Generate reset token
    const resetToken = generateResetToken();
    const resetExpires = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

    // Save token to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      },
    });

    // Check if email is configured
    if (!isEmailConfigured()) {
      console.warn("[Forgot Password] Email service not configured. Token:", resetToken);
      // In development, still return success but log the token
      return apiSuccess({
        message: "If an account exists with that email, you will receive a password reset link.",
        // Only include token in development for testing
        ...(process.env.NODE_ENV === "development" && { devToken: resetToken }),
      });
    }

    // Build reset URL
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}`;

    // Send email
    const emailContent = generatePasswordResetEmail(resetUrl, user.fullName);
    const result = await sendEmail({
      to: user.email,
      subject: "Reset Your Password - StrengthSync",
      html: emailContent.html,
      text: emailContent.text,
      tags: [{ name: "type", value: "password-reset" }],
    });

    if (!result.success) {
      console.error("[Forgot Password] Failed to send email:", result.error);
      // Still return success to prevent enumeration
    } else {
      console.log(`[Forgot Password] Reset email sent to ${user.email}`);
    }

    return apiSuccess({
      message: "If an account exists with that email, you will receive a password reset link.",
    });
  } catch (error) {
    console.error("[Forgot Password Error]", error);
    return apiError(ApiErrorCode.INTERNAL_ERROR, "Failed to process request");
  }
}
