# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Issue Tracking**: This project uses [bd (beads)](https://github.com/steveyegge/beads) for issue tracking. Use `bd` commands instead of markdown TODOs. See AGENTS.md for details.

## Project Overview

**StrengthSync** is a CliftonStrengths-based team collaboration app that helps teams discover, leverage, and celebrate their unique strengths through analytics, recognition, and gamification.

**GitHub**: https://github.com/freeup86/strengthsync

### Tech Stack
- **Framework**: Next.js 15.1 (App Router, Turbopack) with React 19
- **Database**: PostgreSQL with Prisma 6 ORM
- **Auth**: NextAuth.js 4 with credentials provider (JWT strategy, 7-day sessions, bcryptjs)
- **Styling**: Tailwind CSS with custom domain color system + Typography plugin
- **UI**: Custom components + Radix UI primitives (AlertDialog, Dialog, Dropdown, etc.)
- **Email**: Resend for transactional emails and weekly digests
- **Charts**: Recharts for data visualization
- **AI**: Vercel AI SDK (`ai` + `@ai-sdk/openai` + `@ai-sdk/react`) with OpenAI gpt-4o-mini default
- **Validation**: Zod for schema validation

## Commands

```bash
npm run dev              # Start dev server (port 3000) with Turbopack
npm run build            # Build for production
npm run lint             # Run ESLint
npm run type-check       # TypeScript type checking (tsc --noEmit)

npm run db:generate      # Generate Prisma client (also runs on postinstall)
npm run db:push          # Push schema to database (development only)
npm run db:migrate       # Run migrations (prisma migrate dev)
npm run db:seed          # Seed domains, themes, badges (npx tsx prisma/seed.ts)
npm run db:reset         # Reset database (prisma migrate reset)
npx prisma studio        # Open Prisma Studio (DB GUI)

docker-compose up -d     # Start PostgreSQL
docker-compose down      # Stop services

# First-time Docker setup: run migrations + seed
docker compose --profile setup run migrate
```

**Note**: No test framework configured. Use manual testing and `npm run type-check`.

## Architecture

### Key Directories
- `src/app/` - Next.js App Router pages and API routes
- `src/app/api/` - API endpoints organized by domain (auth, team, shoutouts, challenges, ai, admin, etc.)
- `src/components/` - React components organized by domain (~18 subdirectories: `ui/`, `layout/`, `strengths/`, `team/`, `ai/`, `chat/`, `social/`, `gamification/`, `notifications/`, `admin/`, `charts/`, `brand/`, `effects/`, `onboarding/`, `providers/`, etc.)
- `src/lib/` - Utilities and services (see AI subsystem below)
- `src/constants/strengths-data.ts` - All 34 CliftonStrengths themes and 4 domains (44KB, with descriptions, blind spots, keywords)
- `src/types/index.ts` - TypeScript interfaces (SessionUser, MemberProfile, TeamComposition, StrengthBlend, ApplySection, etc.)
- `prisma/schema.prisma` - Database schema (source of truth, 31 models)

### AI Subsystem Architecture (`src/lib/ai/`)
The AI layer is the most complex service module with 11 files:
- `client.ts` - OpenAI client initialization
- `service.ts` - Core AI service orchestration
- `rate-limiter.ts` - Per-user rate limiting
- `token-tracker.ts` - Token usage tracking → `AIUsageLog` table
- `prompts/index.ts` - System prompt definitions
- `prompts/template-engine.ts` - Dynamic prompt template rendering (admin-editable via `AIPromptTemplate`)
- `context/index.ts`, `context/user-context.ts`, `context/team-context.ts` - Build rich context from user/team strengths data for AI calls
- `tools/index.ts` - AI tool definitions for function calling

### Other Key Service Modules (`src/lib/`)
- `prisma.ts` - Database client singleton (with dev logging)
- `auth/config.ts` - NextAuth configuration with session type augmentations
- `api/response.ts` - Standardized API response helpers
- `pdf/parser.ts` - CliftonStrengths PDF extraction (parses all 34 ranked themes + personalization data)
- `email/` - Resend integration with weekly digest templates
- `strengths/analytics.ts` - Team analytics calculations (domain balance, gaps, partnerships)
- `storage/` - S3 file storage service
- `gamification/` - Points, badges, and challenges logic
- `validation/` - Zod schema validation utilities

