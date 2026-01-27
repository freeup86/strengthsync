import { prisma } from "@/lib/prisma";

/**
 * Microsoft Teams Incoming Webhook Integration
 *
 * Sends Adaptive Card notifications to a Teams channel.
 * Uses the Incoming Webhook connector format.
 *
 * Webhook URL resolution: Organization.settings.teamsWebhookUrl → env TEAMS_WEBHOOK_URL fallback.
 * All operations are fire-and-forget — errors logged but never propagated.
 */

// Adaptive Card types
interface AdaptiveCardElement {
  type: string;
  text?: string;
  size?: string;
  weight?: string;
  color?: string;
  wrap?: boolean;
  spacing?: string;
  separator?: boolean;
  columns?: AdaptiveCardElement[];
  items?: AdaptiveCardElement[];
  width?: string;
  style?: string;
  url?: string;
  title?: string;
}

interface AdaptiveCardAction {
  type: string;
  title: string;
  url: string;
}

interface AdaptiveCard {
  $schema: string;
  type: string;
  version: string;
  body: AdaptiveCardElement[];
  actions?: AdaptiveCardAction[];
}

interface TeamsMessage {
  type: string;
  attachments: {
    contentType: string;
    content: AdaptiveCard;
  }[];
}

/**
 * Resolve the Teams webhook URL for an organization.
 * Checks Organization.settings first, then env var fallback.
 */
async function resolveWebhookUrl(organizationId: string): Promise<string | null> {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { settings: true },
    });

    const settings = org?.settings as Record<string, unknown> | null;
    const orgUrl = settings?.teamsWebhookUrl as string | undefined;

    if (orgUrl && orgUrl.startsWith("https://")) {
      return orgUrl;
    }
  } catch (err) {
    console.error("[Teams Webhook] Error reading org settings:", err);
  }

  // Fallback to environment variable
  return process.env.TEAMS_WEBHOOK_URL || null;
}

/**
 * Send an Adaptive Card to the Teams webhook.
 * Fire-and-forget: never throws, errors are logged.
 */
