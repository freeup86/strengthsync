import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, ApiErrorCode } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return apiError(ApiErrorCode.UNAUTHORIZED, "Authentication required");
    }

    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const domain = searchParams.get("domain");

    if (slug) {
      // Get single theme by slug
      const theme = await prisma.strengthTheme.findUnique({
        where: { slug },
        include: {
          domain: {
            select: { slug: true, name: true, colorHex: true },
          },
        },
      });

      if (!theme) {
        return apiError(ApiErrorCode.NOT_FOUND, "Theme not found");
      }

      return apiSuccess({
        id: theme.id,
        name: theme.name,
        slug: theme.slug,
        shortDescription: theme.shortDescription,
        domain: theme.domain.slug,
        domainName: theme.domain.name,
        color: theme.domain.colorHex,
      });
    }

    // Get all themes, optionally filtered by domain
    const where: Record<string, unknown> = {};
    if (domain) {
      where.domain = { slug: domain };
    }

    const themes = await prisma.strengthTheme.findMany({
      where,
      include: {
        domain: {
          select: { slug: true, name: true, colorHex: true },
        },
      },
      orderBy: { name: "asc" },
    });

    const data = themes.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      shortDescription: t.shortDescription,
      domain: t.domain.slug,
      domainName: t.domain.name,
      color: t.domain.colorHex,
    }));

    return apiSuccess(data);
  } catch (error) {
    console.error("Error fetching themes:", error);
    return apiError(ApiErrorCode.INTERNAL_ERROR, "Failed to fetch themes");
  }
}
