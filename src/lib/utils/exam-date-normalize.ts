/**
 * Normaliza fechas de exámenes (PDF, formularios) a `YYYY-MM-DD` en UTC calendario.
 * Prioridad DD/MM (Argentina); no interpreta MM/DD.
 */

const ISO_PREFIX_RE = /^(\d{4})-(\d{2})-(\d{2})/;

const DD_MM_SLASH_RE = /^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/;
const DD_MM_DASH_RE = /^(\d{1,2})-(\d{1,2})(?:-(\d{2,4}))?$/;

const YEAR_MIN = 1900;
const YEAR_MAX = 2100;

function isValidUtcYmd(y: number, m: number, d: number): boolean {
  if (y < YEAR_MIN || y > YEAR_MAX) return false;
  if (m < 1 || m > 12) return false;
  if (d < 1 || d > 31) return false;
  const t = Date.UTC(y, m - 1, d);
  const dt = new Date(t);
  return (
    dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d
  );
}

function expandYearPart(raw: string): number | null {
  if (raw.length === 2) {
    const n = Number(raw);
    if (!Number.isFinite(n)) return null;
    return 2000 + n;
  }
  const y = Number(raw);
  if (!Number.isFinite(y)) return null;
  return y;
}

function tryDdMmPattern(
  trimmed: string,
  re: RegExp,
): string | null {
  const m = re.exec(trimmed);
  if (!m) return null;

  const day = Number(m[1]);
  const month = Number(m[2]);
  if (!Number.isInteger(day) || !Number.isInteger(month)) return null;

  let year: number;
  if (m[3] !== undefined) {
    const expanded = expandYearPart(m[3]);
    if (expanded === null) return null;
    year = expanded;
  } else {
    year = new Date().getFullYear();
  }

  if (!isValidUtcYmd(year, month, day)) return null;

  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

/**
 * @returns `YYYY-MM-DD` o `null` si vacío o no parseable.
 */
export function normalizeExamDateToIso(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const isoMatch = ISO_PREFIX_RE.exec(trimmed);
  if (isoMatch) {
    const y = Number(isoMatch[1]);
    const mo = Number(isoMatch[2]);
    const d = Number(isoMatch[3]);
    if (!isValidUtcYmd(y, mo, d)) return null;
    return trimmed.slice(0, 10);
  }

  const slash = tryDdMmPattern(trimmed, DD_MM_SLASH_RE);
  if (slash) return slash;

  const dash = tryDdMmPattern(trimmed, DD_MM_DASH_RE);
  if (dash) return dash;

  return null;
}
