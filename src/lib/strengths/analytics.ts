import { DOMAINS, THEMES, getThemesByDomain, type DomainSlug } from "@/constants/strengths-data";

export interface MemberStrengthData {
  memberId: string;
  memberName: string;
  themeSlug: string;
  themeName: string;
  domain: DomainSlug;
  rank: number;
}

export interface DomainComposition {
  domain: DomainSlug;
  domainName: string;
  color: string;
  count: number;
  percentage: number;
  themes: { slug: string; name: string; count: number }[];
}

export interface ThemeFrequency {
  slug: string;
  name: string;
  domain: DomainSlug;
  count: number;
  percentage: number;
  members: { id: string; name: string; rank: number }[];
}

export interface GapAnalysis {
  missingThemes: { slug: string; name: string; domain: DomainSlug }[];
  underrepresentedThemes: ThemeFrequency[];
  underrepresentedDomains: { domain: DomainSlug; name: string; percentage: number }[];
  recommendations: string[];
}

export interface PartnershipSuggestion {
  member1: { id: string; name: string; topTheme: string };
  member2: { id: string; name: string; topTheme: string };
  reason: string;
  complementaryStrength: string;
  score: number;
}

/**
 * Calculate domain composition from member strengths
 * Only considers top 5 themes for each member
 */
export function calculateDomainComposition(
  memberStrengths: MemberStrengthData[],
  totalMembers: number
): DomainComposition[] {
  // Filter to top 5 themes only
  const top5Strengths = memberStrengths.filter((ms) => ms.rank <= 5);

  // Group by domain
  const domainCounts: Record<DomainSlug, { themes: Map<string, number>; total: number }> = {
    executing: { themes: new Map(), total: 0 },
    influencing: { themes: new Map(), total: 0 },
    relationship: { themes: new Map(), total: 0 },
    strategic: { themes: new Map(), total: 0 },
  };

  for (const strength of top5Strengths) {
    const domain = domainCounts[strength.domain];
    domain.total++;
    domain.themes.set(
      strength.themeSlug,
      (domain.themes.get(strength.themeSlug) || 0) + 1
    );
  }

  const totalTop5 = top5Strengths.length;

  return DOMAINS.map((domain) => {
    const data = domainCounts[domain.slug];
    const themes: { slug: string; name: string; count: number }[] = [];

    Array.from(data.themes.entries()).forEach(([slug, count]) => {
      const theme = THEMES.find((t) => t.slug === slug);
      if (theme) {
        themes.push({ slug, name: theme.name, count });
      }
    });

    themes.sort((a, b) => b.count - a.count);

    return {
      domain: domain.slug,
      domainName: domain.name,
      color: domain.colorHex,
      count: data.total,
      percentage: totalTop5 > 0 ? Math.round((data.total / totalTop5) * 100) : 0,
      themes,
    };
  });
}

/**
 * Calculate theme frequency across the team
 */
export function calculateThemeFrequency(
  memberStrengths: MemberStrengthData[],
  totalMembers: number,
  maxRank: number = 10
): ThemeFrequency[] {
  const themeMap = new Map<string, ThemeFrequency>();

  // Initialize all themes
  for (const theme of THEMES) {
    themeMap.set(theme.slug, {
      slug: theme.slug,
      name: theme.name,
      domain: theme.domain,
      count: 0,
      percentage: 0,
      members: [],
    });
  }

  // Count occurrences (only consider themes within maxRank)
  for (const strength of memberStrengths) {
    if (strength.rank <= maxRank) {
      const theme = themeMap.get(strength.themeSlug);
      if (theme) {
        theme.count++;
        theme.members.push({
          id: strength.memberId,
          name: strength.memberName,
          rank: strength.rank,
        });
      }
    }
  }

  // Calculate percentages and sort members by rank
  const frequencies: ThemeFrequency[] = Array.from(themeMap.values()).map((theme) => {
    theme.percentage = totalMembers > 0 ? Math.round((theme.count / totalMembers) * 100) : 0;
    theme.members.sort((a, b) => a.rank - b.rank);
    return theme;
  });

  return frequencies.sort((a, b) => b.count - a.count);
}

/**
 * Analyze gaps in team composition
 */
export function analyzeGaps(
  memberStrengths: MemberStrengthData[],
  totalMembers: number
): GapAnalysis {
  const themeFrequency = calculateThemeFrequency(memberStrengths, totalMembers, 10);
  const domainComposition = calculateDomainComposition(memberStrengths, totalMembers);

  // Find missing themes (no one has in top 10)
  const missingThemes = themeFrequency
    .filter((t) => t.count === 0)
    .map((t) => ({
      slug: t.slug,
      name: t.name,
      domain: t.domain,
    }));

  // Find underrepresented themes (less than 10% of team has it in top 10)
  const underrepresentedThemes = themeFrequency
    .filter((t) => t.count > 0 && t.percentage < 10)
    .slice(0, 10); // Top 10 most underrepresented

  // Find underrepresented domains (less than 20% of top 5s)
  const underrepresentedDomains = domainComposition
    .filter((d) => d.percentage < 20)
    .map((d) => ({
      domain: d.domain,
      name: d.domainName,
      percentage: d.percentage,
    }));

  // Generate recommendations
  const recommendations: string[] = [];

  if (underrepresentedDomains.length > 0) {
    const domainNames = underrepresentedDomains.map((d) => d.name).join(", ");
    recommendations.push(
      `Consider recruiting team members with ${domainNames} strengths to balance your team composition.`
    );
  }

  if (missingThemes.length > 5) {
    recommendations.push(
      `Your team is missing ${missingThemes.length} themes in the top 10. Consider pairing with other teams or external partners for projects requiring these strengths.`
    );
  }

  const dominantDomain = domainComposition.reduce((max, d) =>
    d.percentage > max.percentage ? d : max
  );
  if (dominantDomain.percentage > 40) {
    recommendations.push(
      `Your team leans heavily toward ${dominantDomain.domainName} (${dominantDomain.percentage}%). While this can be a strength, ensure diverse perspectives are included in decision-making.`
    );
  }

  return {
    missingThemes,
    underrepresentedThemes,
    underrepresentedDomains,
    recommendations,
  };
}

