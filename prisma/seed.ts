import { PrismaClient } from "@prisma/client";
import { DOMAINS, THEMES } from "../src/constants/strengths-data";

const prisma = new PrismaClient();

// Badge definitions
const BADGES = [
  // Shoutout badges
  {
    name: "First Shoutout",
    slug: "first-shoutout",
    description: "Give your first peer recognition",
    iconUrl: "/badges/first-shoutout.svg",
    category: "SHOUTOUT",
    tier: "BRONZE",
    points: 10,
    requirement: { type: "shoutouts_given", count: 1 },
  },
  {
    name: "High Five",
    slug: "high-five",
    description: "Give 5 peer recognitions",
    iconUrl: "/badges/high-five.svg",
    category: "SHOUTOUT",
    tier: "BRONZE",
    points: 25,
    requirement: { type: "shoutouts_given", count: 5 },
  },
  {
    name: "Recognition Champion",
    slug: "recognition-champion",
    description: "Give 50 peer recognitions",
    iconUrl: "/badges/recognition-champion.svg",
    category: "SHOUTOUT",
    tier: "GOLD",
    points: 100,
    requirement: { type: "shoutouts_given", count: 50 },
  },
  {
    name: "Shoutout Star",
    slug: "shoutout-star",
    description: "Receive 10 peer recognitions",
    iconUrl: "/badges/shoutout-star.svg",
    category: "SHOUTOUT",
    tier: "SILVER",
    points: 50,
    requirement: { type: "shoutouts_received", count: 10 },
  },

  // Collaboration badges
  {
    name: "Team Player",
    slug: "team-player",
    description: "Respond to 5 skill requests",
    iconUrl: "/badges/team-player.svg",
    category: "COLLABORATION",
    tier: "BRONZE",
    points: 30,
    requirement: { type: "skill_responses", count: 5 },
  },
  {
    name: "Go-To Expert",
    slug: "go-to-expert",
    description: "Respond to 25 skill requests",
    iconUrl: "/badges/go-to-expert.svg",
    category: "COLLABORATION",
    tier: "SILVER",
    points: 75,
    requirement: { type: "skill_responses", count: 25 },
  },
  {
    name: "Problem Solver",
    slug: "problem-solver",
    description: "Have 10 skill request responses accepted",
    iconUrl: "/badges/problem-solver.svg",
    category: "COLLABORATION",
    tier: "GOLD",
    points: 100,
    requirement: { type: "skill_responses_accepted", count: 10 },
  },

  // Streak badges
  {
    name: "Week Warrior",
    slug: "week-warrior",
    description: "7-day activity streak",
    iconUrl: "/badges/week-warrior.svg",
    category: "STREAK",
    tier: "BRONZE",
    points: 25,
    requirement: { type: "streak", count: 7 },
  },
  {
    name: "Month Master",
    slug: "month-master",
    description: "30-day activity streak",
    iconUrl: "/badges/month-master.svg",
    category: "STREAK",
    tier: "SILVER",
    points: 75,
    requirement: { type: "streak", count: 30 },
  },
  {
    name: "Century Club",
    slug: "century-club",
    description: "100-day activity streak",
    iconUrl: "/badges/century-club.svg",
    category: "STREAK",
    tier: "PLATINUM",
    points: 200,
    requirement: { type: "streak", count: 100 },
  },

  // Mentorship badges
  {
    name: "Mentor Match",
    slug: "mentor-match",
    description: "Start your first mentorship",
    iconUrl: "/badges/mentor-match.svg",
    category: "MENTORSHIP",
    tier: "BRONZE",
    points: 20,
    requirement: { type: "mentorships", count: 1 },
  },
  {
    name: "Wise Guide",
    slug: "wise-guide",
    description: "Complete 3 mentorships as a mentor",
    iconUrl: "/badges/wise-guide.svg",
    category: "MENTORSHIP",
    tier: "SILVER",
    points: 75,
    requirement: { type: "mentorships_as_mentor", count: 3 },
  },

  // Challenge badges
  {
    name: "Challenge Accepted",
    slug: "challenge-accepted",
    description: "Join your first team challenge",
    iconUrl: "/badges/challenge-accepted.svg",
    category: "CHALLENGE",
    tier: "BRONZE",
    points: 15,
    requirement: { type: "challenges_joined", count: 1 },
  },
  {
    name: "Challenge Champion",
    slug: "challenge-champion",
    description: "Complete 5 team challenges",
    iconUrl: "/badges/challenge-champion.svg",
    category: "CHALLENGE",
    tier: "GOLD",
    points: 100,
    requirement: { type: "challenges_completed", count: 5 },
  },
  {
    name: "Bingo Master",
    slug: "bingo-master",
    description: "Win a Strengths Bingo challenge",
    iconUrl: "/badges/bingo-master.svg",
    category: "CHALLENGE",
    tier: "SILVER",
    points: 50,
    requirement: { type: "bingo_wins", count: 1 },
  },

  // Milestone badges
  {
    name: "Getting Started",
    slug: "getting-started",
    description: "Complete your profile setup",
    iconUrl: "/badges/getting-started.svg",
    category: "MILESTONE",
    tier: "BRONZE",
    points: 10,
    requirement: { type: "profile_complete", value: true },
  },
  {
    name: "Strengths Revealed",
    slug: "strengths-revealed",
    description: "Have your CliftonStrengths imported",
    iconUrl: "/badges/strengths-revealed.svg",
    category: "MILESTONE",
    tier: "BRONZE",
    points: 25,
    requirement: { type: "strengths_imported", value: true },
  },
  {
    name: "Rising Star",
    slug: "rising-star",
    description: "Reach 100 points",
    iconUrl: "/badges/rising-star.svg",
    category: "MILESTONE",
    tier: "BRONZE",
    points: 0,
    requirement: { type: "points", count: 100 },
  },
  {
    name: "Super Star",
    slug: "super-star",
    description: "Reach 500 points",
    iconUrl: "/badges/super-star.svg",
    category: "MILESTONE",
    tier: "SILVER",
    points: 0,
    requirement: { type: "points", count: 500 },
  },
  {
    name: "Legend",
    slug: "legend",
    description: "Reach 1000 points",
    iconUrl: "/badges/legend.svg",
    category: "MILESTONE",
    tier: "GOLD",
    points: 0,
    requirement: { type: "points", count: 1000 },
  },
];

