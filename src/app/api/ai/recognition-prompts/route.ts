import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { apiSuccess, apiError, ApiErrorCode } from "@/lib/api/response";
import { z } from "zod";
import { generateStructured, checkAIReady } from "@/lib/ai";
import { prisma } from "@/lib/prisma";
import { THEMES } from "@/constants/strengths-data";

const recognitionPromptsSchema = z.object({
  limit: z.number().min(1).max(5).optional().default(3),
});

// Structured output for recognition prompts - made more lenient
const recognitionPromptsOutputSchema = z.object({
  suggestions: z.array(
    z.object({
      memberId: z.string().describe("The exact member ID from the candidates list"),
      memberName: z.string().describe("The member's name"),
      recognitionReason: z.string().describe("Why to recognize this person (2-3 sentences)"),
      suggestedTheme: z.string().describe("Which CliftonStrength theme to highlight"),
      shoutoutStarter: z.string().describe("A ready-to-use shoutout message starter (1-2 sentences)"),
      context: z.string().describe("What specific behavior or contribution to recognize"),
    })
  ).describe("Array of recognition suggestions"),
  noSuggestionsReason: z.string().optional().describe("Explanation if no suggestions could be generated"),
}).describe("Recognition suggestions for team members");

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

    const aiReady = checkAIReady();
    if (!aiReady.ready) {
      return apiError(ApiErrorCode.INTERNAL_ERROR, aiReady.reason || "AI service unavailable");
    }

    const body = await request.json().catch(() => ({}));
    const validation = recognitionPromptsSchema.safeParse(body);

    if (!validation.success) {
      return apiError(ApiErrorCode.BAD_REQUEST, "Invalid input", {
        errors: validation.error.errors,
      });
    }

    const { limit } = validation.data;

    // Get the current user's info
    const currentMember = await prisma.organizationMember.findUnique({
      where: { id: memberId },
      include: {
        user: { select: { fullName: true } },
      },
    });

    if (!currentMember) {
      return apiError(ApiErrorCode.NOT_FOUND, "Member not found");
    }

    // Get recent shoutouts given by this user (to avoid suggesting people they recently recognized)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentlyRecognized = await prisma.shoutout.findMany({
      where: {
        giverId: memberId,
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { receiverId: true },
    });
    const recentlyRecognizedIds = new Set(recentlyRecognized.map((s) => s.receiverId));

    // Find team members with recent positive activity who haven't been recognized
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get members with recent activity
    const membersWithActivity = await prisma.organizationMember.findMany({
      where: {
        organizationId,
        id: { not: memberId }, // Exclude self
        status: "ACTIVE",
      },
      include: {
        user: { select: { fullName: true, jobTitle: true } },
        strengths: {
          where: { rank: { lte: 5 } },
          include: {
            theme: {
              include: { domain: { select: { name: true } } },
            },
          },
          orderBy: { rank: "asc" },
        },
        // Recent shoutouts given (shows active engagement)
        shoutoutsGiven: {
          where: { createdAt: { gte: sevenDaysAgo } },
          select: { id: true },
        },
        // Recent skill request help
        skillRequestResponses: {
          where: {
            createdAt: { gte: sevenDaysAgo },
            status: { in: ["OFFERED", "ACCEPTED", "COMPLETED"] },
          },
          include: {
            request: { select: { title: true } },
          },
        },
        // Recent challenge participation
        challengeParticipations: {
          where: { joinedAt: { gte: thirtyDaysAgo } },
          select: { completedAt: true },
        },
        // Mentoring activity
        mentorshipsAsMentor: {
          where: { status: "ACTIVE" },
          select: { id: true },
        },
      },
    });

    // Score and filter candidates
    const candidates = membersWithActivity
      .filter((m) => !recentlyRecognizedIds.has(m.id)) // Not recently recognized
      .filter((m) => m.strengths.length > 0) // Has strength profile
      .map((m) => {
        // Calculate activity score
        let activityScore = 0;
        const activities: string[] = [];

        if (m.shoutoutsGiven.length > 0) {
          activityScore += m.shoutoutsGiven.length * 10;
          activities.push(`Gave ${m.shoutoutsGiven.length} shoutout(s) this week`);
        }

        if (m.skillRequestResponses.length > 0) {
          activityScore += m.skillRequestResponses.length * 15;
          const requests = m.skillRequestResponses.map((r) => r.request.title).slice(0, 2);
          activities.push(`Helped with: ${requests.join(", ")}`);
        }

        if (m.challengeParticipations.length > 0) {
          const completed = m.challengeParticipations.filter((c) => c.completedAt).length;
          activityScore += completed * 20 + (m.challengeParticipations.length - completed) * 5;
          if (completed > 0) activities.push(`Completed ${completed} challenge(s)`);
        }

        if (m.mentorshipsAsMentor.length > 0) {
          activityScore += m.mentorshipsAsMentor.length * 25;
          activities.push(`Active mentor (${m.mentorshipsAsMentor.length} mentee(s))`);
        }

        return {
          id: m.id,
          name: m.user.fullName,
          jobTitle: m.user.jobTitle,
          strengths: m.strengths.map((s) => ({
            name: s.theme.name,
            domain: s.theme.domain.name,
          })),
          activityScore,
          activities,
        };
      })
      .filter((m) => m.activityScore > 0) // Has some recent positive activity
      .sort((a, b) => b.activityScore - a.activityScore)
      .slice(0, 10); // Top 10 for AI analysis

    if (candidates.length === 0) {
      return apiSuccess({
        suggestions: [],
        noSuggestionsReason:
          "No team members with recent recognizable activity found. Check back after team members have been active!",
      });
    }

    const systemPrompt = `You are a recognition coach for StrengthSync, a CliftonStrengths-based team collaboration app.

Your role is to help team members recognize their colleagues by suggesting specific, strengths-based shoutouts.

Guidelines for great recognition:
1. Be specific about the behavior or contribution
2. Connect the recognition to the person's CliftonStrengths
3. Make it feel personal and genuine, not generic
4. Focus on the impact they had on others or the team
5. Keep shoutout starters warm and professional

The four CliftonStrengths domains are:
- **Executing**: Getting things done efficiently
- **Influencing**: Persuading and energizing others
- **Relationship Building**: Connecting and supporting people
- **Strategic Thinking**: Analyzing and planning`;

    const userPrompt = `Suggest ${limit} team members that ${currentMember.user.fullName} should recognize this week.

**CANDIDATES TO CONSIDER:**
${candidates.map((c, i) => `
${i + 1}. ${c.name} (ID: ${c.id})
   ${c.jobTitle ? `Role: ${c.jobTitle}` : ""}
   Top Strengths: ${c.strengths.map((s) => `${s.name} [${s.domain}]`).join(", ")}
   Recent Activity:
   ${c.activities.map((a) => `   - ${a}`).join("\n")}
   Activity Score: ${c.activityScore}
