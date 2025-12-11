import pdfParse from "pdf-parse";
import { ALL_THEME_NAMES, THEMES, getDomainForTheme } from "@/constants/strengths-data";

export interface ParsedTheme {
  name: string;
  slug: string;
  domain: string;
  rank: number;
  personalizedDescription?: string;
}

export interface ParsedStrengthsReport {
  participantName: string | null;
  themes: ParsedTheme[];
  reportType: "TOP_5" | "TOP_10" | "ALL_34";
  confidence: number;
  rawText?: string;
}

// Normalize theme names for matching
function normalizeThemeName(name: string): string {
  return name
    .replace(/[®™]/g, "")
    .replace(/\s+/g, " ")
    .replace(/-/g, " ")
    .trim()
    .toLowerCase();
}

// Create lookup map for themes
const THEME_LOOKUP = new Map<string, (typeof THEMES)[0]>();
for (const theme of THEMES) {
  THEME_LOOKUP.set(normalizeThemeName(theme.name), theme);
  // Also add variations
  THEME_LOOKUP.set(theme.name.toLowerCase(), theme);
  THEME_LOOKUP.set(theme.slug, theme);
}

// Try to find a valid theme from text
function findTheme(text: string): (typeof THEMES)[0] | null {
  const normalized = normalizeThemeName(text);
  return THEME_LOOKUP.get(normalized) || null;
}

// Extract participant name from common patterns
function extractParticipantName(text: string): string | null {
  // Common patterns in CliftonStrengths reports
  const patterns = [
    // "Your Signature Themes\nJohn Doe" or similar
    /Your (?:Signature|Top) (?:Themes?|Strengths?)\s*[\n\r]+([A-Z][a-z]+ [A-Z][a-z]+)/i,
    // "Signature Themes Report\nJohn Doe"
    /(?:Signature|Top) (?:Themes?|Strengths?) Report\s*[\n\r]+([A-Z][a-z]+ [A-Z][a-z]+)/i,
    // "CliftonStrengths 34\nJohn Doe"
    /CliftonStrengths\s*(?:34|for)?\s*[\n\r]+([A-Z][a-z]+ [A-Z][a-z]+)/i,
    // Name at the very beginning followed by date or report info
    /^([A-Z][a-z]+ [A-Z][a-z]+)\s*[\n\r]/m,
    // "Prepared for John Doe"
    /Prepared for[:\s]+([A-Z][a-z]+ [A-Z][a-z]+)/i,
    // "Report for: John Doe"
    /Report (?:for|to)[:\s]+([A-Z][a-z]+ [A-Z][a-z]+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const name = match[1].trim();
      // Validate it looks like a name (not a theme name)
      if (!findTheme(name) && name.length > 3 && name.length < 50) {
        return name;
      }
    }
  }

  return null;
}

// Extract themes in order of appearance
function extractThemes(text: string): ParsedTheme[] {
  const themes: ParsedTheme[] = [];
  const seenThemes = new Set<string>();

  // Create regex pattern to match all theme names
  const themeNames = ALL_THEME_NAMES.map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const themePattern = new RegExp(`\\b(${themeNames.join("|")})\\b`, "gi");

  // Find all theme mentions
  let match;
  while ((match = themePattern.exec(text)) !== null) {
    const matchedText = match[1];
    const theme = findTheme(matchedText);

    if (theme && !seenThemes.has(theme.slug)) {
      seenThemes.add(theme.slug);
      const domain = getDomainForTheme(theme.slug);

      themes.push({
        name: theme.name,
        slug: theme.slug,
        domain: domain?.slug || "executing",
        rank: themes.length + 1,
        personalizedDescription: extractDescriptionForTheme(text, theme.name, match.index),
      });
    }
  }

  return themes;
}

// Try to extract personalized description for a theme
function extractDescriptionForTheme(text: string, themeName: string, startIndex: number): string | undefined {
  // Look for text following the theme name (up to the next theme or ~500 chars)
  const afterTheme = text.substring(startIndex + themeName.length, startIndex + themeName.length + 800);

  // Find the first meaningful paragraph after the theme name
  const paragraphMatch = afterTheme.match(/[\n\r]+([A-Z][^.!?]*[.!?](?:[^.!?]*[.!?]){0,3})/);

  if (paragraphMatch && paragraphMatch[1]) {
    const description = paragraphMatch[1].trim();
    // Only return if it looks like a real description
    if (description.length > 50 && description.length < 500 && !findTheme(description.split(" ")[0])) {
      return description;
    }
  }

  return undefined;
}

// Determine report type based on theme count
function determineReportType(themeCount: number): "TOP_5" | "TOP_10" | "ALL_34" {
  if (themeCount >= 30) return "ALL_34";
  if (themeCount >= 8) return "TOP_10";
  return "TOP_5";
}

// Calculate confidence score
function calculateConfidence(themes: ParsedTheme[]): number {
  const validCount = themes.length;

  // Perfect match for expected counts
  if (validCount === 34) return 0.98;
  if (validCount === 10) return 0.95;
  if (validCount === 5) return 0.95;

  // Close to expected counts
  if (validCount >= 32 && validCount <= 34) return 0.9;
  if (validCount >= 8 && validCount <= 12) return 0.85;
  if (validCount >= 4 && validCount <= 6) return 0.85;

  // Reasonable but not exact
  if (validCount >= 3) return 0.7;

  // Low confidence
  return Math.min(validCount * 0.15, 0.6);
}

// Main parsing function
export async function parseCliftonStrengthsPDF(buffer: Buffer): Promise<ParsedStrengthsReport> {
  // Parse PDF to text
  const data = await pdfParse(buffer, {
    // Options for better text extraction
    max: 0, // No page limit
  });

  const text = data.text;

  // Extract data
  const participantName = extractParticipantName(text);
  const themes = extractThemes(text);
  const reportType = determineReportType(themes.length);
  const confidence = calculateConfidence(themes);

  return {
    participantName,
    themes,
    reportType,
    confidence,
    rawText: process.env.NODE_ENV === "development" ? text : undefined,
  };
}

// Alternative: Parse from plain text (for testing or manual input)
export function parseStrengthsFromText(text: string, participantName?: string): ParsedStrengthsReport {
  const themes = extractThemes(text);
  const reportType = determineReportType(themes.length);
  const confidence = calculateConfidence(themes);

  return {
    participantName: participantName || extractParticipantName(text),
    themes,
    reportType,
    confidence,
  };
}

// Validate parsed data against expected structure
export function validateParsedReport(report: ParsedStrengthsReport): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check themes
  if (report.themes.length === 0) {
    errors.push("No strength themes found in the document");
  } else if (report.themes.length < 5) {
    warnings.push(`Only ${report.themes.length} themes found. Expected at least 5.`);
  }

  // Check for duplicate ranks
  const ranks = new Set<number>();
  for (const theme of report.themes) {
    if (ranks.has(theme.rank)) {
      errors.push(`Duplicate rank ${theme.rank} found`);
    }
    ranks.add(theme.rank);
  }

  // Check participant name
  if (!report.participantName) {
    warnings.push("Could not extract participant name from document");
  }

  // Check confidence
  if (report.confidence < 0.7) {
    warnings.push(`Low confidence score (${Math.round(report.confidence * 100)}%). Manual verification recommended.`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