async function main() {
  console.log("🌱 Starting database seed...");

  // Seed domains
  console.log("📦 Seeding strength domains...");
  for (const domain of DOMAINS) {
    await prisma.strengthDomain.upsert({
      where: { slug: domain.slug },
      update: {
        name: domain.name,
        description: domain.description,
        colorHex: domain.colorHex,
        colorName: domain.colorName,
        iconName: domain.iconName,
      },
      create: {
        id: domain.id,
        name: domain.name,
        slug: domain.slug,
        description: domain.description,
        colorHex: domain.colorHex,
        colorName: domain.colorName,
        iconName: domain.iconName,
      },
    });
  }
  console.log(`✅ Seeded ${DOMAINS.length} domains`);

  // Seed themes
  console.log("📦 Seeding strength themes...");
  for (const theme of THEMES) {
    const domain = await prisma.strengthDomain.findUnique({
      where: { slug: theme.domain },
    });

    if (!domain) {
      console.error(`❌ Domain not found for theme: ${theme.name}`);
      continue;
    }

    await prisma.strengthTheme.upsert({
      where: { slug: theme.slug },
      update: {
        name: theme.name,
        shortDescription: theme.shortDescription,
        fullDescription: theme.fullDescription,
        domainId: domain.id,
        blindSpots: theme.blindSpots,
        actionItems: theme.actionItems,
        worksWith: theme.worksWith,
        keywords: theme.keywords,
      },
      create: {
        id: theme.id,
        name: theme.name,
        slug: theme.slug,
        shortDescription: theme.shortDescription,
        fullDescription: theme.fullDescription,
        domainId: domain.id,
        blindSpots: theme.blindSpots,
        actionItems: theme.actionItems,
        worksWith: theme.worksWith,
        keywords: theme.keywords,
      },
    });
  }
  console.log(`✅ Seeded ${THEMES.length} themes`);

  // Seed badges
  console.log("📦 Seeding badges...");
  for (const badge of BADGES) {
    await prisma.badge.upsert({
      where: { slug: badge.slug },
      update: {
        name: badge.name,
        description: badge.description,
        iconUrl: badge.iconUrl,
        category: badge.category as any,
        tier: badge.tier as any,
        points: badge.points,
        requirement: badge.requirement,
      },
      create: {
        name: badge.name,
        slug: badge.slug,
        description: badge.description,
        iconUrl: badge.iconUrl,
        category: badge.category as any,
        tier: badge.tier as any,
        points: badge.points,
        requirement: badge.requirement,
      },
    });
  }
  console.log(`✅ Seeded ${BADGES.length} badges`);

  console.log("🎉 Database seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
