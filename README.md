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

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/freeup86/strengthsync.git
cd strengthsync
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your database credentials and secrets:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/strengthsync
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
```

4. Set up the database:
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed initial data (domains, themes, badges)
npm run db:seed
```

5. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Commands

```bash
npm run db:generate    # Generate Prisma client
npm run db:push        # Push schema to database
npm run db:migrate     # Run migrations (production)
npm run db:seed        # Seed domains, themes, badges
npm run db:reset       # Reset database
npx prisma studio      # Open Prisma Studio (DB GUI)
```

## Development

```bash
npm run dev            # Start dev server with Turbopack
npm run build          # Build for production
npm run start          # Start production server
npm run lint           # Run ESLint
npm run type-check     # TypeScript type checking
```

## Docker Deployment

### Using Docker Compose

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Environment Variables

See `.env.example` for all available environment variables.

Required:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_URL` - Application URL
- `NEXTAUTH_SECRET` - Secret for session encryption

Optional:
- `AWS_*` - For S3 file uploads
- `REDIS_URL` - For caching (future)

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
