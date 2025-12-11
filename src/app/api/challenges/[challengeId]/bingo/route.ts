import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, ApiErrorCode } from "@/lib/api/response";
import { z } from "zod";

const markSquareSchema = z.object({
  row: z.number().min(0).max(4),
  col: z.number().min(0).max(4),
  memberId: z.string().min(1), // The member whose strength matches
});

interface BingoSquare {
  theme: string;
  domain: string;
  marked: boolean;
  markedBy?: string;
  markedByName?: string;
}

interface BingoProgress {
  board: BingoSquare[][];
  completedLines: string[];
  hasWon: boolean;
}

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
    const myMemberId = session.user.memberId;

    if (!organizationId || !myMemberId) {
      return apiError(ApiErrorCode.BAD_REQUEST, "Organization membership required");
    }

    const { challengeId } = await params;

    const body = await request.json();
    const validation = markSquareSchema.safeParse(body);

    if (!validation.success) {
      return apiError(ApiErrorCode.VALIDATION_ERROR, "Invalid input", {
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const { row, col, memberId } = validation.data;

    // Get challenge and participant
    const challenge = await prisma.teamChallenge.findFirst({
      where: {
        id: challengeId,
        organizationId,
        challengeType: "STRENGTHS_BINGO",
      },
    });

    if (!challenge) {
      return apiError(ApiErrorCode.NOT_FOUND, "Bingo challenge not found");
    }

    if (challenge.status !== "ACTIVE") {
      return apiError(ApiErrorCode.BAD_REQUEST, "This challenge is not active");
    }

    // Get participant
    const participant = await prisma.challengeParticipant.findUnique({
      where: {
        challengeId_memberId: {
          challengeId,
          memberId: myMemberId,
        },
      },
    });

    if (!participant) {
      return apiError(ApiErrorCode.NOT_FOUND, "You are not participating in this challenge");
    }

    const progress = participant.progress as unknown as BingoProgress;

    // Check if square is already marked
    if (progress.board[row][col].marked) {
      return apiError(ApiErrorCode.CONFLICT, "This square is already marked");
    }

    // Verify the member has this strength
    const squareTheme = progress.board[row][col].theme;
    if (squareTheme === "FREE") {
      return apiError(ApiErrorCode.BAD_REQUEST, "Cannot manually mark the free space");
    }

    const memberWithStrength = await prisma.organizationMember.findFirst({
      where: {
        id: memberId,
        organizationId,
        status: "ACTIVE",
        strengths: {
          some: {
            theme: { name: squareTheme },
            rank: { lte: 10 }, // Top 10 strengths
          },
        },
      },
      include: {
        user: { select: { fullName: true } },
      },
    });

    if (!memberWithStrength) {
      return apiError(
        ApiErrorCode.BAD_REQUEST,
        `${squareTheme} is not in this member's top 10 strengths`
      );
    }

    // Can't use yourself (unless no rule against it)
    if (memberId === myMemberId) {
      return apiError(ApiErrorCode.BAD_REQUEST, "You must find another team member with this strength");
    }

    // Mark the square
    progress.board[row][col].marked = true;
    progress.board[row][col].markedBy = memberId;
    progress.board[row][col].markedByName = memberWithStrength.user.fullName || "Unknown";

    // Check for completed lines
    const newCompletedLines = checkForBingo(progress.board);
    const previousLines = progress.completedLines.length;
    progress.completedLines = newCompletedLines;

    // Calculate score
    const newScore = newCompletedLines.length * 10 + countMarkedSquares(progress.board);

    // Check for win condition
    const rules = challenge.rules as Record<string, unknown>;
    const winCondition = (rules.winCondition as string) || "row_or_column";

    let hasWon = false;
    if (winCondition === "row_or_column" && newCompletedLines.length > 0) {
      hasWon = true;
    } else if (winCondition === "full_board" && countMarkedSquares(progress.board) === 25) {
      hasWon = true;
    }

    progress.hasWon = hasWon;

    // Update participant
    await prisma.challengeParticipant.update({
      where: { id: participant.id },
      data: {
        progress: JSON.parse(JSON.stringify(progress)),
        score: newScore,
        completedAt: hasWon ? new Date() : null,
      },
    });

    // Award points if won for the first time
    if (hasWon && !participant.completedAt) {
      await prisma.organizationMember.update({
        where: { id: myMemberId },
        data: { points: { increment: 50 } },
      });
    }

    return apiSuccess({
      marked: true,
      square: progress.board[row][col],
      completedLines: progress.completedLines,
      newLines: newCompletedLines.length - previousLines,
      hasWon,
      score: newScore,
    });
  } catch (error) {
    console.error("Error marking bingo square:", error);
    return apiError(ApiErrorCode.INTERNAL_ERROR, "Failed to mark square");
  }
}

function checkForBingo(board: BingoSquare[][]): string[] {
  const completedLines: string[] = [];
  const size = board.length;

  // Check rows
  for (let i = 0; i < size; i++) {
    if (board[i].every((cell) => cell.marked)) {
      completedLines.push(`row-${i}`);
    }
  }

  // Check columns
  for (let j = 0; j < size; j++) {
    if (board.every((row) => row[j].marked)) {
      completedLines.push(`col-${j}`);
    }
  }

  // Check diagonals
  if (board.every((row, i) => row[i].marked)) {
    completedLines.push("diag-main");
  }
  if (board.every((row, i) => row[size - 1 - i].marked)) {
    completedLines.push("diag-anti");
  }

  return completedLines;
}

function countMarkedSquares(board: BingoSquare[][]): number {
  return board.flat().filter((cell) => cell.marked).length;
}
