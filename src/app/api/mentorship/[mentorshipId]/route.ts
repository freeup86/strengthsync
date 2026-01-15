import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, ApiErrorCode } from "@/lib/api/response";

// GET - Get a specific mentorship
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ mentorshipId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return apiError(ApiErrorCode.UNAUTHORIZED, "Authentication required");
    }

    const memberId = session.user.memberId;
    if (!memberId) {
      return apiError(ApiErrorCode.BAD_REQUEST, "Organization membership required");
    }

    const { mentorshipId } = await params;

    const mentorship = await prisma.mentorship.findFirst({
      where: {
        id: mentorshipId,
        OR: [{ mentorId: memberId }, { menteeId: memberId }],
      },
      include: {
        mentor: {
          include: {
            user: { select: { fullName: true, avatarUrl: true, jobTitle: true } },
            strengths: {
              where: { rank: { lte: 5 } },
              include: { theme: { include: { domain: { select: { slug: true } } } } },
              orderBy: { rank: "asc" },
            },
          },
        },
        mentee: {
          include: {
            user: { select: { fullName: true, avatarUrl: true, jobTitle: true } },
            strengths: {
              where: { rank: { lte: 5 } },
              include: { theme: { include: { domain: { select: { slug: true } } } } },
              orderBy: { rank: "asc" },
            },
          },
        },
      },
    });

    if (!mentorship) {
      return apiError(ApiErrorCode.NOT_FOUND, "Mentorship not found");
    }

    return apiSuccess(mentorship);
  } catch (error) {
    console.error("[Get Mentorship Error]", error);
    return apiError(ApiErrorCode.INTERNAL_ERROR, "Failed to get mentorship");
  }
}

// PATCH - Update mentorship status (accept/decline/pause/complete)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ mentorshipId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return apiError(ApiErrorCode.UNAUTHORIZED, "Authentication required");
    }

    const memberId = session.user.memberId;
    if (!memberId) {
      return apiError(ApiErrorCode.BAD_REQUEST, "Organization membership required");
    }

    const { mentorshipId } = await params;
    const body = await request.json();
    const { action } = body as { action: "accept" | "decline" | "pause" | "complete" };

    if (!action || !["accept", "decline", "pause", "complete"].includes(action)) {
      return apiError(ApiErrorCode.BAD_REQUEST, "Invalid action. Must be: accept, decline, pause, or complete");
    }

    // Get the mentorship
    const mentorship = await prisma.mentorship.findFirst({
      where: {
        id: mentorshipId,
        OR: [{ mentorId: memberId }, { menteeId: memberId }],
      },
      include: {
        mentor: {
          include: { user: { select: { fullName: true } } },
        },
        mentee: {
          include: { user: { select: { fullName: true, id: true } } },
        },
      },
    });

    if (!mentorship) {
      return apiError(ApiErrorCode.NOT_FOUND, "Mentorship not found");
    }

    const isMentor = mentorship.mentorId === memberId;
    const isMentee = mentorship.menteeId === memberId;

    // Validate action permissions
    if (action === "accept" || action === "decline") {
      // Only the mentor can accept or decline
      if (!isMentor) {
        return apiError(ApiErrorCode.FORBIDDEN, "Only the mentor can accept or decline requests");
      }
      if (mentorship.status !== "PENDING") {
        return apiError(ApiErrorCode.BAD_REQUEST, "Can only accept/decline pending requests");
      }
    }

    if (action === "pause") {
      // Either party can pause an active mentorship
      if (mentorship.status !== "ACTIVE") {
        return apiError(ApiErrorCode.BAD_REQUEST, "Can only pause active mentorships");
      }
    }

    if (action === "complete") {
      // Either party can mark as complete
      if (mentorship.status !== "ACTIVE" && mentorship.status !== "PAUSED") {
        return apiError(ApiErrorCode.BAD_REQUEST, "Can only complete active or paused mentorships");
      }
    }

    // Map action to status
    const statusMap: Record<string, "ACTIVE" | "DECLINED" | "PAUSED" | "COMPLETED"> = {
      accept: "ACTIVE",
      decline: "DECLINED",
      pause: "PAUSED",
      complete: "COMPLETED",
    };

    const newStatus = statusMap[action];

    // Update mentorship
    const updated = await prisma.mentorship.update({
      where: { id: mentorshipId },
      data: {
        status: newStatus,
        ...(action === "accept" && { startedAt: new Date() }),
        ...(action === "complete" && { endedAt: new Date() }),
      },
      include: {
        mentor: {
          include: { user: { select: { id: true, fullName: true } } },
        },
        mentee: {
          include: { user: { select: { id: true, fullName: true } } },
        },
      },
    });

    // Create notification for the other party
    const notifyUserId = isMentor ? updated.mentee.user.id : updated.mentor.user.id;
    const actorName = isMentor ? updated.mentor.user.fullName : updated.mentee.user.fullName;

    const notificationConfig: Record<string, { type: "MENTORSHIP_ACCEPTED" | "MENTORSHIP_DECLINED" | "SYSTEM"; title: string; message: string }> = {
      accept: {
        type: "MENTORSHIP_ACCEPTED",
        title: "Mentorship Request Accepted",
        message: `${actorName} has accepted your mentorship request!`,
      },
      decline: {
        type: "MENTORSHIP_DECLINED",
        title: "Mentorship Request Declined",
        message: `${actorName} has declined your mentorship request.`,
      },
      pause: {
        type: "SYSTEM",
        title: "Mentorship Paused",
        message: `${actorName} has paused your mentorship connection.`,
      },
      complete: {
        type: "SYSTEM",
        title: "Mentorship Completed",
        message: `${actorName} has marked your mentorship as completed.`,
      },
    };

    await prisma.notification.create({
      data: {
        userId: notifyUserId,
        type: notificationConfig[action].type,
        title: notificationConfig[action].title,
        message: notificationConfig[action].message,
        link: "/mentorship",
      },
    });

    // Award points for accepting mentorship
    if (action === "accept") {
      // Award points to mentor for accepting
      await prisma.organizationMember.update({
        where: { id: memberId },
        data: { points: { increment: 20 } },
      });
    }

    return apiSuccess({
      ...updated,
      action,
      message: `Mentorship ${action}ed successfully`,
    });
  } catch (error) {
    console.error("[Update Mentorship Error]", error);
    return apiError(ApiErrorCode.INTERNAL_ERROR, "Failed to update mentorship");
  }
}
