import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiCreated, apiListSuccess, apiError, ApiErrorCode } from "@/lib/api/response";
import { z } from "zod";

const createMentorshipSchema = z.object({
  mentorId: z.string().min(1, "Mentor is required"),
  focusAreas: z.array(z.string()).min(1, "At least one focus area required"),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // "mentor", "mentee", or null for all

    // Build where clause
    const where: Record<string, unknown> = {};
    if (type === "mentor") {
      where.mentorId = memberId;
    } else if (type === "mentee") {
      where.menteeId = memberId;
    } else {
      where.OR = [{ mentorId: memberId }, { menteeId: memberId }];
    }

    const mentorships = await prisma.mentorship.findMany({
      where,
      include: {
        mentor: {
          include: {
            user: { select: { fullName: true, avatarUrl: true, jobTitle: true } },
            strengths: {
              where: { rank: { lte: 5 } },
              include: {
                theme: { include: { domain: { select: { slug: true } } } },
              },
              orderBy: { rank: "asc" },
            },
          },
        },
        mentee: {
          include: {
            user: { select: { fullName: true, avatarUrl: true, jobTitle: true } },
            strengths: {
              where: { rank: { lte: 5 } },
              include: {
                theme: { include: { domain: { select: { slug: true } } } },
              },
              orderBy: { rank: "asc" },
            },
          },
        },
      },
      orderBy: { startedAt: "desc" },
    });

    const data = mentorships.map((m) => ({
      id: m.id,
      status: m.status,
      focusAreas: m.focusAreas,
      notes: m.notes,
      startedAt: m.startedAt.toISOString(),
      endedAt: m.endedAt?.toISOString(),
      mentor: {
        id: m.mentorId,
        name: m.mentor.user.fullName,
        avatarUrl: m.mentor.user.avatarUrl,
        jobTitle: m.mentor.user.jobTitle,
        topStrengths: m.mentor.strengths.map((s) => ({
          name: s.theme.name,
          domain: s.theme.domain.slug,
        })),
      },
      mentee: {
        id: m.menteeId,
        name: m.mentee.user.fullName,
        avatarUrl: m.mentee.user.avatarUrl,
        jobTitle: m.mentee.user.jobTitle,
        topStrengths: m.mentee.strengths.map((s) => ({
          name: s.theme.name,
          domain: s.theme.domain.slug,
        })),
      },
      isMentor: m.mentorId === memberId,
    }));

    return apiSuccess(data);
  } catch (error) {
    console.error("Error fetching mentorships:", error);
    return apiError(ApiErrorCode.INTERNAL_ERROR, "Failed to fetch mentorships");
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
    const validation = createMentorshipSchema.safeParse(body);

    if (!validation.success) {
      return apiError(ApiErrorCode.VALIDATION_ERROR, "Invalid input", {
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const { mentorId, focusAreas, notes } = validation.data;

    // Can't mentor yourself
    if (mentorId === memberId) {
      return apiError(ApiErrorCode.BAD_REQUEST, "You cannot request yourself as a mentor");
    }

    // Verify mentor is in same org
    const mentor = await prisma.organizationMember.findFirst({
      where: {
        id: mentorId,
        organizationId,
        status: "ACTIVE",
      },
    });

    if (!mentor) {
      return apiError(ApiErrorCode.NOT_FOUND, "Mentor not found in your organization");
    }

    // Check for existing active mentorship
    const existing = await prisma.mentorship.findFirst({
      where: {
        mentorId,
        menteeId: memberId,
        status: { in: ["PENDING", "ACTIVE"] },
      },
    });

    if (existing) {
      return apiError(ApiErrorCode.CONFLICT, "You already have a mentorship with this person");
    }

    // Create mentorship request
    const mentorship = await prisma.mentorship.create({
      data: {
        mentorId,
        menteeId: memberId,
        focusAreas,
        notes,
        status: "PENDING",
      },
      include: {
        mentor: {
          include: {
            user: { select: { fullName: true } },
          },
        },
      },
    });

    return apiCreated({
      id: mentorship.id,
      status: mentorship.status,
      mentorName: mentorship.mentor.user.fullName,
      focusAreas: mentorship.focusAreas,
    });
  } catch (error) {
    console.error("Error creating mentorship:", error);
    return apiError(ApiErrorCode.INTERNAL_ERROR, "Failed to create mentorship request");
  }
}
