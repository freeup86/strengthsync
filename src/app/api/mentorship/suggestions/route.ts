import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, ApiErrorCode } from "@/lib/api/response";

// Complementary strength pairings for mentorship
const MENTORSHIP_PAIRINGS: Record<string, string[]> = {
  strategic: ["achiever", "focus", "discipline"],
  achiever: ["strategic", "ideation", "futuristic"],
  ideation: ["achiever", "focus", "discipline"],
  empathy: ["command", "self-assurance", "activator"],
  command: ["empathy", "harmony", "developer"],
  analytical: ["communication", "woo", "positivity"],
  communication: ["analytical", "deliberative", "strategic"],
  futuristic: ["focus", "achiever", "deliberative"],
  learner: ["input", "intellection", "strategic"],
  activator: ["deliberative", "analytical", "strategic"],
  deliberative: ["activator", "positivity", "ideation"],
  developer: ["maximizer", "command", "competition"],
  maximizer: ["developer", "includer", "restorative"],
  focus: ["adaptability", "ideation", "strategic"],
};

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
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    // Get current user's strengths
    const myStrengths = await prisma.memberStrength.findMany({
      where: { memberId, rank: { lte: 10 } },
      include: {
        theme: { include: { domain: { select: { slug: true } } } },
      },
      orderBy: { rank: "asc" },
    });

    if (myStrengths.length === 0) {
      return apiSuccess({
        suggestions: [],
        message: "Upload your CliftonStrengths to get mentor suggestions",
      });
    }

    // Get all other members with their strengths
    const allMembers = await prisma.organizationMember.findMany({
      where: {
        organizationId,
        status: "ACTIVE",
        id: { not: memberId },
      },
      include: {
        user: { select: { fullName: true, avatarUrl: true, jobTitle: true } },
        strengths: {
          where: { rank: { lte: 10 } },
          include: {
            theme: { include: { domain: { select: { slug: true } } } },
          },
          orderBy: { rank: "asc" },
        },
      },
    });

    // Calculate compatibility scores
    const suggestions: {
      member: typeof allMembers[0];
      score: number;
      reasons: string[];
      complementaryStrengths: string[];
    }[] = [];

    const myThemeSlugs = myStrengths.map((s) => s.theme.slug);
    const myTop3 = myStrengths.slice(0, 3).map((s) => s.theme.slug);

    for (const member of allMembers) {
      if (member.strengths.length === 0) continue;

      let score = 0;
      const reasons: string[] = [];
      const complementaryStrengths: string[] = [];

      const theirThemeSlugs = member.strengths.map((s) => s.theme.slug);
      const theirTop3 = member.strengths.slice(0, 3).map((s) => s.theme.slug);

      // Check for complementary strengths (their strengths complement mine)
      for (const myTheme of myTop3) {
        const complements = MENTORSHIP_PAIRINGS[myTheme] || [];
        for (const theirTheme of theirTop3) {
          if (complements.includes(theirTheme)) {
            score += 25;
            const themeName = member.strengths.find((s) => s.theme.slug === theirTheme)?.theme.name;
            if (themeName && !complementaryStrengths.includes(themeName)) {
              complementaryStrengths.push(themeName);
            }
          }
        }
      }

      // Check for different domain expertise
      const myDomains = new Set(myStrengths.slice(0, 5).map((s) => s.theme.domain.slug));
      const theirDomainsSet = new Set(member.strengths.slice(0, 5).map((s) => s.theme.domain.slug));
      const theirDomains = Array.from(theirDomainsSet);

      for (const domain of theirDomains) {
        if (!myDomains.has(domain)) {
          score += 15;
          if (!reasons.some((r) => r.includes("domain"))) {
            reasons.push(`Strong in ${domain} domain where you could grow`);
          }
        }
      }

      // Check for strengths I don't have in my top 10
      for (const theirStrength of member.strengths.slice(0, 5)) {
        if (!myThemeSlugs.includes(theirStrength.theme.slug)) {
          score += 5;
        }
      }

      // Add complementary strengths as reason
      if (complementaryStrengths.length > 0) {
        reasons.unshift(`Has ${complementaryStrengths.slice(0, 2).join(" & ")} - complementary to your strengths`);
      }

      if (score > 0) {
        suggestions.push({
          member,
          score,
          reasons,
          complementaryStrengths,
        });
      }
    }

    // Sort by score and take top suggestions
    suggestions.sort((a, b) => b.score - a.score);
    const topSuggestions = suggestions.slice(0, limit);

    return apiSuccess({
      suggestions: topSuggestions.map((s) => ({
        id: s.member.id,
        name: s.member.user.fullName,
        avatarUrl: s.member.user.avatarUrl,
        jobTitle: s.member.user.jobTitle,
        score: s.score,
        reasons: s.reasons.slice(0, 3),
        complementaryStrengths: s.complementaryStrengths.slice(0, 3),
        topStrengths: s.member.strengths.slice(0, 5).map((str) => ({
          name: str.theme.name,
          domain: str.theme.domain.slug,
        })),
      })),
    });
  } catch (error) {
    console.error("Error fetching mentor suggestions:", error);
    return apiError(ApiErrorCode.INTERNAL_ERROR, "Failed to fetch suggestions");
  }
}
