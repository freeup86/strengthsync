# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Note**: This project uses [bd (beads)](https://github.com/steveyegge/beads) for issue tracking. Use `bd` commands instead of markdown TODOs. See AGENTS.md for workflow details.

## Project Overview

**StrengthSync** is a CliftonStrengths-based team collaboration app that helps teams discover, leverage, and celebrate their unique strengths through analytics, recognition, and gamification.

**GitHub Repository**: https://github.com/freeup86/strengthsync

### Tech Stack
- **Framework**: Next.js 15 (App Router, Turbopack)
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: NextAuth.js with credentials provider (JWT strategy, 7-day sessions)
- **Styling**: Tailwind CSS with custom domain color system
- **UI**: Custom components + Radix UI primitives (AlertDialog, Dialog, Dropdown, etc.)
- **Email**: Resend for transactional emails
- **Charts**: Recharts for data visualization
- **AI**: Vercel AI SDK with OpenAI (gpt-4o-mini default) for chat/completions
- **Validation**: Zod for schema validation

## Commands

```bash
# Development
npm run dev              # Start dev server (port 3000) with Turbopack
npm run build            # Build for production
npm run lint             # Run ESLint
npm run type-check       # TypeScript type checking (tsc --noEmit)

# Database
npm run db:generate      # Generate Prisma client (also runs on postinstall)
npm run db:push          # Push schema to database (development only)
npm run db:migrate       # Run migrations (prisma migrate dev)
npm run db:seed          # Seed domains, themes, badges (npx tsx prisma/seed.ts)
npm run db:reset         # Reset database (prisma migrate reset)
npx prisma studio        # Open Prisma Studio (DB GUI)

# Docker
docker-compose up -d     # Start all services
docker-compose down      # Stop services
```

**Note**: This project does not have tests configured yet. Focus on manual testing and type-checking.

## Architecture

### Key Directories
- `src/app/` - Next.js App Router pages and API routes
- `src/app/api/` - All API endpoints (auth, team, shoutouts, challenges, etc.)
- `src/components/` - React components organized by domain:
  - `ui/` - Base components (Button, Card, Dialog, Avatar, Input, etc.)
  - `layout/` - DashboardLayout (primary navigation wrapper)
  - `strengths/` - ThemeBadge, StrengthsCard, DomainIcon, analytics components
  - `team/` - DomainBalanceChart, Partnerships, GapAnalysis
  - `ai/` - AIEnhanceButton, StreamingText, feedback components
  - `chat/` - ChatSidebar, ChatHistory, ChatRename
  - `social/` - Shoutouts, SkillRequests, Feed components
  - `gamification/` - Badges, Leaderboards, Challenges
  - `notifications/` - NotificationBell, RecognitionPrompt
- `src/lib/` - Utilities and services:
  - `prisma.ts` - Database client singleton
  - `auth/config.ts` - NextAuth configuration with type augmentations
  - `api/response.ts` - Standardized API response helpers
  - `pdf/parser.ts` - CliftonStrengths PDF parsing
  - `ai/` - AI service (client, rate-limiter, token-tracker, prompts, context, tools)
  - `email/` - Resend email service and digest templates
  - `strengths/analytics.ts` - Team analytics calculations
  - `storage/` - S3 file storage service
- `src/constants/strengths-data.ts` - All 34 CliftonStrengths themes and 4 domains with descriptions, blind spots, keywords
- `src/types/index.ts` - TypeScript interfaces (SessionUser, MemberProfile, TeamComposition, etc.)
- `prisma/schema.prisma` - Database schema (source of truth for models)

### CliftonStrengths Domain Colors
| Domain | Hex | Tailwind Classes |
|--------|-----|------------------|
| Executing | #7B68EE (Purple) | `bg-domain-executing`, `text-domain-executing` |
| Influencing | #F5A623 (Orange) | `bg-domain-influencing`, `text-domain-influencing` |
| Relationship | #4A90D9 (Blue) | `bg-domain-relationship`, `text-domain-relationship` |
| Strategic | #7CB342 (Green) | `bg-domain-strategic`, `text-domain-strategic` |

Each domain color has variants: `DEFAULT`, `-light`, `-dark`, `-muted` (e.g., `bg-domain-executing-light`).

### Multi-Tenant Architecture
- **Organization**: Contains members, challenges, feed items, review cycles. Has `inviteCode` for member signup.
- **User**: Can belong to multiple organizations via OrganizationMember
- **OrganizationMember**: Junction table with role (OWNER/ADMIN/MEMBER), status (ACTIVE/INACTIVE/PENDING), strengths (1-34 ranking), points, badges
- Session contains: `id`, `email`, `name`, `organizationId`, `memberId`, `role`
- All API routes must verify both `organizationId` and `memberId` from session

### Route Protection
Protected routes (require auth): `/dashboard`, `/strengths`, `/team`, `/directory`, `/marketplace`, `/mentorship`, `/shoutouts`, `/challenges`, `/cards`, `/leaderboard`, `/feed`, `/settings`, `/admin`, `/notifications`, `/partnerships`, `/reviews`

