import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { streamText, CoreMessage } from "ai";
import { openai, checkAIReady, getFeatureSettings, checkAllLimits, logUsage } from "@/lib/ai";
import { prisma } from "@/lib/prisma";
import { buildUserContext, buildTeamContext, formatTeamContextForPrompt, formatUserContextForPrompt } from "@/lib/ai/context";

const SYSTEM_PROMPT = `You are the StrengthSync AI Coach — a personal strengths-based development coach inside a CliftonStrengths team collaboration app.

Your primary role is to help users grow, develop, and thrive by leveraging their unique CliftonStrengths profile. Think of yourself as a supportive coach who helps people translate self-awareness into action.

You help users:
1. Build a personal development plan around their top strengths
2. Identify and manage blind spots tied to their strengths profile
3. Find team members who complement their strengths for collaboration
4. Develop daily habits and strategies that align with how they naturally think, feel, and behave
5. Navigate challenges at work by applying their strengths intentionally
6. Understand their team's strengths composition and dynamics

Guidelines:
- Be warm, encouraging, and action-oriented — always suggest concrete next steps
- Ask reflective questions to help users think deeper about their growth
- Frame feedback through a strengths lens: focus on what's strong, not what's wrong
- Use the available tools to look up real data when needed
- When mentioning strengths, explain how they show up in everyday behavior
- If you don't have enough information, ask clarifying questions
- Celebrate progress and recognize effort

Available CliftonStrengths Domains:
- Executing: Achievement-oriented themes (Achiever, Arranger, Belief, Consistency, Deliberative, Discipline, Focus, Responsibility, Restorative)
- Influencing: Themes about taking charge (Activator, Command, Communication, Competition, Maximizer, Self-Assurance, Significance, Woo)
- Relationship Building: Connection themes (Adaptability, Connectedness, Developer, Empathy, Harmony, Includer, Individualization, Positivity, Relator)
- Strategic Thinking: Analytical themes (Analytical, Context, Futuristic, Ideation, Input, Intellection, Learner, Strategic)`;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const organizationId = session.user.organizationId;
    const memberId = session.user.memberId;

    if (!organizationId || !memberId) {
      return new Response(JSON.stringify({ error: "Organization membership required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const aiReady = checkAIReady();
    if (!aiReady.ready) {
      return new Response(JSON.stringify({ error: aiReady.reason }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check rate limits
    const rateLimitResult = await checkAllLimits(memberId, organizationId);
    if (!rateLimitResult.allowed) {
      return new Response(JSON.stringify({ error: rateLimitResult.reason }), {
        status: 429,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { messages, conversationId } = body as {
      messages: CoreMessage[];
      conversationId?: string;
    };

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Messages array required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get user and team context for personalization
    const [userContext, teamContext] = await Promise.all([
      buildUserContext(memberId),
      buildTeamContext(organizationId),
    ]);

    // Build context-aware system prompt
    let contextPrompt = SYSTEM_PROMPT;

    if (userContext) {
      contextPrompt += `\n\n=== CURRENT USER PROFILE ===\n${formatUserContextForPrompt(userContext)}`;
    }

    if (teamContext) {
      contextPrompt += `\n\n${formatTeamContextForPrompt(teamContext)}`;

      // Add individual team member details with ALL strengths
      if (teamContext.members.length > 0) {
        contextPrompt += `\n\n**Team Members - Complete CliftonStrengths Profiles:**`;
        for (const member of teamContext.members) {
          contextPrompt += `\n\n${member.name}${member.jobTitle ? ` (${member.jobTitle})` : ""}:`;
          if (member.allStrengths.length > 0) {
            // Group strengths into sections for readability
            const top5 = member.allStrengths.filter(s => s.rank <= 5);
            const ranks6to10 = member.allStrengths.filter(s => s.rank > 5 && s.rank <= 10);
            const ranks11to20 = member.allStrengths.filter(s => s.rank > 10 && s.rank <= 20);
            const bottom14 = member.allStrengths.filter(s => s.rank > 20);

            if (top5.length > 0) {
              contextPrompt += `\n  Top 5 (Signature Themes): ${top5.map(s => `${s.rank}. ${s.name} [${s.domain}]`).join(", ")}`;
            }
            if (ranks6to10.length > 0) {
              contextPrompt += `\n  Ranks 6-10: ${ranks6to10.map(s => `${s.rank}. ${s.name}`).join(", ")}`;
            }
            if (ranks11to20.length > 0) {
              contextPrompt += `\n  Ranks 11-20: ${ranks11to20.map(s => `${s.rank}. ${s.name}`).join(", ")}`;
            }
            if (bottom14.length > 0) {
              contextPrompt += `\n  Ranks 21-34 (Lesser Themes): ${bottom14.map(s => `${s.rank}. ${s.name}`).join(", ")}`;
            }
          }
        }
      }
    }

    const settings = getFeatureSettings("chat");
    const startTime = Date.now();

    // Stream the response
    const result = streamText({
      model: openai(settings.model),
      system: contextPrompt,
      messages,
      temperature: settings.temperature,
      maxOutputTokens: settings.maxTokens,
      onFinish: async ({ usage, text }) => {
        const latencyMs = Date.now() - startTime;

        // Log usage
        await logUsage({
          memberId,
          organizationId,
          feature: "chat",
          endpoint: "/api/ai/chat",
          usage: {
            promptTokens: usage.inputTokens ?? 0,
            completionTokens: usage.outputTokens ?? 0,
            totalTokens: (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0),
            model: settings.model,
            latencyMs,
          },
          responseSummary: text.substring(0, 200),
          success: true,
        });

        // Save to conversation if ID provided
        if (conversationId) {
          const lastUserMessage = messages.filter((m) => m.role === "user").pop();

          if (lastUserMessage && typeof lastUserMessage.content === "string") {
            await prisma.aIMessage.create({
              data: {
                conversationId,
                role: "USER",
                content: lastUserMessage.content,
              },
            });
          }

          await prisma.aIMessage.create({
            data: {
              conversationId,
              role: "ASSISTANT",
              content: text,
              promptTokens: usage.inputTokens ?? 0,
              completionTokens: usage.outputTokens ?? 0,
              totalTokens: (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0),
              model: settings.model,
              latencyMs,
            },
          });
        }
      },
    });

    // Return the streaming response
    return result.toTextStreamResponse();
  } catch (error) {
    console.error("[AI Chat Error]", error);
    return new Response(JSON.stringify({ error: "Failed to process chat" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// GET endpoint to retrieve conversation history
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const memberId = session.user.memberId;
    if (!memberId) {
      return new Response(JSON.stringify({ error: "Organization membership required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");

    if (conversationId) {
      // Get specific conversation
      const conversation = await prisma.aIConversation.findFirst({
        where: { id: conversationId, memberId },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
          },
        },
      });

      if (!conversation) {
        return new Response(JSON.stringify({ error: "Conversation not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ data: conversation }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // List recent conversations
    const conversations = await prisma.aIConversation.findMany({
      where: { memberId, status: "ACTIVE" },
      orderBy: { updatedAt: "desc" },
      take: 20,
      include: {
        _count: { select: { messages: true } },
      },
    });

    return new Response(JSON.stringify({ data: conversations }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[AI Chat GET Error]", error);
    return new Response(JSON.stringify({ error: "Failed to fetch conversations" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
