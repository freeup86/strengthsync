import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { parseCliftonStrengthsPDF, validateParsedReport } from "@/lib/pdf/parser";
import { apiSuccess, apiError, ApiErrorCode, apiCreated } from "@/lib/api/response";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return apiError(ApiErrorCode.UNAUTHORIZED, "Authentication required");
    }

    // Check admin permissions
    if (session.user.role !== "OWNER" && session.user.role !== "ADMIN") {
      return apiError(ApiErrorCode.FORBIDDEN, "Admin access required");
    }

    if (!session.user.organizationId || !session.user.memberId) {
      return apiError(ApiErrorCode.BAD_REQUEST, "Organization membership required");
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const forMemberId = formData.get("forMemberId") as string | null;
    const forUserEmail = formData.get("forUserEmail") as string | null;
    const forUserName = formData.get("forUserName") as string | null;

    if (!file) {
      return apiError(ApiErrorCode.BAD_REQUEST, "PDF file required");
    }

    if (file.type !== "application/pdf") {
      return apiError(ApiErrorCode.VALIDATION_ERROR, "Only PDF files are accepted");
    }

    // Convert to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse PDF
    const parsed = await parseCliftonStrengthsPDF(buffer);

    // Validate
    const validation = validateParsedReport(parsed);
    if (!validation.valid) {
      return apiError(ApiErrorCode.VALIDATION_ERROR, "Failed to parse valid strengths data", {
        errors: validation.errors,
        warnings: validation.warnings,
        parsedThemes: parsed.themes.length,
      });
    }

    // Store document record
    const document = await prisma.strengthsDocument.create({
      data: {
        uploadedById: session.user.id,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        processingStatus: "COMPLETED",
        extractedData: parsed as any,
      },
    });

    // Determine target member
    let targetMember = null;

    if (forMemberId) {
      // Assign to specific member
      targetMember = await prisma.organizationMember.findFirst({
        where: {
          id: forMemberId,
          organizationId: session.user.organizationId,
        },
        include: { user: true },
      });
    } else if (forUserEmail) {
      // Find or create user by email
      let user = await prisma.user.findUnique({
        where: { email: forUserEmail.toLowerCase() },
      });

      if (!user && forUserName) {
        // Create new user (without password - they'll need to register/be invited)
        user = await prisma.user.create({
          data: {
            email: forUserEmail.toLowerCase(),
            fullName: forUserName || parsed.participantName || "Team Member",
          },
        });
      }

      if (user) {
        // Find or create membership
        targetMember = await prisma.organizationMember.findFirst({
          where: {
            userId: user.id,
            organizationId: session.user.organizationId,
          },
          include: { user: true },
        });

        if (!targetMember) {
          targetMember = await prisma.organizationMember.create({
            data: {
              userId: user.id,
              organizationId: session.user.organizationId,
              role: "MEMBER",
              status: "PENDING",
              strengthsDocumentId: document.id,
            },
            include: { user: true },
          });
        }
      }
    }

    // If we have a target member, update their strengths
    if (targetMember) {
      // Get theme IDs from database
      const themeRecords = await prisma.strengthTheme.findMany({
        where: {
          slug: {
            in: parsed.themes.map((t) => t.slug),
          },
        },
      });

      const themeMap = new Map(themeRecords.map((t) => [t.slug, t.id]));

      // Delete existing strengths
      await prisma.memberStrength.deleteMany({
        where: { memberId: targetMember.id },
      });

      // Create new strengths
      const strengthsData = parsed.themes
        .filter((t) => themeMap.has(t.slug))
        .map((theme) => ({
          memberId: targetMember.id,
          themeId: themeMap.get(theme.slug)!,
          rank: theme.rank,
          isTop5: theme.rank <= 5,
          isTop10: theme.rank <= 10,
          personalizedDescription: theme.personalizedDescription,
        }));

      await prisma.memberStrength.createMany({
        data: strengthsData,
      });

      // Update member
      await prisma.organizationMember.update({
        where: { id: targetMember.id },
        data: {
          strengthsImportedAt: new Date(),
          strengthsDocumentId: document.id,
        },
      });
    }

    return apiCreated({
      documentId: document.id,
      participantName: parsed.participantName,
      themesFound: parsed.themes.length,
      reportType: parsed.reportType,
      confidence: parsed.confidence,
      warnings: validation.warnings,
      assignedTo: targetMember
        ? {
            memberId: targetMember.id,
            name: targetMember.user.fullName,
            email: targetMember.user.email,
          }
        : null,
    });
  } catch (error) {
    console.error("[Strengths Upload Error]", error);
    return apiError(ApiErrorCode.INTERNAL_ERROR, "Failed to process PDF");
  }
}
