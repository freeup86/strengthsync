import { prisma } from "@/lib/prisma";
import { checkAndAwardBadges } from "@/lib/gamification/badge-engine";

/**
 * Teams Bot Command Handlers
 *
 * Processes commands from Teams users and returns Adaptive Card responses.
 * Handles identity linking: unknown Teams users get a sign-in card.
 */

interface AdaptiveCardBody {
  type: string;
  text?: string;
  size?: string;
  weight?: string;
  color?: string;
  wrap?: boolean;
  spacing?: string;
  separator?: boolean;
  columns?: AdaptiveCardBody[];
  items?: AdaptiveCardBody[];
  width?: string;
}

interface AdaptiveCardAction {
  type: string;
  title: string;
  url?: string;
}

interface AdaptiveCardResponse {
  $schema: string;
  type: string;
  version: string;
  body: AdaptiveCardBody[];
  actions?: AdaptiveCardAction[];
}

const APP_URL = process.env.NEXTAUTH_URL || "https://strengthsync.app";

/**
 * Resolve a Teams user ID to a StrengthSync user + member.
 * Returns null if no mapping exists.
 */
async function resolveTeamsUser(teamsUserId: string) {
  const mapping = await prisma.teamsUserMapping.findUnique({
    where: { teamsUserId },
    include: {
      user: {
        include: {
          organizationMemberships: {
            where: { status: "ACTIVE" },
            take: 1,
          },
        },
      },
    },
  });

  if (!mapping) return null;

  const membership = mapping.user.organizationMemberships[0];
  if (!membership) return null;

  return {
    userId: mapping.userId,
    memberId: membership.id,
    organizationId: membership.organizationId,
    userName: mapping.user.fullName,
  };
}

/**
 * Build a sign-in card for unlinked Teams users.
 */
function buildSignInCard(): AdaptiveCardResponse {
  return {
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
        text: "To use StrengthSync commands in Teams, you need to link your account first. Click the button below to sign in.",
        wrap: true,
        spacing: "Small",
      },
    ],
    actions: [
      {
        type: "Action.OpenUrl",
        title: "Link Account",
        url: `${APP_URL}/settings/profile?teamsLink=true`,
      },
    ],
  };
}

/**
 * Build the help card showing available commands.
 */