Auth routes redirect to dashboard if logged in: `/auth/login`, `/auth/register`

## API Patterns

### Standardized Response Helpers
```typescript
import { apiSuccess, apiError, ApiErrorCode, apiCreated, apiListSuccess, apiErrors } from '@/lib/api/response';

// Success responses
return apiSuccess(data, 'Optional message');        // 200 OK
return apiCreated(newResource);                      // 201 Created
return apiListSuccess(data, { page, limit, total, hasMore }); // List with pagination

// Error responses (explicit)
return apiError(ApiErrorCode.NOT_FOUND, 'Resource not found');
return apiError(ApiErrorCode.VALIDATION_ERROR, 'Invalid input', { field: 'email' });

// Error responses (convenience helpers)
return apiErrors.unauthorized();      // 401
return apiErrors.notFound('Member');  // 404
return apiErrors.badRequest('Invalid input', { field: 'email' }); // 400
return apiErrors.forbidden();         // 403
return apiErrors.rateLimited();       // 429
```

### API Error Codes
| Code | HTTP Status |
|------|-------------|
| BAD_REQUEST | 400 |
| UNAUTHORIZED | 401 |
| FORBIDDEN | 403 |
| NOT_FOUND | 404 |
| VALIDATION_ERROR | 422 |
| RATE_LIMITED | 429 |
| INTERNAL_ERROR | 500 |

### API Route Template
```typescript
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, ApiErrorCode } from "@/lib/api/response";

export async function GET(request: NextRequest) {
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

    // ... implementation
    return apiSuccess(data);
  } catch (error) {
    console.error("Error:", error);
    return apiError(ApiErrorCode.INTERNAL_ERROR, "Failed to process request");
  }
}
```

### Dynamic Route with Next.js 15
```typescript
// In API routes (server):
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;  // Must await params in Next.js 15
  // ... implementation
}

// In client components, use the `use` hook:
import { use } from "react";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  // ...
}
```

### Prisma JSON Fields
When working with Prisma JSON fields (like `progress`, `rules`, `content`), use this pattern:
```typescript
// Convert to JSON-safe format before saving
await prisma.model.create({
  data: {
    jsonField: JSON.parse(JSON.stringify(objectData)),
  },
});
```

## Code Standards

1. **NO mock data** - Real database connections only
2. **NO placeholders** - Every function fully implemented
3. **NO hardcoded values** - Environment variables only
4. **Complete error handling** - Production-grade try/catch
5. **Full validation** - Input validation with Zod
6. **Security built-in** - Parameterized queries, XSS prevention
7. **Modal dialogs** - Use `@radix-ui/react-alert-dialog` instead of browser alerts
8. **Full-stack completeness** - Every backend feature needs frontend UI

## Common Patterns

### Adding a new page
1. Create `src/app/[route]/page.tsx`
2. Create `src/app/[route]/layout.tsx` with DashboardLayout wrapper
3. Add to navigation in `src/components/layout/DashboardLayout.tsx`

### Using theme/domain colors
```tsx
import { ThemeBadge } from "@/components/strengths/ThemeBadge";
import { DomainIcon } from "@/components/strengths/DomainIcon";
import type { DomainSlug } from "@/constants/strengths-data";

// DomainSlug = "executing" | "influencing" | "relationship" | "strategic"
<ThemeBadge themeName="Strategic" domainSlug="strategic" />
<DomainIcon domain={domain as DomainSlug} />
```

### Common Prisma Include Patterns
```typescript
// Fetch member with top strengths (used throughout codebase)
const member = await prisma.organizationMember.findFirst({
  where: { id: memberId },
  include: {
    user: { select: { fullName: true, avatarUrl: true, jobTitle: true } },
    strengths: {
      where: { rank: { lte: 5 } },  // Top 5 only
      include: {
        theme: { include: { domain: { select: { slug: true } } } },
      },
      orderBy: { rank: "asc" },
    },
  },
});

// Fetch all organization members with strengths
const members = await prisma.organizationMember.findMany({
  where: { organizationId, status: "ACTIVE" },
  include: {
    user: { select: { fullName: true, avatarUrl: true, jobTitle: true } },
    strengths: {
      where: { isTop5: true },
      include: { theme: { include: { domain: true } } },
      orderBy: { rank: "asc" },
    },
  },
});
```

### Points System
| Action | Points |
|--------|--------|
| Give shoutout | +5 |
| Receive shoutout | +10 |
| Respond to skill request | +15 |
| Response accepted | +25 |
| Complete challenge | +50 |
| Comment on feed | +2 |

### Creating Notifications
```typescript
await prisma.notification.create({
  data: {
    type: "SHOUTOUT_RECEIVED", // or MENTORSHIP_ACCEPTED, BADGE_EARNED, etc.
    title: "You received a shoutout!",
    message: `${senderName} recognized your ${themeName} strength`,
    memberId: recipientMemberId,
    link: `/shoutouts/${shoutoutId}`,
  },
});
```

