import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiCreated, apiListSuccess, apiError, ApiErrorCode } from "@/lib/api/response";
import { z } from "zod";

const createShoutoutSchema = z.object({
  receiverId: z.string().min(1, "Recipient is required"),
  themeId: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters").max(500),
  isPublic: z.boolean().optional().default(true),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return apiError(ApiErrorCode.UNAUTHORIZED, "Authentication required");
    }

    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return apiError(ApiErrorCode.BAD_REQUEST, "No organization associated with user");
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const filter = searchParams.get("filter"); // "given", "received", or null for all

    const memberId = session.user.memberId;

    // Build where clause
    const where: Record<string, unknown> = {
      organizationId,
      isPublic: true,
    };

    if (filter === "given" && memberId) {
      where.giverId = memberId;
    } else if (filter === "received" && memberId) {
      where.receiverId = memberId;
    }

    const total = await prisma.shoutout.count({ where });

    const shoutouts = await prisma.shoutout.findMany({
      where,
      include: {
        giver: {
          include: {
            user: {
              select: { fullName: true, avatarUrl: true },
            },
          },
        },
        receiver: {
          include: {
            user: {
              select: { fullName: true, avatarUrl: true },
            },
          },
        },
        theme: {
          include: {
            domain: { select: { slug: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    const data = shoutouts.map((s) => ({
      id: s.id,
      message: s.message,
      isPublic: s.isPublic,
      createdAt: s.createdAt.toISOString(),
      giver: {
        id: s.giverId,
        name: s.giver.user.fullName || "Unknown",
        avatarUrl: s.giver.user.avatarUrl,
      },
      receiver: {
        id: s.receiverId,
        name: s.receiver.user.fullName || "Unknown",
        avatarUrl: s.receiver.user.avatarUrl,
      },
      theme: s.theme
        ? {
            id: s.themeId,
            name: s.theme.name,
            slug: s.theme.slug,
            domain: s.theme.domain.slug,
          }
        : null,
    }));

    return apiListSuccess(data, {
      page,
      limit,
      total,
      hasMore: page * limit < total,
    });
  } catch (error) {
    console.error("Error fetching shoutouts:", error);
    return apiError(ApiErrorCode.INTERNAL_ERROR, "Failed to fetch shoutouts");
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return apiError(ApiErrorCode.UNAUTHORIZED, "Authentication required");
    }

    const organizationId = session.user.organizationId;
    const memberId = session.user.memberId;

    if (!organizationId || !memberId) {
      return apiError(ApiErrorCode.BAD_REQUEST, "Organization membership required");
    }

    const body = await request.json();
    const validation = createShoutoutSchema.safeParse(body);

    if (!validation.success) {
      return apiError(ApiErrorCode.VALIDATION_ERROR, "Invalid input", {
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const { receiverId, themeId, message, isPublic } = validation.data;

    // Can't shoutout yourself
    if (receiverId === memberId) {
      return apiError(ApiErrorCode.BAD_REQUEST, "You cannot give a shoutout to yourself");
    }

    // Verify receiver is in same org
    const receiver = await prisma.organizationMember.findFirst({
      where: {
        id: receiverId,
        organizationId,
        status: "ACTIVE",
      },
    });

    if (!receiver) {
      return apiError(ApiErrorCode.NOT_FOUND, "Recipient not found in your organization");
    }

    // Verify theme if provided
    if (themeId) {
      const theme = await prisma.strengthTheme.findUnique({ where: { id: themeId } });
      if (!theme) {
        return apiError(ApiErrorCode.NOT_FOUND, "Theme not found");
      }
    }

    // Create shoutout
    const shoutout = await prisma.shoutout.create({
      data: {
        organizationId,
        giverId: memberId,
        receiverId,
        themeId: themeId || null,
        message,
        isPublic,
      },
      include: {
        giver: {
          include: {
            user: { select: { fullName: true } },
          },
        },
        receiver: {
          include: {
            user: { select: { fullName: true } },
          },
        },
        theme: {
          include: { domain: { select: { slug: true } } },
        },
      },
    });

    // Award points
    await prisma.$transaction([
      // Giver gets 5 points
      prisma.organizationMember.update({
        where: { id: memberId },
        data: { points: { increment: 5 } },
      }),
      // Receiver gets 10 points
      prisma.organizationMember.update({
        where: { id: receiverId },
        data: { points: { increment: 10 } },
      }),
    ]);

    // Create feed item
    await prisma.feedItem.create({
      data: {
        organizationId,
        creatorId: memberId,
        itemType: "SHOUTOUT",
        content: {
          message: shoutout.message,
          receiverName: shoutout.receiver.user.fullName,
          themeName: shoutout.theme?.name,
        },
        shoutoutId: shoutout.id,
      },
    });

    return apiCreated({
      id: shoutout.id,
      message: shoutout.message,
      createdAt: shoutout.createdAt.toISOString(),
      giver: {
        id: shoutout.giverId,
        name: shoutout.giver.user.fullName,
      },
      receiver: {
        id: shoutout.receiverId,
        name: shoutout.receiver.user.fullName,
      },
      theme: shoutout.theme
        ? {
            name: shoutout.theme.name,
            domain: shoutout.theme.domain.slug,
          }
        : null,
    });
  } catch (error) {
    console.error("Error creating shoutout:", error);
    return apiError(ApiErrorCode.INTERNAL_ERROR, "Failed to create shoutout");
  }
}