async function sendCard(webhookUrl: string, card: AdaptiveCard): Promise<boolean> {
  const message: TeamsMessage = {
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        content: card,
      },
    ],
  };

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[Teams Webhook] HTTP ${res.status}: ${text}`);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[Teams Webhook] Send failed:", err);
    return false;
  }
}

/**
 * Send a Teams notification for an organization.
 * Graceful no-op if no webhook URL configured.
 */
export async function sendTeamsNotification(
  organizationId: string,
  card: AdaptiveCard
): Promise<void> {
  const webhookUrl = await resolveWebhookUrl(organizationId);
  if (!webhookUrl) return;

  // Fire-and-forget — don't await in the caller
  sendCard(webhookUrl, card).catch((err) =>
    console.error("[Teams Webhook] Unhandled error:", err)
  );
}

/**
 * Send a test card to verify the webhook URL works.
 * Unlike sendTeamsNotification, this returns the result.
 */
export async function sendTestCard(webhookUrl: string): Promise<boolean> {
  const card = buildTestCard();
  return sendCard(webhookUrl, card);
}

// ============================================================================
// Card Builders
// ============================================================================

const APP_URL = process.env.NEXTAUTH_URL || "https://strengthsync.app";

/**
 * Build a shoutout notification card
 */
export function buildShoutoutCard(
  giverName: string,
  receiverName: string,
  themeName: string | null,
  message: string
): AdaptiveCard {
  const body: AdaptiveCardElement[] = [
    {
      type: "TextBlock",
      text: "StrengthSync Shoutout",
      size: "Small",
      color: "Accent",
      weight: "Bolder",
    },
    {
      type: "TextBlock",
      text: `${giverName} recognized ${receiverName}${themeName ? ` for their ${themeName} strength` : ""}`,
      size: "Medium",
      weight: "Bolder",
      wrap: true,
    },
    {
      type: "TextBlock",
      text: `"${message.length > 200 ? message.substring(0, 200) + "..." : message}"`,
      wrap: true,
      spacing: "Small",
    },
  ];

  return {
    $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
    type: "AdaptiveCard",
    version: "1.4",
    body,
    actions: [
      {
        type: "Action.OpenUrl",
        title: "View in StrengthSync",
        url: `${APP_URL}/shoutouts`,
      },
    ],
  };
}

/**
 * Build a badge earned notification card
 */
export function buildBadgeEarnedCard(
  memberName: string,
  badgeName: string,
  tier: string,
  points: number
): AdaptiveCard {
  return {
    $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
    type: "AdaptiveCard",
    version: "1.4",
    body: [
      {
        type: "TextBlock",
        text: "StrengthSync Badge Earned",
        size: "Small",
        color: "Accent",
        weight: "Bolder",
      },
      {
        type: "TextBlock",
        text: `${memberName} earned the "${badgeName}" badge!`,
        size: "Medium",
        weight: "Bolder",
        wrap: true,
      },
      {
        type: "ColumnSet",
        columns: [
          {
            type: "Column",
            width: "auto",
            items: [
              {
                type: "TextBlock",
                text: `Tier: ${tier}`,
                size: "Small",
                color: "Good",
              },
            ],
          },
          {
            type: "Column",
            width: "auto",
            items: [
              {
                type: "TextBlock",
                text: `+${points} points`,
                size: "Small",
                weight: "Bolder",
              },
            ],
          },
        ],
      },
    ],
    actions: [
      {
        type: "Action.OpenUrl",
        title: "View Leaderboard",
        url: `${APP_URL}/leaderboard`,
      },
    ],
  };
}

/**
 * Build a skill request notification card
 */
export function buildSkillRequestCard(
  creatorName: string,
  title: string,
  urgency: string
): AdaptiveCard {
  const urgencyColors: Record<string, string> = {
    LOW: "Default",
    NORMAL: "Default",
    HIGH: "Warning",
    URGENT: "Attention",
  };

  return {
    $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
    type: "AdaptiveCard",
    version: "1.4",
    body: [
      {
        type: "TextBlock",
        text: "StrengthSync Skill Request",
        size: "Small",
        color: "Accent",
        weight: "Bolder",
      },
      {
        type: "TextBlock",
        text: `${creatorName} is looking for help`,
        size: "Medium",
        weight: "Bolder",
        wrap: true,
      },
      {
        type: "TextBlock",
        text: title,
        wrap: true,
        spacing: "Small",
      },
      {
        type: "TextBlock",
        text: `Urgency: ${urgency}`,
        size: "Small",
        color: urgencyColors[urgency] || "Default",
      },
    ],
    actions: [
      {
        type: "Action.OpenUrl",
        title: "View in Marketplace",
        url: `${APP_URL}/marketplace`,
      },
    ],
  };
}

/**
 * Build a mentorship update notification card
 */
export function buildMentorshipCard(
  actorName: string,
  action: string,
  otherName: string
): AdaptiveCard {
  const actionMessages: Record<string, string> = {
    accept: `${actorName} accepted a mentorship with ${otherName}`,
    decline: `${actorName} declined a mentorship request from ${otherName}`,
    complete: `${actorName} and ${otherName} completed their mentorship`,
    pause: `Mentorship between ${actorName} and ${otherName} has been paused`,
  };

  return {
    $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
    type: "AdaptiveCard",
    version: "1.4",
    body: [
      {
        type: "TextBlock",
        text: "StrengthSync Mentorship",
        size: "Small",
        color: "Accent",
        weight: "Bolder",
      },
      {
        type: "TextBlock",
        text: actionMessages[action] || `${actorName} updated a mentorship with ${otherName}`,
        size: "Medium",
        weight: "Bolder",
        wrap: true,
      },
    ],
    actions: [
      {
        type: "Action.OpenUrl",
        title: "View in StrengthSync",
        url: `${APP_URL}/mentorship`,
      },
    ],
  };
}

/**
 * Build a test card for webhook verification
 */
function buildTestCard(): AdaptiveCard {
  return {
    $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
    type: "AdaptiveCard",
    version: "1.4",
    body: [
      {
        type: "TextBlock",
        text: "StrengthSync",
        size: "Small",
        color: "Accent",
        weight: "Bolder",
      },
      {
        type: "TextBlock",
        text: "Teams integration is working!",
        size: "Medium",
        weight: "Bolder",
        wrap: true,
      },
      {
        type: "TextBlock",
        text: "This is a test message from StrengthSync. Your Teams webhook is configured correctly.",
        wrap: true,
        spacing: "Small",
      },
    ],
    actions: [
      {
        type: "Action.OpenUrl",
        title: "Open StrengthSync",
        url: APP_URL,
      },
    ],
  };
}
