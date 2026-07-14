# StrengthSync

A CliftonStrengths-based team collaboration app that helps teams discover, leverage, and celebrate their unique strengths through analytics, recognition, and gamification.

## Features

- **Team Analytics**: Domain balance charts, gap analysis, partnership suggestions
- **Skills Directory**: Search and browse team members by strengths and expertise
- **Social Features**: Shoutouts (peer recognition), skill request marketplace, activity feed
- **Gamification**: Points, badges, streaks, leaderboards
- **Challenges**: Team activities like Strengths Bingo
- **Mentorship**: Complementary strength-based matching
- **Strengths Cards**: Digital baseball card-style profile cards
- **Notifications**: Real-time notification system

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: NextAuth.js with credentials provider
- **Styling**: Tailwind CSS
- **UI**: Custom components + Radix UI primitives

## Quick Start

### Prerequisites

- Node.js 20.6 or newer
- Docker Desktop with Docker Compose
- npm
- Render CLI only when running production database diagnostics

### Installation

1. Clone the repository:

```bash
git clone https://github.com/lcortez-code/strengthsync.git
cd strengthsync
```

2. Create your local configuration:

```bash
cp .env.example .env
```

Local `.env` and `.mcp.json` files must never contain a Render PostgreSQL URL. The local database is PostgreSQL in Docker, published only on `127.0.0.1`; its Docker volume is disposable.

3. Install dependencies, start and initialize PostgreSQL, then start the app:

```bash
npm install
npm run db:local:up
npm run db:local:setup
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Workflow

### Local lifecycle and mutations

```bash
npm run db:local:up
npm run db:local:setup
npm run db:migrate
npm run db:seed
npm run db:local:reset -- --confirm-local-reset
npm run db:local:down
npm run db:local:destroy -- --confirm-local-destroy
```

- `db:local:up` starts the loopback-only PostgreSQL container.
- `db:local:setup` prepares the local database for application development.
- `db:migrate` creates and applies development migrations with `prisma migrate dev`.
- `db:seed` is reference-only. Create application organizations and users through the UI or API.
- The reset and destroy confirmation flags prevent accidental destructive operations on the local database, while the loopback guard blocks non-local targets.
- `db:local:down` stops the container while retaining the disposable local volume; `db:local:destroy` removes it.

### Production diagnostics

```bash
render login
npm run db:prod:console
```

`render psql` through `npm run db:prod:console` is the only supported local path to the production database. Do not copy a production DSN into application, Prisma, MCP, or shell configuration.

## Development

```bash
npm run dev            # Start dev server with Turbopack
npm run build          # Build for production
npm run start          # Start production server
npm run lint           # Run ESLint
npm run type-check     # TypeScript type checking
```

Install the repository commit protection for PostgreSQL URLs:

```bash
npm run hooks:install
```

## Environment Variables

See `.env.example` for all available environment variables.

Required:

- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_URL` - Application URL
- `NEXTAUTH_SECRET` - Secret for session encryption

Optional:

- `AWS_*` - For S3 file uploads

## CliftonStrengths Data

The app works with CliftonStrengths assessment results. Admins can upload PDF reports to import team members' strengths.

### 34 Themes across 4 Domains

| Domain | Color | Themes |
|--------|-------|--------|
| Executing | Purple (#7B68EE) | Achiever, Arranger, Belief, Consistency, Deliberative, Discipline, Focus, Responsibility, Restorative |
| Influencing | Orange (#F5A623) | Activator, Command, Communication, Competition, Maximizer, Self-Assurance, Significance, Woo |
| Relationship Building | Blue (#4A90D9) | Adaptability, Connectedness, Developer, Empathy, Harmony, Includer, Individualization, Positivity, Relator |
| Strategic Thinking | Green (#7CB342) | Analytical, Context, Futuristic, Ideation, Input, Intellection, Learner, Strategic |

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/              # Auth pages
│   ├── dashboard/         # Main dashboard
│   └── [feature]/         # Feature pages
├── components/
│   ├── ui/               # Base UI components
│   ├── layout/           # Layout components
│   └── strengths/        # Strengths-specific components
├── lib/                   # Utilities and services
├── constants/             # Static data
└── types/                # TypeScript types
```

## License

MIT

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.
