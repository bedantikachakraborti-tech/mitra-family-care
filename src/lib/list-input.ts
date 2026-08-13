// Helpers for fields that hold a list of short values (languages, skills, specialties).
// They must survive typed commas, AI/voice sentences and mixed punctuation without
// breaking legitimate multi-word values like "New Delhi" or "elder care".

const CONJUNCTIONS = [
  "and",
  "aur",
  "और",
  "এবং",
  "ও",
  "மற்றும்",
];

function tidy(value: string): string {
  return value
    .replace(/^[\s,;/·•\-–]+/, "")
    .replace(/[\s,;/·•\-–.]+$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function dedupe(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const key = value.toLowerCase();
    if (!value || seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

/**
 * Splits typed input on commas, semicolons, slashes and newlines only.
 * Multi-word values stay intact.
 */
export function parseList(value: string): string[] {
  return dedupe(
    value
      .split(/[,;\n\r]|(?:\s\/\s)/g)
      .map(tidy)
      .filter(Boolean),
  );
}

/**
 * Splits a natural sentence such as "English, Hindi and Bengali" into values.
 * Used for AI/voice output, where a model may return one string instead of a list.
 */
export function parseSpokenList(value: string): string[] {
  const conjunction = new RegExp(`\\s+(?:${CONJUNCTIONS.join("|")})\\s+`, "gi");
  return dedupe(
    value
      .split(/[,;\n\r]|(?:\s\/\s)/g)
      .flatMap((part) => part.split(conjunction))
      .map(tidy)
      .filter(Boolean),
  );
}

/** Normalises anything the AI returned for a multi-value field into a clean array. */
export function normalizeList(input: unknown): string[] {
  if (typeof input === "string") return parseSpokenList(input);
  if (!Array.isArray(input)) return [];
  return dedupe(
    input.flatMap((entry) => (typeof entry === "string" ? parseSpokenList(entry) : [])),
  );
}

export function listToText(values: string[]): string {
  return values.join(", ");
}
