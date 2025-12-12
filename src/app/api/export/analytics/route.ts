import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { apiError, ApiErrorCode } from "@/lib/api/response";

export async function GET(request: NextRequest) {
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

    // Only admins can export analytics
    if (role !== "OWNER" && role !== "ADMIN") {
      return apiError(ApiErrorCode.FORBIDDEN, "Admin access required");
    }

    // Fetch organization with member stats
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { name: true },
    });

    // Get all active members with strengths
    const members = await prisma.organizationMember.findMany({
      where: { organizationId, status: "ACTIVE" },
      include: {
        strengths: {
          where: { rank: { lte: 10 } },
          include: {
            theme: {
              include: {
                domain: { select: { slug: true, name: true } },
              },
            },
          },
        },
      },
    });

    // Calculate domain distribution
    const domainCounts: Record<string, number> = {
      executing: 0,
      influencing: 0,
      relationship: 0,
      strategic: 0,
    };

    const themeCounts: Record<string, number> = {};

    members.forEach((m) => {
      m.strengths.slice(0, 5).forEach((s) => {
        const domain = s.theme.domain.slug;
        domainCounts[domain] = (domainCounts[domain] || 0) + 1;

        const theme = s.theme.name;
        themeCounts[theme] = (themeCounts[theme] || 0) + 1;
      });
    });

    // Get all themes for gap analysis
    const allThemes = await prisma.strengthTheme.findMany({
      include: { domain: { select: { name: true } } },
    });

    const themeAnalysis = allThemes.map((theme) => ({
      theme: theme.name,
      domain: theme.domain.name,
      count: themeCounts[theme.name] || 0,
      percentage: members.length > 0
        ? Math.round(((themeCounts[theme.name] || 0) / members.length) * 100)
        : 0,
    }));

    // Sort by count descending
    themeAnalysis.sort((a, b) => b.count - a.count);

    // Build analytics report
    const report = {
      organization: org?.name,
      exportDate: new Date().toISOString(),
      summary: {
        totalMembers: members.length,
        membersWithStrengths: members.filter((m) => m.strengths.length > 0).length,
      },
      domainDistribution: {
        executing: {
          count: domainCounts.executing,
          percentage: members.length > 0
            ? Math.round((domainCounts.executing / (members.length * 5)) * 100)
            : 0,
        },
        influencing: {
          count: domainCounts.influencing,
          percentage: members.length > 0
            ? Math.round((domainCounts.influencing / (members.length * 5)) * 100)
            : 0,
        },
        relationship: {
          count: domainCounts.relationship,
          percentage: members.length > 0
            ? Math.round((domainCounts.relationship / (members.length * 5)) * 100)
            : 0,
        },
        strategic: {
          count: domainCounts.strategic,
          percentage: members.length > 0
            ? Math.round((domainCounts.strategic / (members.length * 5)) * 100)
            : 0,
        },
      },
      themeAnalysis,
      gaps: themeAnalysis.filter((t) => t.percentage < 10).map((t) => t.theme),
      strengths: themeAnalysis.filter((t) => t.percentage >= 30).map((t) => t.theme),
    };

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "json";

    if (format === "csv") {
      // Generate CSV for theme analysis
      const headers = ["Theme", "Domain", "Count", "Percentage"];
      const rows = themeAnalysis.map((t) => [
        t.theme,
        t.domain,
        t.count.toString(),
        `${t.percentage}%`,
      ]);

      const csvContent = [
        `# Team Analytics Report - ${org?.name}`,
        `# Export Date: ${report.exportDate}`,
        `# Total Members: ${report.summary.totalMembers}`,
        `# Members with Strengths: ${report.summary.membersWithStrengths}`,
        "",
        headers.join(","),
        ...rows.map((row) =>
          row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")
        ),
      ].join("\n");

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="team-analytics-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    return NextResponse.json(report, {
      headers: {
        "Content-Disposition": `attachment; filename="team-analytics-${new Date().toISOString().split("T")[0]}.json"`,
      },
    });
  } catch (error) {
    console.error("Error exporting analytics:", error);
    return apiError(ApiErrorCode.INTERNAL_ERROR, "Failed to export analytics");
  }
}