function buildHelpCard(): AdaptiveCardResponse {
  return {
    $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
    type: "AdaptiveCard",
    version: "1.4",
    body: [
      {
        type: "TextBlock",
        text: "StrengthSync Commands",
        size: "Medium",
        weight: "Bolder",
      },
      {
        type: "TextBlock",
        text: "Here are the commands you can use:",
        wrap: true,
        spacing: "Small",
      },
      {
        type: "TextBlock",
        text: "**`/shoutout @person [message]`** — Give a shoutout to a team member",
        wrap: true,
        spacing: "Small",
      },
      {
        type: "TextBlock",
        text: "**`/strengths @person`** — View someone's top 5 CliftonStrengths",
        wrap: true,
        spacing: "None",
      },
      {
        type: "TextBlock",
        text: "**`/requests`** — List open skill requests in your organization",
        wrap: true,
        spacing: "None",
      },
      {
        type: "TextBlock",
        text: "**`/help`** — Show this help message",
        wrap: true,
        spacing: "None",
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

// Domain color names for theme display
const domainColorMap: Record<string, string> = {
  executing: "Accent",
  influencing: "Warning",
  relationship: "Default",
  strategic: "Good",
};

/**
 * Handle /strengths command — show a person's top 5 themes.
 */
async function handleStrengthsCommand(
  organizationId: string,
  targetName: string
): Promise<AdaptiveCardResponse> {
  // Remove @ prefix if present
  const name = targetName.replace(/^@/, "").trim();

  if (!name) {
    return {
      $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
      type: "AdaptiveCard",
      version: "1.4",
      body: [
        {
          type: "TextBlock",
          text: "Please specify a person: `/strengths @person`",
          wrap: true,
        },
      ],
    };
  }

  // Search for member by name (fuzzy match)
  const member = await prisma.organizationMember.findFirst({
    where: {
      organizationId,
      status: "ACTIVE",
      user: {
        fullName: { contains: name, mode: "insensitive" },
      },
    },
    include: {
      user: { select: { fullName: true, jobTitle: true } },
      strengths: {
        where: { rank: { lte: 5 } },
        include: {
          theme: {
            include: { domain: { select: { slug: true, name: true } } },
          },
        },
        orderBy: { rank: "asc" },
      },
    },
  });

  if (!member) {
    return {
      $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
      type: "AdaptiveCard",
      version: "1.4",
      body: [
        {
          type: "TextBlock",
          text: `Could not find a team member named "${name}". Make sure they've uploaded their strengths.`,
          wrap: true,
        },
      ],
    };
  }

  if (member.strengths.length === 0) {
    return {
      $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
      type: "AdaptiveCard",
      version: "1.4",
      body: [
        {
          type: "TextBlock",
          text: `${member.user.fullName} hasn't uploaded their CliftonStrengths yet.`,
          wrap: true,
        },
      ],
    };
  }

  const themeLines = member.strengths.map((s) => {
    const color = domainColorMap[s.theme.domain.slug] || "Default";
    return {
      type: "TextBlock" as const,
      text: `**${s.rank}.** ${s.theme.name} _(${s.theme.domain.name})_`,
      color,
      wrap: true,
      spacing: "None" as const,
    };
  });

  return {
    $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
    type: "AdaptiveCard",
    version: "1.4",
    body: [
      {
        type: "TextBlock",
        text: `${member.user.fullName}'s Top 5 Strengths`,
        size: "Medium",
        weight: "Bolder",
      },
      ...(member.user.jobTitle
        ? [{ type: "TextBlock" as const, text: member.user.jobTitle, spacing: "None" as const, color: "Default" as const }]
        : []),
      { type: "TextBlock", text: "", separator: true },
      ...themeLines,
    ],
    actions: [
      {
        type: "Action.OpenUrl",
        title: "View Full Profile",
        url: `${APP_URL}/directory`,
      },
    ],
  };
}

/**
 * Handle /shoutout command — create a shoutout.
 */
async function handleShoutoutCommand(
  memberId: string,
  organizationId: string,
  args: string
): Promise<AdaptiveCardResponse> {
  // Parse: @person message
  const match = args.match(/^@?(\S+)\s+(.+)$/s);

  if (!match) {
    return {
      $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
      type: "AdaptiveCard",
      version: "1.4",
      body: [
        {
          type: "TextBlock",
          text: "Usage: `/shoutout @person Your message here`",
          wrap: true,
        },
      ],
    };
  }

  const [, targetName, message] = match;

  if (message.length < 10) {
    return {
      $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
      type: "AdaptiveCard",
      version: "1.4",
      body: [
        {
          type: "TextBlock",
          text: "Shoutout message must be at least 10 characters.",
          wrap: true,
        },
      ],
    };
  }

  // Find the recipient
  const receiver = await prisma.organizationMember.findFirst({
    where: {
      organizationId,
      status: "ACTIVE",
      user: {
        fullName: { contains: targetName, mode: "insensitive" },
      },
    },
    include: {
      user: { select: { id: true, fullName: true } },
    },
  });

  if (!receiver) {
    return {
      $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
      type: "AdaptiveCard",
      version: "1.4",
      body: [
        {
          type: "TextBlock",
          text: `Could not find a team member named "${targetName}".`,
          wrap: true,
        },
      ],
    };
  }

  if (receiver.id === memberId) {
    return {
      $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
      type: "AdaptiveCard",
      version: "1.4",
      body: [
        {
          type: "TextBlock",
          text: "You can't give a shoutout to yourself!",
          wrap: true,
        },
      ],
    };
  }

  // Get the giver's name
  const giver = await prisma.organizationMember.findUnique({
    where: { id: memberId },
    include: { user: { select: { fullName: true } } },
  });

  // Create the shoutout
  const shoutout = await prisma.shoutout.create({
    data: {
      organizationId,
      giverId: memberId,
      receiverId: receiver.id,
      message: message.substring(0, 500),
      isPublic: true,
    },
  });

  // Award points
  await prisma.$transaction([
    prisma.organizationMember.update({
      where: { id: memberId },
      data: { points: { increment: 5 } },
    }),
    prisma.organizationMember.update({
      where: { id: receiver.id },
      data: { points: { increment: 10 } },
    }),
  ]);

  // Create feed item
  await prisma.feedItem.create({
    data: {
      organizationId,
      creatorId: memberId,
      itemType: "SHOUTOUT",
      content: JSON.parse(JSON.stringify({
        message: shoutout.message,
        receiverName: receiver.user.fullName,
      })),
      shoutoutId: shoutout.id,
    },
  });

  // Create notification
  await prisma.notification.create({
    data: {
      userId: receiver.user.id,
      type: "SHOUTOUT_RECEIVED",
      title: "You received a shoutout from Teams!",
      message: `${giver?.user.fullName || "A teammate"} recognized you via Teams`,
      link: "/shoutouts",
    },
  });

  // Badge engine
  await checkAndAwardBadges(memberId, "shoutout_given");
  await checkAndAwardBadges(receiver.id, "shoutout_received");

  return {
    $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
    type: "AdaptiveCard",
    version: "1.4",
    body: [
      {
        type: "TextBlock",
        text: "Shoutout sent!",
        size: "Medium",
        weight: "Bolder",
        color: "Good",
      },
      {
        type: "TextBlock",
        text: `You recognized **${receiver.user.fullName}**: "${message.substring(0, 100)}${message.length > 100 ? "..." : ""}"`,
        wrap: true,
        spacing: "Small",
      },
      {
        type: "TextBlock",
        text: "+5 points for giving recognition!",
        size: "Small",
        color: "Accent",
      },
    ],
    actions: [
      {
        type: "Action.OpenUrl",
        title: "View on StrengthSync",
        url: `${APP_URL}/shoutouts`,
      },
    ],
  };
}

/**
 * Handle /requests command — list open skill requests.
 */
async function handleRequestsCommand(
  organizationId: string
): Promise<AdaptiveCardResponse> {
  const requests = await prisma.skillRequest.findMany({
    where: {
      organizationId,
      status: { in: ["OPEN", "IN_PROGRESS"] },
    },
    include: {
      creator: {
        include: { user: { select: { fullName: true } } },
      },
      theme: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  if (requests.length === 0) {
    return {
      $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
      type: "AdaptiveCard",
      version: "1.4",
      body: [
        {
          type: "TextBlock",
          text: "No open skill requests right now. Check back later!",
          wrap: true,
        },
      ],
    };
  }

  const requestLines = requests.map((r) => ({
    type: "TextBlock" as const,
    text: `**${r.title}** — by ${r.creator.user.fullName} _(${r.urgency.toLowerCase()})_`,
    wrap: true,
    spacing: "Small" as const,
  }));

  return {
    $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
    type: "AdaptiveCard",
    version: "1.4",
    body: [
      {
        type: "TextBlock",
        text: "Open Skill Requests",
        size: "Medium",
        weight: "Bolder",
      },
      {
        type: "TextBlock",
        text: `${requests.length} request${requests.length !== 1 ? "s" : ""} looking for help:`,
        spacing: "Small",
        wrap: true,
      },
      ...requestLines,
    ],
    actions: [
      {
        type: "Action.OpenUrl",
        title: "View All Requests",
        url: `${APP_URL}/marketplace`,
      },
    ],
  };
}

/**
 * Main command router.
 * Parses the incoming message text and dispatches to the appropriate handler.
 */
export async function handleTeamsBotCommand(
  teamsUserId: string,
  messageText: string
): Promise<AdaptiveCardResponse> {
  try {
    // Resolve the Teams user
    const user = await resolveTeamsUser(teamsUserId);

    // Normalize the command
    const text = messageText.trim();
    const commandMatch = text.match(/^\/(\w+)(?:\s+(.*))?$/s);

    // If no command syntax, check for help-like messages
    if (!commandMatch) {
      if (!user) return buildSignInCard();
      return buildHelpCard();
    }

    const command = commandMatch[1].toLowerCase();
    const args = (commandMatch[2] || "").trim();

    // Help doesn't require auth
    if (command === "help") {
      return buildHelpCard();
    }

    // All other commands require authentication
    if (!user) {
      return buildSignInCard();
    }

    switch (command) {
      case "strengths":
        return handleStrengthsCommand(user.organizationId, args);

      case "shoutout":
        return handleShoutoutCommand(
          user.memberId,
          user.organizationId,
          args
        );

      case "requests":
        return handleRequestsCommand(user.organizationId);

      default:
        return {
          $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
          type: "AdaptiveCard",
          version: "1.4",
          body: [
            {
              type: "TextBlock",
              text: `Unknown command: \`/${command}\`. Type \`/help\` to see available commands.`,
              wrap: true,
            },
          ],
        };
    }
  } catch (error) {
    console.error("[Teams Bot] Command error:", error);
    return {
      $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
      type: "AdaptiveCard",
      version: "1.4",
      body: [
        {
          type: "TextBlock",
          text: "Something went wrong processing your command. Please try again.",
          wrap: true,
        },
      ],
    };
  }
}
