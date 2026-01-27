import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, ApiErrorCode } from "@/lib/api/response";
import { sendTestCard } from "@/lib/integrations/teams-webhook";
import { z } from "zod";

const webhookUrlSchema = z.object({
  webhookUrl: z
    .string()
    .url("Must be a valid URL")
    .startsWith("https://", "Webhook URL must use HTTPS")
    .max(1000),
});

/**
 * GET /api/admin/integrations/teams
 * Returns the current Teams webhook URL (masked for security).
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return apiError(ApiErrorCode.UNAUTHORIZED, "Authentication required");
    }

    const organizationId = session.user.organizationId;
    const role = session.user.role;

    if (!organizationId || (role !== "OWNER" && role !== "ADMIN")) {
      return apiError(ApiErrorCode.FORBIDDEN, "Admin access required");
    }

    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { settings: true },
    });

    const settings = org?.settings as Record<string, unknown> | null;
    const webhookUrl = (settings?.teamsWebhookUrl as string) || "";

    // Mask the URL for security (show only last 8 chars)
    const maskedUrl = webhookUrl
      ? `${"*".repeat(Math.max(0, webhookUrl.length - 8))}${webhookUrl.slice(-8)}`
      : "";

    return apiSuccess({
      configured: !!webhookUrl,
      maskedUrl,
    });
  } catch (error) {
    console.error("[Teams Integration] GET error:", error);
    return apiError(ApiErrorCode.INTERNAL_ERROR, "Failed to get Teams configuration");
  }
}

/**
 * PATCH /api/admin/integrations/teams
 * Update the Teams webhook URL.
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return apiError(ApiErrorCode.UNAUTHORIZED, "Authentication required");
    }

    const organizationId = session.user.organizationId;
    const role = session.user.role;

    if (!organizationId || (role !== "OWNER" && role !== "ADMIN")) {
      return apiError(ApiErrorCode.FORBIDDEN, "Admin access required");
    }

    const body = await request.json();

    // Allow clearing the URL with an empty string
    if (body.webhookUrl === "" || body.webhookUrl === null) {
      const org = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { settings: true },
      });

      const currentSettings = (org?.settings as Record<string, unknown>) || {};
      const { teamsWebhookUrl: _, ...rest } = currentSettings;

      await prisma.organization.update({
        where: { id: organizationId },
        data: {
          settings: JSON.parse(JSON.stringify(rest)),
        },
      });

      return apiSuccess({ configured: false, message: "Teams webhook URL removed" });
    }

    const validation = webhookUrlSchema.safeParse(body);
    if (!validation.success) {
      return apiError(ApiErrorCode.VALIDATION_ERROR, "Invalid webhook URL", {
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const { webhookUrl } = validation.data;

    // Update organization settings
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { settings: true },
    });

    const currentSettings = (org?.settings as Record<string, unknown>) || {};
    const updatedSettings = { ...currentSettings, teamsWebhookUrl: webhookUrl };

    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        settings: JSON.parse(JSON.stringify(updatedSettings)),
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        organizationId,
        action: "TEAMS_WEBHOOK_UPDATED",
        entityType: "Organization",
        entityId: organizationId,
      },
    });

    return apiSuccess({ configured: true, message: "Teams webhook URL updated" });
  } catch (error) {
    console.error("[Teams Integration] PATCH error:", error);
    return apiError(ApiErrorCode.INTERNAL_ERROR, "Failed to update Teams configuration");
  }
}

/**
 * POST /api/admin/integrations/teams
 * Send a test Adaptive Card to verify the webhook URL.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return apiError(ApiErrorCode.UNAUTHORIZED, "Authentication required");
    }

    const organizationId = session.user.organizationId;
    const role = session.user.role;

    if (!organizationId || (role !== "OWNER" && role !== "ADMIN")) {
      return apiError(ApiErrorCode.FORBIDDEN, "Admin access required");
    }

    // Get the current webhook URL
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { settings: true },
    });

    const settings = org?.settings as Record<string, unknown> | null;
    const webhookUrl = (settings?.teamsWebhookUrl as string) || process.env.TEAMS_WEBHOOK_URL;

    if (!webhookUrl) {
      return apiError(ApiErrorCode.BAD_REQUEST, "No Teams webhook URL configured");
    }

    const success = await sendTestCard(webhookUrl);

    if (success) {
      return apiSuccess({ message: "Test message sent successfully to Teams" });
    } else {
      return apiError(ApiErrorCode.BAD_REQUEST, "Failed to send test message. Please verify the webhook URL.");
    }
  } catch (error) {
    console.error("[Teams Integration] POST test error:", error);
    return apiError(ApiErrorCode.INTERNAL_ERROR, "Failed to send test message");
  }
}