### CliftonStrengths Domain Colors (defined in `tailwind.config.ts`)
| Domain | Hex | Tailwind Classes |
|--------|-----|------------------|
| Executing | #7B68EE (Purple) | `bg-domain-executing`, `text-domain-executing` |
| Influencing | #F5A623 (Orange) | `bg-domain-influencing`, `text-domain-influencing` |
| Relationship | #4A90D9 (Blue) | `bg-domain-relationship`, `text-domain-relationship` |
| Strategic | #7CB342 (Green) | `bg-domain-strategic`, `text-domain-strategic` |

Each domain color has variants: `-light`, `-dark`, `-muted` (e.g., `bg-domain-executing-light`).

### Multi-Tenant Architecture
- **Organization**: Contains members, challenges, feed items, review cycles. Has `inviteCode` for member signup.
- **User**: Can belong to multiple organizations via OrganizationMember
- **OrganizationMember**: Junction table with role (OWNER/ADMIN/MANAGER/MEMBER), status (ACTIVE/INACTIVE/PENDING), strengths (1-34 ranking), points, badges
- Session contains: `id`, `email`, `name`, `organizationId`, `memberId`, `role`
- All API routes must verify both `organizationId` and `memberId` from session

### Role-Based Access Control (defined in `src/middleware.ts`)

Four roles with tiered access:

| Role | Access |
|------|--------|
| **OWNER** | Full access to all routes including admin |
| **ADMIN** | Same as OWNER |
| **MANAGER** | Manager dashboard (`/admin/dashboard`), performance reviews (`/admin/review-cycles`), plus all member routes |
| **MEMBER** | All non-admin protected routes |

**Admin-only routes** (OWNER/ADMIN — MANAGER cannot access):
`/admin/members`, `/admin/import`, `/admin/constants`, `/admin/upload`

**Manager routes** (OWNER/ADMIN/MANAGER):
`/admin/dashboard`, `/admin/review-cycles`

**Protected routes** (all authenticated users):
`/dashboard`, `/strengths`, `/team`, `/directory`, `/marketplace`, `/mentorship`, `/shoutouts`, `/challenges`, `/cards`, `/leaderboard`, `/feed`, `/settings`, `/admin`, `/notifications`, `/partnerships`, `/reviews`, `/chat`

**Auth routes** redirect to dashboard if logged in: `/auth/login`, `/auth/register`

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
`BAD_REQUEST` (400), `UNAUTHORIZED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `CONFLICT` (409), `VALIDATION_ERROR` (422), `RATE_LIMITED` (429), `INTERNAL_ERROR` (500)

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

- **NO mock data** - Real database connections only
- **NO placeholders** - Every function fully implemented
- **NO hardcoded values** - Environment variables only
- **Complete error handling** - Production-grade try/catch
- **Full validation** - Input validation with Zod
- **Security built-in** - Parameterized queries, XSS prevention
- **Modal dialogs** - Use `@radix-ui/react-alert-dialog` instead of browser `alert()`/`confirm()`
- **Full-stack completeness** - Every backend feature needs frontend UI (API → Service → Component → Page)

## Common Patterns

### Adding a new page
1. Create `src/app/[route]/page.tsx`
2. Create `src/app/[route]/layout.tsx` with DashboardLayout wrapper
3. Add to navigation in `src/components/layout/DashboardLayout.tsx`

### Navigation Structure (in `DashboardLayout.tsx`)
The sidebar is organized into sections:
- **Primary**: Dashboard
- **Me**: My Strengths, My Reviews, Mentorship
- **Team**: Ask AI (`/chat`), Team Analytics, Directory, Leaderboard
- **Connect**: Feed, Shoutouts, Skill Marketplace, Challenges

Manager-only items (OWNER/ADMIN/MANAGER): Manager Dashboard, Performance Reviews
Admin-only items (OWNER/ADMIN): Members, Upload Strengths, Bulk Import, Strength Constants

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

### Custom Hooks and Error Handling
- `useConfetti()` - Manages confetti animation state with origin tracking (used in gamification flows)
- `ErrorBoundary` component in `src/components/effects/` - Wraps sections that may fail gracefully

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
RESEND_API_KEY  # For email features
```

## Key Features