### Creating Feed Items
```typescript
await prisma.feedItem.create({
  data: {
    type: "SHOUTOUT", // or SKILL_REQUEST, BADGE_EARNED, CHALLENGE_STARTED, etc.
    content: JSON.parse(JSON.stringify({
      senderId: memberId,
      senderName,
      recipientName,
      message,
      themeName,
    })),
    organizationId,
    actorId: memberId,
  },
});
```

## Path Aliases

The project uses `@/*` to reference `./src/*`. Always use this alias in imports:
```typescript
import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/lib/api/response";
```

## Environment Variables

Required in `.env.local`:
```env
DATABASE_URL=postgresql://...
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<openssl rand -base64 32>
OPENAI_API_KEY=sk-...  # Required for AI features
```

Optional:
```env
AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET
REDIS_URL
RESEND_API_KEY  # For email features
```

## Key Features

### Strengths Bingo Challenge
- 5x5 grid stored as JSON in `ChallengeParticipant.progress`
- Win conditions: row, column, or diagonal

### Mentorship Matching
- Complementary strengths defined in `MENTORSHIP_PAIRINGS` constant
- Score based on theme pairings + domain diversity

### Activity Feed
- Polymorphic `FeedItem` with types: SHOUTOUT, SKILL_REQUEST, BADGE_EARNED, etc.
- Reactions: like, celebrate, love, star, clap
- Threaded comments via `parentId`

### Performance Reviews
- Cycles: QUARTERLY, SEMI_ANNUAL, ANNUAL, PROJECT, PROBATION
- ReviewGoal with `alignedThemes` for strengths-based goals
- ReviewEvidence links to shoutouts, mentorship, challenges

## AI Integration

### Streaming Chat
```typescript
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

const result = await streamText({
  model: openai('gpt-4o-mini'),
  messages,
  system: 'You are a CliftonStrengths coach...',
});

return result.toDataStreamResponse();
```

Frontend uses `useChat` hook from `@ai-sdk/react` for streaming responses.

### AI Endpoints
Located in `src/app/api/ai/`:
- `chat` - General strengths coaching chat with conversation persistence
- `enhance-shoutout` - Improve shoutout messages
- `generate-bio` - Create strength-based bios
- `recognition-starters` / `recognition-prompts` - Suggest recognition text
- `team-narrative` - Generate team strength stories
- `gap-recommendations` - Suggest how to address team gaps
- `development-insights` - Personal development suggestions
- `partnership-reasoning` - Explain why two people work well together
- `mentorship-guide` - Mentorship conversation guides
- `match-skill-request` - Find team members for skill requests
- `goals/suggest` - Suggest performance review goals
- `improve-skill-request` - Enhance skill request descriptions
- `executive-summary` - Generate team executive summaries

AI usage is tracked in `AIUsageLog` table with token counts and costs.

### AI Conversation Persistence
Chat conversations are persisted via `AIConversation` and `AIMessage` models:
- `GET /api/ai/chat/conversations` - List user's conversations
- `GET /api/ai/chat/conversations/[conversationId]` - Get conversation with messages
- `POST /api/ai/chat` with `conversationId` - Continue existing conversation
- `DELETE /api/ai/chat/conversations/[conversationId]` - Delete conversation

## Key Data Relationships

### Strengths Flow
1. Admin uploads PDF → `StrengthsDocument` created
2. PDF parsed → 34 `MemberStrength` records created (rank 1-34)
3. `isTop5` and `isTop10` flags set automatically
4. Each `MemberStrength` links to `StrengthTheme` → `StrengthDomain`

### Gamification Flow
1. Actions (shoutouts, challenges, etc.) trigger point awards
2. Points accumulate on `OrganizationMember.points`
3. Badge criteria checked → `BadgeEarned` records created
4. `FeedItem` created for social visibility
5. `Notification` sent to relevant users

## Admin Features

Admin routes (`/admin/*`) require `role: OWNER | ADMIN`. Key admin capabilities:
- **Members**: View/edit all organization members, import strengths via PDF
- **Review Cycles**: Create/manage performance review cycles (QUARTERLY, SEMI_ANNUAL, etc.)
- **AI Prompts**: Manage AI prompt templates (`AIPromptTemplate`)
- **AI Usage**: Monitor token usage and costs across the organization
- **Constants**: Edit strength domains and themes (reference data)
- **Health Metrics**: Dashboard metrics for organization health

## NextAuth Session Type

The session object includes organization context:
```typescript
session.user = {
  id: string;           // User ID
  email: string;
  name: string;
  image?: string;
  organizationId?: string;  // Current org
  organizationName?: string;
  memberId?: string;    // OrganizationMember ID
  role?: "OWNER" | "ADMIN" | "MEMBER";
};
```

Type augmentations are defined in `src/lib/auth/config.ts`.
