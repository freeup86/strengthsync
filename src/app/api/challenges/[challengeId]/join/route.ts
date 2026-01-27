import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, ApiErrorCode } from "@/lib/api/response";
import { THEMES } from "@/constants/strengths-data";
import { checkAndAwardBadges } from "@/lib/gamification/badge-engine";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ challengeId: string }> }
) {
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

    const { challengeId } = await params;

    // Get challenge
    const challenge = await prisma.teamChallenge.findFirst({
      where: {
        id: challengeId,
        organizationId,
      },
    });

    if (!challenge) {
      return apiError(ApiErrorCode.NOT_FOUND, "Challenge not found");
    }

    // Check if already participating
    const existing = await prisma.challengeParticipant.findUnique({
      where: {
        challengeId_memberId: {
          challengeId,
          memberId,
        },
      },
    });

    if (existing) {
      return apiError(ApiErrorCode.CONFLICT, "Already participating in this challenge");
    }

    // Check if challenge is active
    if (challenge.status !== "ACTIVE" && challenge.status !== "UPCOMING") {
      return apiError(ApiErrorCode.BAD_REQUEST, "This challenge is no longer accepting participants");
    }

    // Generate initial progress based on challenge type
    const initialProgress = generateInitialProgress(challenge.challengeType, challenge.rules as Record<string, unknown>);

    // Create participant
    const participant = await prisma.challengeParticipant.create({
      data: {
        challengeId,
        memberId,
        progress: JSON.parse(JSON.stringify(initialProgress)),
        score: 0,
      },
    });

    // Badge engine: check for challenge-joined badges
    await checkAndAwardBadges(memberId, "challenge_joined");

    return apiSuccess({
      joined: true,
      progress: participant.progress,
    });
  } catch (error) {
    console.error("Error joining challenge:", error);
    return apiError(ApiErrorCode.INTERNAL_ERROR, "Failed to join challenge");
  }
}

function generateInitialProgress(type: string, rules: Record<string, unknown>): Record<string, unknown> {
  switch (type) {
    case "STRENGTHS_BINGO": {
      const gridSize = (rules.gridSize as number) || 5;
      // Generate a random bingo board with themes
      const shuffledThemes = [...THEMES].sort(() => Math.random() - 0.5);
      const board: { theme: string; domain: string; marked: boolean; markedBy?: string }[][] = [];

      let themeIndex = 0;
      for (let i = 0; i < gridSize; i++) {
        const row: { theme: string; domain: string; marked: boolean }[] = [];
        for (let j = 0; j < gridSize; j++) {
          // Center square is free space
          if (i === Math.floor(gridSize / 2) && j === Math.floor(gridSize / 2)) {
            row.push({
              theme: "FREE",
              domain: "free",
              marked: true,
            });
          } else {
            const theme = shuffledThemes[themeIndex % shuffledThemes.length];
            row.push({
              theme: theme.name,
              domain: theme.domain,
              marked: false,
            });
            themeIndex++;
          }
        }
        board.push(row);
      }

      return {
        board,
        completedLines: [],
        hasWon: false,
      };
    }
    case "SHOUTOUT_STREAK": {
      return {
        currentStreak: 0,
        targetStreak: (rules.targetDays as number) || 7,
        lastShoutoutDate: null,
        history: [],
      };
    }
    default:
      return {};
  }
}
