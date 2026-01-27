import * as XLSX from "xlsx";
import { THEMES } from "@/constants/strengths-data";

/**
 * Gallup Access Excel Parser
 *
 * Parses the Gallup Access export format where columns contain 34 theme names as headers
 * and cell values are the rank (1-34) for each participant.
 *
 * Auto-detects the header row by scanning for cells matching known CliftonStrengths theme names.
 */

// Build a lookup from normalized theme name to theme data
const THEME_NAME_MAP = new Map<string, { name: string; slug: string; domain: string }>();
for (const theme of THEMES) {
  THEME_NAME_MAP.set(theme.name.toLowerCase(), {
    name: theme.name,
    slug: theme.slug,
    domain: theme.domain,
  });
}

// All 34 known theme names (lowercase) for header detection
const KNOWN_THEME_NAMES = new Set(THEME_NAME_MAP.keys());

export interface GallupExcelTheme {
  themeName: string;
  themeSlug: string;
  domain: string;
  rank: number;
}

export interface GallupExcelRow {
  rowNumber: number;
  participantName: string;
  participantEmail: string | null;
  themes: GallupExcelTheme[];
  warnings: string[];
}

export interface GallupExcelParseResult {
  rows: GallupExcelRow[];
  totalRows: number;
  validRows: number;
  warnings: string[];
  errors: string[];
}

/**
 * Normalize a cell value to a string for comparison
 */
function normalizeCell(val: unknown): string {
  if (val === null || val === undefined) return "";
  return String(val).trim();
}

/**
 * Check if a string looks like a known theme name
 */
function isThemeName(val: string): boolean {
  return KNOWN_THEME_NAMES.has(val.toLowerCase());
}

/**
 * Auto-detect which row contains the theme name headers and which columns they're in.
 * Returns { headerRowIndex, themeColumns, nameColumn, emailColumn }
 */
function detectLayout(sheet: XLSX.WorkSheet): {
  headerRowIndex: number;
  themeColumns: Map<number, { name: string; slug: string; domain: string }>;
  nameColumnIndex: number;
  emailColumnIndex: number;
} | null {
  const range = XLSX.utils.decode_range(sheet["!ref"] || "A1");
  const maxScanRows = Math.min(range.e.r, 20); // Scan first 20 rows

  for (let r = range.s.r; r <= maxScanRows; r++) {
    const themeColumns = new Map<number, { name: string; slug: string; domain: string }>();
    let nameColumnIndex = -1;
    let emailColumnIndex = -1;

    for (let c = range.s.c; c <= range.e.c; c++) {
      const cellRef = XLSX.utils.encode_cell({ r, c });
      const cell = sheet[cellRef];
      if (!cell) continue;

      const val = normalizeCell(cell.v);
      const valLower = val.toLowerCase();

      // Check if this is a theme header
      if (isThemeName(val)) {
        const theme = THEME_NAME_MAP.get(valLower);
        if (theme) {
          themeColumns.set(c, theme);
        }
      }

      // Try to detect name/email columns
      if (
        valLower === "name" ||
        valLower === "full name" ||
        valLower === "participant" ||
        valLower === "participant name" ||
        valLower === "last name, first name"
      ) {
        nameColumnIndex = c;
      }

      if (
        valLower === "email" ||
        valLower === "email address" ||
        valLower === "e-mail"
      ) {
        emailColumnIndex = c;
      }
    }

    // If we found at least 20 theme names in this row, it's likely the header
    if (themeColumns.size >= 20) {
      // If name column wasn't labeled, use the first column before the theme columns
      if (nameColumnIndex === -1) {
        const themeColIndices = [...themeColumns.keys()].sort((a, b) => a - b);
        const firstThemeCol = themeColIndices[0];
        // Use column 0 or the column just before themes
        nameColumnIndex = firstThemeCol > 0 ? 0 : -1;
      }

      return {
        headerRowIndex: r,
        themeColumns,
        nameColumnIndex,
        emailColumnIndex,
      };
    }
  }

  return null;
}

/**
 * Parse a Gallup Access Excel file buffer and extract member strengths.
 */
