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

    // Only admins can export data
    if (role !== "OWNER" && role !== "ADMIN") {
      return apiError(ApiErrorCode.FORBIDDEN, "Admin access required");
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "csv";

    // Fetch all members with their strengths
    const members = await prisma.organizationMember.findMany({
      where: { organizationId, status: "ACTIVE" },
      include: {
        user: {
          select: {
            email: true,
            fullName: true,
            jobTitle: true,
            department: true,
          },
        },
        strengths: {
          include: {
            theme: {
              include: {
                domain: { select: { name: true } },
              },
            },
          },
          orderBy: { rank: "asc" },
        },
      },
      orderBy: { user: { fullName: "asc" } },
    });

    if (format === "csv") {
      // Generate CSV
      const headers = [
        "Name",
        "Email",
        "Job Title",
        "Department",
        "Points",
        "Top 1",
        "Top 2",
        "Top 3",
        "Top 4",
        "Top 5",
        "Dominant Domain",
      ];

      const rows = members.map((m) => {
        const top5 = m.strengths.slice(0, 5);
        const domains: Record<string, number> = {};
        top5.forEach((s) => {
          const domain = s.theme.domain.name;
          domains[domain] = (domains[domain] || 0) + 1;
        });
        const dominantDomain = Object.entries(domains).sort((a, b) => b[1] - a[1])[0]?.[0] || "";

        return [
          m.user.fullName,
          m.user.email,
          m.user.jobTitle || "",
          m.user.department || "",
          m.points.toString(),
          top5[0]?.theme.name || "",
          top5[1]?.theme.name || "",
          top5[2]?.theme.name || "",
          top5[3]?.theme.name || "",
          top5[4]?.theme.name || "",
          dominantDomain,
        ];
      });

      const csvContent = [
        headers.join(","),
        ...rows.map((row) =>
          row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")
        ),
      ].join("\n");

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="team-strengths-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    // JSON format
    const data = members.map((m) => ({
      name: m.user.fullName,
      email: m.user.email,
      jobTitle: m.user.jobTitle,
      department: m.user.department,
      points: m.points,
      strengths: m.strengths.map((s) => ({
        rank: s.rank,
        theme: s.theme.name,
        domain: s.theme.domain.name,
      })),
    }));

    return NextResponse.json(data, {
      headers: {
        "Content-Disposition": `attachment; filename="team-strengths-${new Date().toISOString().split("T")[0]}.json"`,
      },
    });
  } catch (error) {
    console.error("Error exporting team data:", error);
    return apiError(ApiErrorCode.INTERNAL_ERROR, "Failed to export data");
  }
}
