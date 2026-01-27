import { NextRequest, NextResponse } from "next/server";
import {
  CloudAdapter,
  ConfigurationBotFrameworkAuthentication,
  ConfigurationBotFrameworkAuthenticationOptions,
  ActivityHandler,
  TurnContext,
  CardFactory,
} from "botbuilder";
import { handleTeamsBotCommand } from "@/lib/integrations/teams-bot-handlers";

/**
 * POST /api/integrations/teams-bot
 *
 * Bot Framework messaging endpoint.
 * Receives Activity objects from Teams and responds with Adaptive Cards.
 *
 * Requires MICROSOFT_APP_ID and MICROSOFT_APP_PASSWORD environment variables.
 *
 * Note: The Bot Framework's CloudAdapter expects Node.js http.IncomingMessage/ServerResponse
 * objects, which differ from Next.js App Router's Web API Request/Response.
 * We bridge this by constructing a compatible shim object.
 */

// Bot Framework authentication config
const botFrameworkAuthConfig: ConfigurationBotFrameworkAuthenticationOptions = {
  MicrosoftAppId: process.env.MICROSOFT_APP_ID || "",
  MicrosoftAppPassword: process.env.MICROSOFT_APP_PASSWORD || "",
  MicrosoftAppType: "SingleTenant",
  MicrosoftAppTenantId: process.env.MICROSOFT_APP_TENANT_ID || "",
};

const botFrameworkAuth = new ConfigurationBotFrameworkAuthentication(
  botFrameworkAuthConfig
);
const adapter = new CloudAdapter(botFrameworkAuth);

// Error handler
adapter.onTurnError = async (context: TurnContext, error: Error) => {
  console.error(`[Teams Bot] Unhandled error: ${error.message}`, error);
  await context.sendActivity(
    "Sorry, something went wrong processing your message. Please try again."
  );
};

// Bot handler
class StrengthSyncBot extends ActivityHandler {
  constructor() {
    super();

    this.onMessage(async (context: TurnContext, next) => {
      const messageText = context.activity.text || "";
      const teamsUserId = context.activity.from?.aadObjectId || context.activity.from?.id || "";

      if (!teamsUserId) {
        await context.sendActivity("Unable to identify your Teams account.");
        return next();
      }

      // Process the command
      const card = await handleTeamsBotCommand(teamsUserId, messageText);

      // Send adaptive card response
      const adaptiveCard = CardFactory.adaptiveCard(card);
      await context.sendActivity({ attachments: [adaptiveCard] });

      return next();
    });

    this.onMembersAdded(async (context: TurnContext, next) => {
      for (const member of context.activity.membersAdded || []) {
        if (member.id !== context.activity.recipient.id) {
          const welcomeCard = CardFactory.adaptiveCard({
            $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
            type: "AdaptiveCard",
            version: "1.4",
            body: [
              {
                type: "TextBlock",
                text: "Welcome to StrengthSync!",
                size: "Medium",
                weight: "Bolder",
              },
              {
                type: "TextBlock",
                text: "I can help you interact with your team's CliftonStrengths right from Teams. Type `/help` to see what I can do!",
                wrap: true,
                spacing: "Small",
              },
            ],
            actions: [
              {
                type: "Action.OpenUrl",
                title: "Open StrengthSync",
                url: process.env.NEXTAUTH_URL || "https://strengthsync.app",
              },
            ],
          });

          await context.sendActivity({ attachments: [welcomeCard] });
        }
      }
      return next();
    });
  }
}

const bot = new StrengthSyncBot();

export async function POST(request: NextRequest) {
  try {
    // Verify that bot credentials are configured
    if (!process.env.MICROSOFT_APP_ID || !process.env.MICROSOFT_APP_PASSWORD) {
      console.warn("[Teams Bot] MICROSOFT_APP_ID or MICROSOFT_APP_PASSWORD not configured");
      return NextResponse.json(
        { error: "Bot not configured" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const authHeader = request.headers.get("authorization") || "";

    // Bridge Next.js App Router Request to Bot Framework compatible format.
    // CloudAdapter.process expects a Node-style Request with a body property.
    const shimRequest = {
      body,
      headers: {
        authorization: authHeader,
        "content-type": "application/json",
      },
      method: "POST",
      url: request.url,
    };

    // Shim response to collect status/body
    let responseStatus = 200;
    let responseBody = "";
    const shimResponse = {
      status: (code: number) => {
        responseStatus = code;
        return shimResponse;
      },
      send: (data: string) => {
        responseBody = data;
        return shimResponse;
      },
      end: () => shimResponse,
      setHeader: () => shimResponse,
      writeHead: () => shimResponse,
      write: (data: string) => {
        responseBody = data;
        return true;
      },
    };

    // Process the Bot Framework activity
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (adapter as any).process(
      shimRequest,
      shimResponse,
      async (context: TurnContext) => {
        await bot.run(context);
      }
    );

    return new NextResponse(responseBody || null, { status: responseStatus });
  } catch (error) {
    console.error("[Teams Bot] Route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