export function parseGallupExcel(buffer: Buffer): GallupExcelParseResult {
  const result: GallupExcelParseResult = {
    rows: [],
    totalRows: 0,
    validRows: 0,
    warnings: [],
    errors: [],
  };

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: "buffer" });
  } catch (err) {
    result.errors.push(
      `Failed to read Excel file: ${err instanceof Error ? err.message : "Unknown error"}`
    );
    return result;
  }

  // Use the first sheet
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    result.errors.push("No sheets found in the Excel file");
    return result;
  }

  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    result.errors.push("Failed to read first sheet");
    return result;
  }

  // Detect layout
  const layout = detectLayout(sheet);
  if (!layout) {
    result.errors.push(
      "Could not detect CliftonStrengths theme headers. Expected a row with theme names (Achiever, Strategic, etc.) as column headers."
    );
    return result;
  }

  if (layout.themeColumns.size < 34) {
    result.warnings.push(
      `Found ${layout.themeColumns.size} of 34 expected theme columns. Some themes may be missing.`
    );
  }

  // Parse data rows
  const range = XLSX.utils.decode_range(sheet["!ref"] || "A1");
  const dataStartRow = layout.headerRowIndex + 1;

  for (let r = dataStartRow; r <= range.e.r; r++) {
    const rowWarnings: string[] = [];
    const rowNumber = r + 1; // 1-indexed for display

    // Read participant name
    let participantName = "";
    if (layout.nameColumnIndex >= 0) {
      const nameCell = sheet[XLSX.utils.encode_cell({ r, c: layout.nameColumnIndex })];
      participantName = normalizeCell(nameCell?.v);
    }

    // Read participant email
    let participantEmail: string | null = null;
    if (layout.emailColumnIndex >= 0) {
      const emailCell = sheet[XLSX.utils.encode_cell({ r, c: layout.emailColumnIndex })];
      const emailVal = normalizeCell(emailCell?.v);
      if (emailVal && emailVal.includes("@")) {
        participantEmail = emailVal.toLowerCase();
      }
    }

    // Skip completely empty rows
    if (!participantName && !participantEmail) {
      // Check if any theme columns have data
      let hasData = false;
      for (const colIdx of layout.themeColumns.keys()) {
        const cell = sheet[XLSX.utils.encode_cell({ r, c: colIdx })];
        if (cell && normalizeCell(cell.v)) {
          hasData = true;
          break;
        }
      }
      if (!hasData) continue;
    }

    result.totalRows++;

    // If no name found, generate a placeholder
    if (!participantName) {
      participantName = `Row ${rowNumber} Participant`;
      rowWarnings.push("No name found for this row");
    }

    // Read theme ranks
    const themes: GallupExcelTheme[] = [];
    const usedRanks = new Set<number>();

    for (const [colIdx, themeInfo] of layout.themeColumns) {
      const cell = sheet[XLSX.utils.encode_cell({ r, c: colIdx })];
      const val = normalizeCell(cell?.v);

      if (!val) {
        rowWarnings.push(`Missing rank for ${themeInfo.name}`);
        continue;
      }

      const rank = parseInt(val, 10);
      if (isNaN(rank) || rank < 1 || rank > 34) {
        rowWarnings.push(`Invalid rank "${val}" for ${themeInfo.name} (expected 1-34)`);
        continue;
      }

      if (usedRanks.has(rank)) {
        rowWarnings.push(`Duplicate rank ${rank} for ${themeInfo.name}`);
        continue;
      }

      usedRanks.add(rank);
      themes.push({
        themeName: themeInfo.name,
        themeSlug: themeInfo.slug,
        domain: themeInfo.domain,
        rank,
      });
    }

    // Sort by rank
    themes.sort((a, b) => a.rank - b.rank);

    if (themes.length < 5) {
      rowWarnings.push(`Only ${themes.length} valid themes found (minimum 5 required)`);
    }

    if (themes.length >= 5) {
      result.validRows++;
    }

    result.rows.push({
      rowNumber,
      participantName,
      participantEmail,
      themes,
      warnings: rowWarnings,
    });
  }

  if (result.totalRows === 0) {
    result.errors.push("No data rows found after the header row");
  }

  return result;
}
