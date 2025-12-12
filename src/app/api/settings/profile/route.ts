import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, ApiErrorCode } from "@/lib/api/response";
import { z } from "zod";

const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  jobTitle: z.string().max(100).optional().nullable(),
  department: z.string().max(100).optional().nullable(),
  location: z.string().max(100).optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  linkedInUrl: z.string().url().optional().nullable().or(z.literal("")),
  pronouns: z.string().max(50).optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return apiError(ApiErrorCode.UNAUTHORIZED, "Authentication required");
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        jobTitle: true,
        department: true,
        location: true,
        bio: true,
        linkedInUrl: true,
        pronouns: true,
        preferences: true,
        createdAt: true,
      },
    });

    if (!user) {
      return apiError(ApiErrorCode.NOT_FOUND, "User not found");
    }

    return apiSuccess(user);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return apiError(ApiErrorCode.INTERNAL_ERROR, "Failed to fetch profile");
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return apiError(ApiErrorCode.UNAUTHORIZED, "Authentication required");
    }

    const body = await request.json();
    const validation = updateProfileSchema.safeParse(body);

    if (!validation.success) {
      return apiError(ApiErrorCode.VALIDATION_ERROR, "Invalid input", {
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const data = validation.data;

    // Clean empty strings to null
    const cleanedData = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [
        key,
        value === "" ? null : value,
      ])
    );

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: cleanedData,
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        jobTitle: true,
        department: true,
        location: true,
        bio: true,
        linkedInUrl: true,
        pronouns: true,
      },
    });

    return apiSuccess(updated);
  } catch (error) {
    console.error("Error updating profile:", error);
    return apiError(ApiErrorCode.INTERNAL_ERROR, "Failed to update profile");
  }
}
