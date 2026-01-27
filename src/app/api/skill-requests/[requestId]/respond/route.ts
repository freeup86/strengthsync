import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiCreated, apiError, ApiErrorCode } from "@/lib/api/response";
import { z } from "zod";
import { checkAndAwardBadges } from "@/lib/gamification/badge-engine";
import { sendTeamsNotification, buildSkillRequestCard } from "@/lib/integrations/teams-webhook";

const responseSchema = z.object({
  message: z.string().min(10).max(2000),
});

const updateResponseSchema = z.object({
  status: z.enum(["ACCEPTED", "DECLINED"]),
});

// POST - Create a response to a skill request
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const { requestId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return apiError(ApiErrorCode.UNAUTHORIZED, "Authentication required");
    }

    const organizationId = session.user.organizationId;
    const memberId = session.user.memberId;

    if (!organizationId || !memberId) {
      return apiError(ApiErrorCode.BAD_REQUEST, "Organization membership required");
    }

    const skillRequest = await prisma.skillRequest.findFirst({
      where: { id: requestId, organizationId },
      include: {
        creator: {
          include: {
            user: { select: { id: true } },
          },
        },
      },
    });

    if (!skillRequest) {
      return apiError(ApiErrorCode.NOT_FOUND, "Skill request not found");
    }

    // Can't respond to your own request
    if (skillRequest.creatorId === memberId) {
      return apiError(ApiErrorCode.BAD_REQUEST, "You cannot respond to your own request");
    }

    // Check if already responded
    const existingResponse = await prisma.skillRequestResponse.findFirst({
      where: { requestId, responderId: memberId },
    });

    if (existingResponse) {
      return apiError(ApiErrorCode.CONFLICT, "You have already responded to this request");
    }

    // Check if request is still open
    if (skillRequest.status !== "OPEN" && skillRequest.status !== "IN_PROGRESS") {
      return apiError(ApiErrorCode.BAD_REQUEST, "This request is no longer accepting responses");
    }

    const body = await request.json();
    const validation = responseSchema.safeParse(body);

    if (!validation.success) {
      return apiError(ApiErrorCode.VALIDATION_ERROR, "Invalid input", {
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const { message } = validation.data;

    const response = await prisma.skillRequestResponse.create({
      data: {
        requestId,
        responderId: memberId,
        message,
        status: "OFFERED",
      },
      include: {
        responder: {
          include: {
            user: { select: { fullName: true } },
          },
        },
      },
    });

    // Update request status to IN_PROGRESS if it was OPEN
    if (skillRequest.status === "OPEN") {
      await prisma.skillRequest.update({
        where: { id: requestId },
        data: { status: "IN_PROGRESS" },
      });
    }

    // Award points to responder
    await prisma.organizationMember.update({
      where: { id: memberId },
      data: { points: { increment: 15 } },
    });

    // Create notification for request creator
    await prisma.notification.create({
      data: {
        userId: skillRequest.creator.user.id,
        type: "SKILL_REQUEST_RESPONSE",
        title: "New Response to Your Request",
        message: `${response.responder.user.fullName} offered to help with "${skillRequest.title}"`,
        link: `/marketplace/${requestId}`,
        metadata: JSON.parse(JSON.stringify({
          requestId,
          responseId: response.id,
          responderName: response.responder.user.fullName,
        })),
      },
    });

    // Badge engine: check for badges after skill response
    await checkAndAwardBadges(memberId, "skill_response");

    // Teams webhook: fire-and-forget notification
    sendTeamsNotification(
      organizationId,
      buildSkillRequestCard(
        response.responder.user.fullName || "Someone",
        skillRequest.title,
        skillRequest.urgency
      )
    );

    return apiCreated({
      id: response.id,
      message: response.message,
      status: response.status,
      createdAt: response.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("Error creating response:", error);
    return apiError(ApiErrorCode.INTERNAL_ERROR, "Failed to create response");
  }
}

// PATCH - Accept or decline a response (only request creator can do this)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const { requestId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return apiError(ApiErrorCode.UNAUTHORIZED, "Authentication required");
    }

    const organizationId = session.user.organizationId;
    const memberId = session.user.memberId;

    if (!organizationId || !memberId) {
      return apiError(ApiErrorCode.BAD_REQUEST, "Organization membership required");
    }

    const { searchParams } = new URL(request.url);
    const responseId = searchParams.get("responseId");

    if (!responseId) {
      return apiError(ApiErrorCode.BAD_REQUEST, "Response ID required");
    }

    const skillRequest = await prisma.skillRequest.findFirst({
      where: { id: requestId, organizationId },
    });

    if (!skillRequest) {
      return apiError(ApiErrorCode.NOT_FOUND, "Skill request not found");
    }

    // Only creator can accept/decline responses
    if (skillRequest.creatorId !== memberId) {
      return apiError(ApiErrorCode.FORBIDDEN, "Only the request creator can manage responses");
    }

    const responseToUpdate = await prisma.skillRequestResponse.findFirst({
      where: { id: responseId, requestId },
      include: {
        responder: {
          include: {
            user: { select: { id: true, fullName: true } },
          },
        },
      },
    });

    if (!responseToUpdate) {
      return apiError(ApiErrorCode.NOT_FOUND, "Response not found");
    }

    const body = await request.json();
    const validation = updateResponseSchema.safeParse(body);

    if (!validation.success) {
      return apiError(ApiErrorCode.VALIDATION_ERROR, "Invalid input", {
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const { status } = validation.data;

    const updated = await prisma.skillRequestResponse.update({
      where: { id: responseId },
      data: { status },
    });

    // If accepted, update request status and award more points
    if (status === "ACCEPTED") {
      await prisma.skillRequest.update({
        where: { id: requestId },
        data: { status: "FULFILLED" },
      });

      // Award bonus points to responder for getting accepted
      await prisma.organizationMember.update({
        where: { id: responseToUpdate.responderId },
        data: { points: { increment: 25 } },
      });

      // Create notification for responder
      await prisma.notification.create({
        data: {
          userId: responseToUpdate.responder.user.id,
          type: "SKILL_REQUEST_RESPONSE",
          title: "Your Help Was Accepted!",
          message: `Your response to "${skillRequest.title}" was accepted`,
          link: `/marketplace/${requestId}`,
          metadata: JSON.parse(JSON.stringify({
            requestId,
            accepted: true,
          })),
        },
      });

      // Badge engine: check for accepted-response badges
      await checkAndAwardBadges(responseToUpdate.responderId, "skill_response_accepted");
    }

    return apiSuccess({
      id: updated.id,
      status: updated.status,
    });
  } catch (error) {
    console.error("Error updating response:", error);
    return apiError(ApiErrorCode.INTERNAL_ERROR, "Failed to update response");
  }
}