### Strengths Upload
- **Admin upload** (`/admin/upload`): Admins upload CliftonStrengths PDFs for any member
- **Self-service upload** (`/strengths/upload`): Members upload their own PDF
- **Bulk import** (`/admin/import`): CSV/bulk member import

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

### AI Endpoints (`src/app/api/ai/`)
| Endpoint | Purpose |
|----------|---------|
| `chat` | General strengths coaching chat with conversation persistence |
| `enhance-shoutout` | Improve shoutout messages |
| `generate-bio` | Create strength-based bios |
| `recognition-starters`, `recognition-prompts` | Suggest recognition text |
| `team-narrative` | Generate team strength stories |
| `gap-recommendations` | Suggest how to address team gaps |
| `development-insights` | Personal development suggestions |
| `partnership-reasoning` | Explain why two people work well together |
| `mentorship-guide` | Mentorship conversation guides |
| `match-skill-request` | Find team members for skill requests |
| `goals/suggest` | Suggest performance review goals |
| `improve-skill-request` | Enhance skill request descriptions |
| `executive-summary` | Generate team executive summaries |

AI usage is tracked in `AIUsageLog` table with token counts and costs. Admin management via `/api/admin/ai/usage` and `/api/admin/ai/prompts`.

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
5. Personalization data extracted: `strengthBlends` (JSON), `applySection` (JSON), `personalizedInsights` (String array)

### Gamification Flow
1. Actions (shoutouts, challenges, etc.) trigger point awards
2. Points accumulate on `OrganizationMember.points`
3. Badge criteria checked → `BadgeEarned` records created
4. `FeedItem` created for social visibility
5. `Notification` sent to relevant users

### AI Response Caching
Partnership reasoning (expensive AI calls) is cached in `PartnershipReasoning` model keyed by the member pair, avoiding redundant OpenAI API calls for the same partnership analysis.

### Audit Trail
All significant operations log to the `AuditLog` model with action, entity type/ID, actor, and metadata. AI token usage is separately tracked in `AIUsageLog` with per-request token counts and costs.

## Admin API Endpoints

In addition to the admin UI routes documented in the RBAC section above:
- `/api/admin/ai/prompts` - Manage AI prompt templates (`AIPromptTemplate` model)
- `/api/admin/ai/usage` - Monitor token usage and costs (`AIUsageLog` model)
- `/api/admin/health-metrics` - Organization health dashboard metrics

## NextAuth Session Type

The session object includes organization context:
```typescript
session.user = {
  id: string;           // User ID
  email: string;
  name: string;
  image?: string | null;
  organizationId?: string;  // Current org
  organizationName?: string;
  memberId?: string;    // OrganizationMember ID
  role?: "OWNER" | "ADMIN" | "MANAGER" | "MEMBER";
};
```

Type augmentations are defined in `src/lib/auth/config.ts`.

## Next.js Configuration (`next.config.ts`)

- **Server Actions**: `bodySizeLimit` set to `10mb` (for PDF uploads and large payloads)
- **Images**: All HTTPS remote patterns allowed (`hostname: "**"`)
- **Version Exposure**: `NEXT_PUBLIC_APP_VERSION` and `NEXT_PUBLIC_BUILD_TIME` injected from `package.json` at build time

## Docker Architecture

Three services in `docker-compose.yml`:
- **db**: PostgreSQL 15 Alpine with health checks (port 5432)
- **app**: Next.js application (port 3000), depends on healthy db
- **migrate**: One-shot service (`prisma db push` + seed) under the `setup` profile — run with `docker compose --profile setup run migrate`

Default credentials: `postgres/postgres`, database `strengthsync` (configurable via env vars `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`).

## Quick Reference: Key Files

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | Database schema (source of truth) |
| `src/lib/auth/config.ts` | NextAuth config with session type augmentations |
| `src/lib/api/response.ts` | Standardized API response helpers |
| `src/lib/prisma.ts` | Prisma client singleton |
| `src/constants/strengths-data.ts` | All 34 themes, 4 domains, blind spots, keywords |
| `src/middleware.ts` | Route protection and role-based access logic |
| `src/components/layout/DashboardLayout.tsx` | Main navigation wrapper with role-aware sidebar |
| `tailwind.config.ts` | Domain colors and custom animations |
