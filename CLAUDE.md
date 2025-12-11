# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**StrengthSync** is a CliftonStrengths-based team collaboration app that helps teams discover, leverage, and celebrate their unique strengths through analytics, recognition, and gamification.

### Key Features
- **Team Analytics**: Domain balance charts, gap analysis, partnership suggestions
- **Skills Directory**: Search and browse team members by strengths and expertise
- **Social Features**: Shoutouts (peer recognition), skill request marketplace, activity feed
- **Gamification**: Points, badges, streaks, leaderboards
- **Challenges**: Team activities like Strengths Bingo
- **Mentorship**: Complementary strength-based matching

### Tech Stack
- **Framework**: Next.js 15 (App Router, Turbopack)
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: NextAuth.js with credentials provider
- **Styling**: Tailwind CSS with custom domain color system
- **UI**: Custom components + Radix UI primitives

## Common Commands

```bash
# Development
npm run dev              # Start dev server (port 3000)
npm run build            # Build for production
npm run lint             # Run ESLint
npm run type-check       # TypeScript type checking

# Database
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema to database
npm run db:migrate       # Run migrations
npm run db:seed          # Seed domains, themes, badges
npm run db:reset         # Reset database
```

## Architecture

### Directory Structure
```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/          # NextAuth endpoints
│   │   └── strengths/     # Strengths upload/parsing
│   ├── auth/              # Login, register, join pages
│   ├── dashboard/         # Main dashboard
│   ├── admin/             # Admin features (upload)
│   └── [feature]/         # Feature pages
├── components/
│   ├── ui/               # Base UI components (Button, Card, etc.)
│   ├── layout/           # DashboardLayout, Sidebar
│   ├── strengths/        # ThemeBadge, DomainIcon, StrengthsCard
│   ├── team/             # Team analytics components
│   └── providers/        # SessionProvider
├── lib/
│   ├── prisma.ts         # Prisma client singleton
│   ├── auth/config.ts    # NextAuth configuration
│   ├── api/response.ts   # API response helpers
│   ├── pdf/parser.ts     # CliftonStrengths PDF parser
│   └── utils.ts          # Utility functions
├── constants/
│   └── strengths-data.ts # All 34 themes, 4 domains
├── types/                # TypeScript types
└── middleware.ts         # Auth middleware
```

### CliftonStrengths Domain Colors
| Domain | Hex | Tailwind Classes |
|--------|-----|------------------|
| Executing | #7B68EE (Purple) | `bg-domain-executing`, `text-domain-executing` |
| Influencing | #F5A623 (Orange) | `bg-domain-influencing`, `text-domain-influencing` |
| Relationship | #4A90D9 (Blue) | `bg-domain-relationship`, `text-domain-relationship` |
| Strategic | #7CB342 (Green) | `bg-domain-strategic`, `text-domain-strategic` |

### Database Models (Prisma)
- **StrengthDomain** / **StrengthTheme**: Reference data for 34 themes across 4 domains
- **Organization** / **User** / **OrganizationMember**: Multi-tenant team management
- **MemberStrength**: User's ranked themes (1-34)
- **Shoutout**: Peer recognition tied to themes
- **SkillRequest** / **SkillRequestResponse**: Marketplace for skill needs
- **Badge** / **BadgeEarned**: Gamification achievements
- **TeamChallenge** / **ChallengeParticipant**: Team activities
- **FeedItem** / **Reaction** / **Comment**: Social feed

### API Response Pattern
```typescript
import { apiSuccess, apiError, ApiErrorCode, apiCreated } from '@/lib/api/response';

// Success
return apiSuccess(data, 'Optional message');

// Created (201)
return apiCreated(newResource);

// Error
return apiError(ApiErrorCode.NOT_FOUND, 'Resource not found');
```

### Authentication
- Uses NextAuth.js with credentials provider
- Session contains: `id`, `email`, `name`, `organizationId`, `memberId`, `role`
- Roles: `OWNER`, `ADMIN`, `MEMBER`
- Protected routes handled via `middleware.ts`

## Code Standards

1. **NO mock data** - Real database connections only
2. **NO placeholders** - Every function fully implemented
3. **NO hardcoded values** - Environment variables only
4. **Complete error handling** - Production-grade try/catch
5. **Full validation** - Input validation with Zod
6. **Security built-in** - Parameterized queries, XSS prevention
7. **Modal dialogs** - Use UI components instead of browser alerts
8. **Full-stack completeness** - Every backend needs frontend UI

## Common Patterns

### Adding a new page
1. Create `src/app/[route]/page.tsx`
2. Use `DashboardLayout` for authenticated pages
3. Add to navigation in `DashboardLayout.tsx`

### Adding a new API route
```typescript
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, ApiErrorCode } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return apiError(ApiErrorCode.UNAUTHORIZED, "Authentication required");
  }
  // ... implementation
}
```

### Using theme/domain colors
```tsx
import { ThemeBadge } from "@/components/strengths/ThemeBadge";
import { DomainIcon } from "@/components/strengths/DomainIcon";

<ThemeBadge themeName="Strategic" domainSlug="strategic" />
<DomainIcon domain="executing" withBackground />
```

## Environment Variables

Required in `.env.local`:
```env
DATABASE_URL=postgresql://...
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<openssl rand -base64 32>
```

Optional:
```env
AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET
REDIS_URL
```
