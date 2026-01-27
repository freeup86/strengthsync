import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, ApiErrorCode } from "@/lib/api/response";
import { parseGallupExcel } from "@/lib/excel/gallup-parser";
import { checkAndAwardBadges } from "@/lib/gamification/badge-engine";

/**
 * POST /api/admin/members/excel-import
 *
 * Import CliftonStrengths from a Gallup Access Excel export.
 * Accepts FormData with a .xlsx file.
 * Use ?preview=true for a dry-run preview without writing to the database.
 *
 * Admin-only (OWNER/ADMIN).
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return apiError(ApiErrorCode.UNAUTHORIZED, "Authentication required");
    }

    const organizationId = session.user.organizationId;
    const role = session.user.role;

    if (!organizationId) {
      return apiError(ApiErrorCode.BAD_REQUEST, "Organization membership required");
    }

    // Admin-only check
    if (role !== "OWNER" && role !== "ADMIN") {
      return apiError(ApiErrorCode.FORBIDDEN, "Admin access required");
    }

    const { searchParams } = new URL(request.url);
    const isPreview = searchParams.get("preview") === "true";

    // Parse FormData
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return apiError(ApiErrorCode.VALIDATION_ERROR, "Excel file is required");
    }

    // Validate file type
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    if (!validTypes.includes(file.type) && !file.name.match(/\.xlsx?$/i)) {
      return apiError(
        ApiErrorCode.VALIDATION_ERROR,
        "Invalid file type. Please upload an .xlsx or .xls file."
      );
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return apiError(ApiErrorCode.VALIDATION_ERROR, "File size exceeds 10MB limit");
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse the Excel file
    const parseResult = parseGallupExcel(buffer);

    if (parseResult.errors.length > 0) {
      return apiError(ApiErrorCode.VALIDATION_ERROR, "Failed to parse Excel file", {
        errors: parseResult.errors,
        warnings: parseResult.warnings,
      });
    }

    // Get all org members for matching
    const orgMembers = await prisma.organizationMember.findMany({
      where: { organizationId, status: "ACTIVE" },
      include: {
        user: { select: { id: true, email: true, fullName: true } },
      },
    });

    // Build lookup maps
    const memberByEmail = new Map(
      orgMembers
        .filter((m) => m.user.email)
        .map((m) => [m.user.email.toLowerCase(), m])
    );

    const memberByName = new Map(
      orgMembers
        .filter((m) => m.user.fullName)
        .map((m) => [m.user.fullName.toLowerCase(), m])
    );

    // Get all theme records for ID lookups
    const themes = await prisma.strengthTheme.findMany({
      select: { id: true, slug: true },
    });
    const themeBySlug = new Map(themes.map((t) => [t.slug, t.id]));

    // Process each row
    interface RowResult {
      rowNumber: number;
      participantName: string;
      participantEmail: string | null;
      status: "success" | "skipped" | "error";
      message: string;
      memberId?: string;
      memberName?: string;
      themeCount: number;
      hasExistingStrengths: boolean;
      topFiveThemes: string[];
      warnings: string[];
    }

    const results: RowResult[] = [];
    let successful = 0;
    let failed = 0;

    for (const row of parseResult.rows) {
      const rowResult: RowResult = {
        rowNumber: row.rowNumber,
        participantName: row.participantName,
        participantEmail: row.participantEmail,
        status: "skipped",
        message: "",
        themeCount: row.themes.length,
        hasExistingStrengths: false,
        topFiveThemes: row.themes
          .filter((t) => t.rank <= 5)
          .map((t) => t.themeName),
        warnings: [...row.warnings],
      };

      // Match member: email first, then name
      let matchedMember = row.participantEmail
        ? memberByEmail.get(row.participantEmail)
        : undefined;

      if (!matchedMember) {
        matchedMember = memberByName.get(row.participantName.toLowerCase());
      }

      // Try "Last, First" name format
      if (!matchedMember && row.participantName.includes(",")) {
        const parts = row.participantName.split(",").map((p) => p.trim());
        if (parts.length === 2) {
          const flippedName = `${parts[1]} ${parts[0]}`.toLowerCase();
          matchedMember = memberByName.get(flippedName);
        }
      }

      if (!matchedMember) {
        rowResult.status = "skipped";
        rowResult.message = "No matching member found in organization";
        results.push(rowResult);
        failed++;
        continue;
      }

      rowResult.memberId = matchedMember.id;
      rowResult.memberName = matchedMember.user.fullName;

      // Check for existing strengths
      const existingCount = await prisma.memberStrength.count({
        where: { memberId: matchedMember.id },
      });
      rowResult.hasExistingStrengths = existingCount > 0;

      if (row.themes.length < 5) {
        rowResult.status = "skipped";
        rowResult.message = `Only ${row.themes.length} valid themes found (minimum 5 required)`;
        results.push(rowResult);
        failed++;
        continue;
      }

      // If preview mode, just report what would happen
      if (isPreview) {
        rowResult.status = "success";
        rowResult.message = rowResult.hasExistingStrengths
          ? "Will overwrite existing strengths"
          : "Will import strengths";
        results.push(rowResult);
        successful++;
        continue;
      }

      // Import strengths for this member
      try {
        // Delete existing strengths
        await prisma.memberStrength.deleteMany({
          where: { memberId: matchedMember.id },
        });

        // Create new strength records
        const strengthData = [];
        for (const theme of row.themes) {
          const themeId = themeBySlug.get(theme.themeSlug);
          if (!themeId) {
            rowResult.warnings.push(`Theme "${theme.themeName}" not found in database`);
            continue;
          }

          strengthData.push({
            memberId: matchedMember.id,
            themeId,
            rank: theme.rank,
            isTop5: theme.rank <= 5,
            isTop10: theme.rank <= 10,
          });
        }

        await prisma.memberStrength.createMany({ data: strengthData });

        // Update import timestamp
        await prisma.organizationMember.update({
          where: { id: matchedMember.id },
          data: { strengthsImportedAt: new Date() },
        });

        // Badge engine: check for strengths_imported badge
        await checkAndAwardBadges(matchedMember.id, "strengths_imported");

        rowResult.status = "success";
        rowResult.message = `Imported ${strengthData.length} themes`;
        rowResult.themeCount = strengthData.length;
        successful++;
      } catch (err) {
        console.error(`[Excel Import] Error importing row ${row.rowNumber}:`, err);
        rowResult.status = "error";
        rowResult.message = `Import failed: ${err instanceof Error ? err.message : "Unknown error"}`;
        failed++;
      }

      results.push(rowResult);
    }

    // Audit log
    if (!isPreview) {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          organizationId,
          action: "EXCEL_IMPORT",
          entityType: "MemberStrength",
          newValue: JSON.parse(
            JSON.stringify({
              fileName: file.name,
              totalRows: parseResult.totalRows,
              successful,
              failed,
            })
          ),
        },
      });
    }

    return apiSuccess({
      preview: isPreview,
      totalProcessed: parseResult.totalRows,
      successful,
      failed,
      validRows: parseResult.validRows,
      warnings: parseResult.warnings,
      results,
    });
  } catch (error) {
    console.error("[Excel Import] Error:", error);
    return apiError(ApiErrorCode.INTERNAL_ERROR, "Failed to process Excel import");
  }
}
