const UNITS: Record<string, number> = {
  ns: 1e-6,
  us: 1e-3, "μs": 1e-3, micro: 1e-3, microsecond: 1e-3, microseconds: 1e-3,
  ms: 1, msec: 1, millisecond: 1, milliseconds: 1,
  s: 1000, sec: 1000, secs: 1000, second: 1000, seconds: 1000,
  m: 60_000, min: 60_000, mins: 60_000, minute: 60_000, minutes: 60_000,
  h: 3_600_000, hr: 3_600_000, hrs: 3_600_000, hour: 3_600_000, hours: 3_600_000,
  d: 86_400_000, day: 86_400_000, days: 86_400_000,
  w: 604_800_000, wk: 604_800_000, week: 604_800_000, weeks: 604_800_000,
};

const TOKEN_RE = /(-?\d+(?:\.\d+)?)\s*([a-zμ]+)/gi;

/**
 * Parse a human-friendly duration string into milliseconds.
 *
 * Accepts forms like `"1h30m"`, `"2 days 5 hours"`, `"500ms"`, `"1.5h"`, `"90s"`.
 * A bare numeric string is interpreted as milliseconds.
 *
 * Returns `null` for unparseable input. Never throws.
 *
 * Units understood (case-insensitive):
 * - `ns`
 * - `us` / `μs` / `microsecond[s]`
 * - `ms` / `millisecond[s]`
 * - `s` / `sec[s]` / `second[s]`
 * - `m` / `min[s]` / `minute[s]`
 * - `h` / `hr[s]` / `hour[s]`
 * - `d` / `day[s]`
 * - `w` / `wk` / `week[s]`
 */
export function parse(input: string): number | null {
  if (typeof input !== "string") return null;
  const s = input.trim().toLowerCase();
  if (!s) return null;
  if (/^-?\d+(?:\.\d+)?$/.test(s)) return parseFloat(s);

  // Strip insignificant whitespace and commas, then require that the remaining
  // string is fully covered by contiguous (number, unit) tokens.
  const stripped = s.replace(/[\s,]+/g, "");
  let total = 0;
  let cursor = 0;
  const re = /(-?\d+(?:\.\d+)?)([a-zμ]+)/g;
  let matched = false;
  let m: RegExpExecArray | null;
  while ((m = re.exec(stripped)) !== null) {
    if (m.index !== cursor) return null;
    const factor = UNITS[m[2]!];
    if (factor === undefined) return null;
    total += parseFloat(m[1]!) * factor;
    cursor = m.index + m[0].length;
    matched = true;
  }
  if (!matched || cursor !== stripped.length) return null;
  return total;
}

export interface FormatOptions {
  /** Largest unit to use. Default `"w"`. */
  largestUnit?: "w" | "d" | "h" | "m" | "s" | "ms";
  /** Smallest unit to use. Components below it are folded into the smallest. Default `"ms"`. */
  smallestUnit?: "w" | "d" | "h" | "m" | "s" | "ms";
  /** No spaces between units (e.g. `"1h30m"`). Default false. */
  compact?: boolean;
  /** Show at most N components (e.g. `1h 30m` with 2). Default Infinity. */
  maxComponents?: number;
}

const UNIT_ORDER: Array<{ key: string; ms: number; abbr: string }> = [
  { key: "w", ms: 604_800_000, abbr: "w" },
  { key: "d", ms: 86_400_000, abbr: "d" },
  { key: "h", ms: 3_600_000, abbr: "h" },
  { key: "m", ms: 60_000, abbr: "m" },
  { key: "s", ms: 1000, abbr: "s" },
  { key: "ms", ms: 1, abbr: "ms" },
];

function rankOf(key: string): number {
  return UNIT_ORDER.findIndex((u) => u.key === key);
}

/**
 * Format a millisecond duration as a human-readable string.
 *
 * ```
 * format(5_400_000)              // "1h 30m"
 * format(5_400_000, { compact: true })   // "1h30m"
 * format(5_400_000, { maxComponents: 1 }) // "1h"
 * ```
 *
 * Negative durations are formatted with a leading `-`.
 */
export function format(ms: number, opts: FormatOptions = {}): string {
  if (!Number.isFinite(ms)) return String(ms);
  const negative = ms < 0;
  let remaining = Math.abs(ms);

  const largest = rankOf(opts.largestUnit ?? "w");
  const smallest = rankOf(opts.smallestUnit ?? "ms");
  const smallestExplicit = opts.smallestUnit !== undefined;
  const maxComponents = opts.maxComponents ?? Infinity;
  const joiner = opts.compact ? "" : " ";

  if (ms === 0) return `0${UNIT_ORDER[smallest]!.abbr}`;

  // Skip leading zero-value units so `format(5_430_000, {maxComponents: 1})` picks
  // the most natural unit (hours), not the largest configured unit (weeks).
  let startIdx = largest;
  while (startIdx < smallest && Math.floor(remaining / UNIT_ORDER[startIdx]!.ms) < 1) {
    startIdx++;
  }

  const parts: string[] = [];
  for (let i = startIdx; i <= smallest && parts.length < maxComponents; i++) {
    const u = UNIT_ORDER[i]!;
    const isLastSlot = i === smallest || parts.length === maxComponents - 1;
    if (isLastSlot) {
      const isFinestUnit = i === UNIT_ORDER.length - 1; // ms — no rounding needed
      const rounded = isFinestUnit ? remaining : Math.round(remaining / u.ms);
      // Always emit the smallest unit when the caller asked for it explicitly,
      // even when the value is zero (so `1h 30m 0s` is possible).
      if (rounded > 0 || !parts.length || (smallestExplicit && i === smallest)) {
        parts.push(`${rounded}${u.abbr}`);
      }
      break;
    }
    const v = Math.floor(remaining / u.ms);
    if (v > 0) {
      parts.push(`${v}${u.abbr}`);
      remaining -= v * u.ms;
    }
  }
  const body = parts.length ? parts.join(joiner) : `0${UNIT_ORDER[smallest]!.abbr}`;
  return negative ? `-${body}` : body;
}
