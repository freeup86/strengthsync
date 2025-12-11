import { NextRequest } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, ApiErrorCode, apiCreated } from "@/lib/api/response";
import { slugify, generateInviteCode } from "@/lib/utils";

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  organizationName: z.string().min(2, "Organization name must be at least 2 characters"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return apiError(ApiErrorCode.VALIDATION_ERROR, "Invalid input", {
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const { email, password, fullName, organizationName } = validation.data;
    const normalizedEmail = email.toLowerCase();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return apiError(ApiErrorCode.CONFLICT, "An account with this email already exists");
    }

    // Create user, organization, and membership in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Hash password
      const passwordHash = await hash(password, 12);

      // Create user
      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          fullName,
        },
      });

      // Generate unique slug for organization
      let baseSlug = slugify(organizationName);
      let slug = baseSlug;
      let counter = 1;

      while (await tx.organization.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      // Create organization
      const organization = await tx.organization.create({
        data: {
          name: organizationName,
          slug,
          inviteCode: generateInviteCode(),
        },
      });

      // Create membership (as owner)
      const membership = await tx.organizationMember.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          role: "OWNER",
          status: "ACTIVE",
        },
      });

      return { user, organization, membership };
    });

    return apiCreated(
      {
        userId: result.user.id,
        organizationId: result.organization.id,
        organizationSlug: result.organization.slug,
      },
      "Account created successfully"
    );
  } catch (error) {
    console.error("[Register Error]", error);
    return apiError(ApiErrorCode.INTERNAL_ERROR, "Failed to create account");
  }
}
