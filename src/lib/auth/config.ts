import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
          include: {
            organizationMemberships: {
              where: { status: "ACTIVE" },
              include: {
                organization: true,
              },
              take: 1,
            },
          },
        });

        if (!user || !user.passwordHash) {
          throw new Error("Invalid email or password");
        }

        const isPasswordValid = await compare(credentials.password, user.passwordHash);

        if (!isPasswordValid) {
          throw new Error("Invalid email or password");
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        const membership = user.organizationMemberships[0];

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          image: user.avatarUrl,
          organizationId: membership?.organizationId,
          organizationName: membership?.organization.name,
          memberId: membership?.id,
          role: membership?.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.organizationId = (user as any).organizationId;
        token.organizationName = (user as any).organizationName;
        token.memberId = (user as any).memberId;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).organizationId = token.organizationId;
        (session.user as any).organizationName = token.organizationName;
        (session.user as any).memberId = token.memberId;
        (session.user as any).role = token.role;

        // Fetch latest avatar from database (allows updates without re-login)
        try {
          const user = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { avatarUrl: true, fullName: true },
          });
          if (user) {
            session.user.image = user.avatarUrl;
            session.user.name = user.fullName;
          }
        } catch (error) {
          // Silently fail - use cached data if DB query fails
          console.error("Failed to fetch user data for session:", error);
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Type augmentation for NextAuth
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string | null;
      organizationId?: string;
      organizationName?: string;
      memberId?: string;
      role?: "OWNER" | "ADMIN" | "MANAGER" | "MEMBER";
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    image?: string | null;
    organizationId?: string;
    organizationName?: string;
    memberId?: string;
    role?: "OWNER" | "ADMIN" | "MANAGER" | "MEMBER";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    organizationId?: string;
    organizationName?: string;
    memberId?: string;
    role?: "OWNER" | "ADMIN" | "MANAGER" | "MEMBER";
  }
}