// Complementary pairings data
const COMPLEMENTARY_PAIRS: Record<string, string[]> = {
  strategic: ["achiever", "activator", "focus"],
  achiever: ["strategic", "ideation", "futuristic"],
  ideation: ["achiever", "focus", "discipline"],
  empathy: ["command", "activator", "self-assurance"],
  command: ["empathy", "harmony", "developer"],
  analytical: ["communication", "woo", "positivity"],
  communication: ["analytical", "deliberative", "context"],
  futuristic: ["focus", "deliberative", "achiever"],
  learner: ["input", "intellection", "strategic"],
  activator: ["deliberative", "analytical", "strategic"],
  deliberative: ["activator", "positivity", "woo"],
  relator: ["woo", "communication", "includer"],
  woo: ["relator", "analytical", "deliberative"],
  developer: ["maximizer", "command", "self-assurance"],
  maximizer: ["developer", "includer", "restorative"],
  harmony: ["command", "competition", "significance"],
  competition: ["harmony", "developer", "includer"],
  focus: ["adaptability", "ideation", "input"],
  adaptability: ["focus", "discipline", "deliberative"],
  positivity: ["analytical", "deliberative", "context"],
  responsibility: ["adaptability", "positivity", "ideation"],
  includer: ["competition", "maximizer", "significance"],
  discipline: ["adaptability", "ideation", "positivity"],
  restorative: ["maximizer", "positivity", "harmony"],
  arranger: ["consistency", "deliberative", "analytical"],
  consistency: ["arranger", "adaptability", "individualization"],
  individualization: ["consistency", "arranger", "discipline"],
  context: ["futuristic", "ideation", "positivity"],
  "self-assurance": ["empathy", "developer", "harmony"],
  significance: ["harmony", "includer", "developer"],
  intellection: ["communication", "activator", "woo"],
  connectedness: ["competition", "command", "significance"],
  input: ["focus", "discipline", "deliberative"],
  belief: ["adaptability", "analytical", "deliberative"],
};

/**
 * Generate partnership suggestions based on complementary strengths
 */
export function generatePartnershipSuggestions(
  memberStrengths: MemberStrengthData[],
  limit: number = 10
): PartnershipSuggestion[] {
  // Group strengths by member
  const memberMap = new Map<string, { name: string; strengths: MemberStrengthData[] }>();

  for (const strength of memberStrengths) {
    if (!memberMap.has(strength.memberId)) {
      memberMap.set(strength.memberId, { name: strength.memberName, strengths: [] });
    }
    memberMap.get(strength.memberId)!.strengths.push(strength);
  }

  // Sort each member's strengths by rank
  Array.from(memberMap.values()).forEach((member) => {
    member.strengths.sort((a, b) => a.rank - b.rank);
  });

  const members = Array.from(memberMap.entries());
  const suggestions: PartnershipSuggestion[] = [];

  // Compare each pair of members
  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      const [id1, data1] = members[i];
      const [id2, data2] = members[j];

      const top1 = data1.strengths[0];
      const top2 = data2.strengths[0];

      if (!top1 || !top2) continue;

      // Check if their top themes complement each other
      const complementary1 = COMPLEMENTARY_PAIRS[top1.themeSlug] || [];
      const complementary2 = COMPLEMENTARY_PAIRS[top2.themeSlug] || [];

      let score = 0;
      let reason = "";
      let complementaryStrength = "";

      // Check for direct complementary match (top theme complements other's top theme)
      if (complementary1.includes(top2.themeSlug)) {
        score += 30;
        reason = `${top1.themeName} and ${top2.themeName} are highly complementary`;
        complementaryStrength = top2.themeName;
      }
      if (complementary2.includes(top1.themeSlug)) {
        score += 30;
        if (!reason) {
          reason = `${top2.themeName} and ${top1.themeName} are highly complementary`;
          complementaryStrength = top1.themeName;
        }
      }

      // Check for different domain balance
      if (top1.domain !== top2.domain) {
        score += 20;
        if (!reason) {
          reason = `Balanced partnership: ${data1.name} brings ${getDomainName(top1.domain)} while ${data2.name} brings ${getDomainName(top2.domain)}`;
          complementaryStrength = top2.themeName;
        }
      }

      // Check for complementary strengths in top 5
      const top5_1 = data1.strengths.slice(0, 5).map((s) => s.themeSlug);
      const top5_2 = data2.strengths.slice(0, 5).map((s) => s.themeSlug);

      for (const theme of top5_1) {
        const complements = COMPLEMENTARY_PAIRS[theme] || [];
        for (const comp of complements) {
          if (top5_2.includes(comp)) {
            score += 10;
          }
        }
      }

      if (score > 0) {
        suggestions.push({
          member1: { id: id1, name: data1.name, topTheme: top1.themeName },
          member2: { id: id2, name: data2.name, topTheme: top2.themeName },
          reason: reason || "Diverse skill sets that complement each other",
          complementaryStrength: complementaryStrength || top2.themeName,
          score,
        });
      }
    }
  }

  // Sort by score and return top suggestions
  return suggestions.sort((a, b) => b.score - a.score).slice(0, limit);
}

function getDomainName(domain: DomainSlug): string {
  return DOMAINS.find((d) => d.slug === domain)?.name || domain;
}