`).join("\n")}

For each suggestion:
1. Identify the most recognition-worthy recent activity
2. Connect it to one of their CliftonStrengths themes
3. Provide a specific, ready-to-use shoutout starter message
4. Keep the tone warm and authentic`;

    const result = await generateStructured({
      memberId,
      organizationId,
      feature: "recognition-prompts",
      prompt: userPrompt,
      systemPrompt,
      schema: recognitionPromptsOutputSchema,
      schemaName: "recognition_suggestions",
    });

    if (!result.success) {
      console.error("[AI Recognition Prompts] Generation failed:", result.error);
      // Return empty suggestions as fallback instead of error
      return apiSuccess({
        suggestions: [],
        noSuggestionsReason: "AI couldn't generate suggestions at this time. Please try again later.",
      });
    }

    // Enrich with member avatars/details
    const enrichedSuggestions = result.data?.suggestions.map((s) => {
      const candidate = candidates.find((c) => c.id === s.memberId);
      return {
        ...s,
        memberStrengths: candidate?.strengths || [],
        recentActivities: candidate?.activities || [],
      };
    });

    console.log(`[AI Recognition Prompts] Generated ${enrichedSuggestions?.length || 0} suggestions for ${memberId}`);

    return apiSuccess({
      suggestions: enrichedSuggestions || [],
      noSuggestionsReason: result.data?.noSuggestionsReason,
      usage: result.usage,
    });
  } catch (error) {
    console.error("[AI Recognition Prompts Error]", error);
    return apiError(ApiErrorCode.INTERNAL_ERROR, "Failed to generate recognition prompts");
  }
}
