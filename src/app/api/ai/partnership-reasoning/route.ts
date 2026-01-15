import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, ApiErrorCode } from "@/lib/api/response";
import { z } from "zod";
import { generate, checkAIReady } from "@/lib/ai";
import { buildUserContext, formatUserContextForPrompt } from "@/lib/ai/context/user-context";
import { COMPLEMENTARY_PAIRINGS, getThemeBySlug, THEMES } from "@/constants/strengths-data";

// Cache duration: 30 days
const CACHE_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

const partnershipReasoningSchema = z.object({
  member1Id: z.string().min(1, "Member 1 ID is required"),
  member2Id: z.string().min(1, "Member 2 ID is required"),
  context: z.string().optional(), // Optional project or collaboration context
});

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
    const validation = partnershipReasoningSchema.safeParse(body);

    if (!validation.success) {
      return apiError(ApiErrorCode.BAD_REQUEST, "Invalid input", {
        errors: validation.error.errors,
      });
    }

    const { member1Id, member2Id, context } = validation.data;

    // Sort member IDs for consistent cache key (always store smaller ID first)
    const [sortedMember1Id, sortedMember2Id] = [member1Id, member2Id].sort();

    // Build context for both members
    const [member1Context, member2Context] = await Promise.all([
      buildUserContext(member1Id),
      buildUserContext(member2Id),
    ]);

    if (!member1Context || !member2Context) {
      return apiError(ApiErrorCode.NOT_FOUND, "One or both members not found");
    }

    if (member1Context.topStrengths.length === 0 || member2Context.topStrengths.length === 0) {
      return apiError(
        ApiErrorCode.BAD_REQUEST,
        "Both members need strength profiles to analyze partnership potential"
      );
    }

    // Get current strengths for cache validation
    const currentMember1Strengths = member1Context.topStrengths.map((s) => s.name).sort();
    const currentMember2Strengths = member2Context.topStrengths.map((s) => s.name).sort();

    // Check for cached reasoning
    const cachedReasoning = await prisma.partnershipReasoning.findUnique({
      where: {
        organizationId_member1Id_member2Id: {
          organizationId,
          member1Id: sortedMember1Id,
          member2Id: sortedMember2Id,
        },
      },
    });

    // Return cached reasoning if valid (not expired and strengths haven't changed)
    if (cachedReasoning && cachedReasoning.expiresAt > new Date()) {
      // Check if strengths are still the same (sorted for comparison)
      const cachedM1Strengths = [...cachedReasoning.member1Strengths].sort();
      const cachedM2Strengths = [...cachedReasoning.member2Strengths].sort();

      // Compare sorted strengths based on which member is which
      const sortedCurrentM1 = sortedMember1Id === member1Id ? currentMember1Strengths : currentMember2Strengths;
      const sortedCurrentM2 = sortedMember1Id === member1Id ? currentMember2Strengths : currentMember1Strengths;

      const strengthsMatch =
        JSON.stringify(cachedM1Strengths) === JSON.stringify(sortedCurrentM1) &&
        JSON.stringify(cachedM2Strengths) === JSON.stringify(sortedCurrentM2);

      if (strengthsMatch) {
        console.log(`[AI Partnership Reasoning] Returning cached analysis for ${member1Context.fullName} + ${member2Context.fullName}`);
        return apiSuccess({
          reasoning: cachedReasoning.reasoning,
          partners: {
            member1: {
              id: member1Id,
              name: member1Context.fullName,
              topStrengths: member1Context.topStrengths.map((s) => s.name),
              dominantDomain: member1Context.dominantDomain,
            },
            member2: {
              id: member2Id,
              name: member2Context.fullName,
              topStrengths: member2Context.topStrengths.map((s) => s.name),
              dominantDomain: member2Context.dominantDomain,
            },
          },
          cached: true,
          cachedAt: cachedReasoning.generatedAt,
        });
      }
    }

    // Need to generate new reasoning - check if AI is ready
    const aiReady = checkAIReady();
    if (!aiReady.ready) {
      return apiError(ApiErrorCode.INTERNAL_ERROR, aiReady.reason || "AI service unavailable");
    }

    // Find known complementary pairings between their strengths
    const knownPairings: string[] = [];
    for (const s1 of member1Context.topStrengths) {
      for (const s2 of member2Context.topStrengths) {
        const pairing = COMPLEMENTARY_PAIRINGS.find(
          (p) =>
            (p.theme1 === s1.name.toLowerCase() && p.theme2 === s2.name.toLowerCase()) ||
            (p.theme1 === s2.name.toLowerCase() && p.theme2 === s1.name.toLowerCase())
        );
        if (pairing) {
          knownPairings.push(`${s1.name} + ${s2.name}: ${pairing.description} (${pairing.synergyType})`);
        }
      }
    }

    // Get theme details for richer context
    const member1ThemeDetails = member1Context.topStrengths.map((s) => {
      const theme = THEMES.find((t) => t.name === s.name);
      return {
        name: s.name,
        domain: s.domain,
        worksWith: theme?.worksWith || [],
        blindSpots: theme?.blindSpots || [],
      };
    });

    const member2ThemeDetails = member2Context.topStrengths.map((s) => {
      const theme = THEMES.find((t) => t.name === s.name);
      return {
        name: s.name,
        domain: s.domain,
        worksWith: theme?.worksWith || [],
        blindSpots: theme?.blindSpots || [],
      };
    });

    const systemPrompt = `You are a CliftonStrengths consultant and team dynamics expert for StrengthSync.

Your role is to explain why two team members would make excellent partners based on their CliftonStrengths profiles.

The four CliftonStrengths domains are:
- **Executing**: Make things happen (Achiever, Arranger, Belief, Consistency, Deliberative, Discipline, Focus, Responsibility, Restorative)
- **Influencing**: Take charge and persuade (Activator, Command, Communication, Competition, Maximizer, Self-Assurance, Significance, Woo)
- **Relationship Building**: Build strong bonds (Adaptability, Connectedness, Developer, Empathy, Harmony, Includer, Individualization, Positivity, Relator)
- **Strategic Thinking**: Analyze and plan (Analytical, Context, Futuristic, Ideation, Input, Intellection, Learner, Strategic)

When analyzing partnerships:
1. Look for complementary strengths (one person's strength covers another's gap)
2. Identify potential synergies where strengths amplify each other
3. Consider domain balance for well-rounded collaboration
4. Note specific project types or situations where this pairing would excel
5. Acknowledge potential friction points and how to navigate them

Be specific, warm, and actionable. Use their actual strength names.`;

    let userPrompt = `Analyze the partnership potential between these two team members:

**Partner 1: ${member1Context.fullName}**
${member1Context.jobTitle ? `Role: ${member1Context.jobTitle}` : ""}
Top Strengths:
${member1ThemeDetails.map((t, i) => `${i + 1}. ${t.name} (${t.domain}) - Works well with: ${t.worksWith.slice(0, 3).join(", ")}`).join("\n")}
Dominant Domain: ${member1Context.dominantDomain || "Balanced"}

**Partner 2: ${member2Context.fullName}**
${member2Context.jobTitle ? `Role: ${member2Context.jobTitle}` : ""}
Top Strengths:
${member2ThemeDetails.map((t, i) => `${i + 1}. ${t.name} (${t.domain}) - Works well with: ${t.worksWith.slice(0, 3).join(", ")}`).join("\n")}
Dominant Domain: ${member2Context.dominantDomain || "Balanced"}`;

    if (knownPairings.length > 0) {
      userPrompt += `\n\n**Known Complementary Pairings:**\n${knownPairings.join("\n")}`;
    }

    if (context) {
      userPrompt += `\n\n**Collaboration Context:** ${context}`;
    }

    userPrompt += `\n\nProvide a concise but insightful analysis (3-4 paragraphs) covering:
1. **Why this partnership works** - The core synergy
2. **What they can accomplish together** - Specific scenarios or project types
3. **How to maximize the partnership** - Practical collaboration tips
4. **Watch out for** - Potential friction and mitigation strategies`;

    const result = await generate({
      memberId,
      organizationId,
      feature: "partnership-reasoning",
      prompt: userPrompt,
      systemPrompt,
    });

    if (!result.success || !result.data) {
      console.error("[AI Partnership Reasoning] Generation failed:", result.error);
      return apiError(
        ApiErrorCode.INTERNAL_ERROR,
        result.error || "Failed to generate partnership analysis"
      );
    }

    const generatedReasoning = result.data;
    console.log(`[AI Partnership Reasoning] Generated new analysis for ${member1Context.fullName} + ${member2Context.fullName}`);

    // Cache the reasoning for future requests
    const expiresAt = new Date(Date.now() + CACHE_DURATION_MS);
    const sortedM1Strengths = sortedMember1Id === member1Id ? currentMember1Strengths : currentMember2Strengths;
    const sortedM2Strengths = sortedMember1Id === member1Id ? currentMember2Strengths : currentMember1Strengths;

    await prisma.partnershipReasoning.upsert({
      where: {
        organizationId_member1Id_member2Id: {
          organizationId,
          member1Id: sortedMember1Id,
          member2Id: sortedMember2Id,
        },
      },
      create: {
        organizationId,
        member1Id: sortedMember1Id,
        member2Id: sortedMember2Id,
        reasoning: generatedReasoning,
        member1Strengths: sortedM1Strengths,
        member2Strengths: sortedM2Strengths,
        expiresAt,
      },
      update: {
        reasoning: generatedReasoning,
        member1Strengths: sortedM1Strengths,
        member2Strengths: sortedM2Strengths,
        generatedAt: new Date(),
        expiresAt,
      },
    });

    return apiSuccess({
      reasoning: generatedReasoning,
      partners: {
        member1: {
          id: member1Id,
          name: member1Context.fullName,
          topStrengths: member1Context.topStrengths.map((s) => s.name),
          dominantDomain: member1Context.dominantDomain,
        },
        member2: {
          id: member2Id,
          name: member2Context.fullName,
          topStrengths: member2Context.topStrengths.map((s) => s.name),
          dominantDomain: member2Context.dominantDomain,
        },
      },
      knownPairings: knownPairings.length,
      usage: result.usage,
    });
  } catch (error) {
    console.error("[AI Partnership Reasoning Error]", error);
    return apiError(ApiErrorCode.INTERNAL_ERROR, "Failed to analyze partnership");
  }
}
