/**
 * Narrative Processing Utilities
 *
 * A collection of utility functions for processing, cleaning, and extracting
 * distinct narrative content from startup idea data. These functions help
 * prevent duplication and ensure each section of the idea detail page shows
 * unique, meaningful content.
 */

/**
 * Removes duplicate strings from an array of potential string values
 * Filters out:
 * - Null/undefined values
 * - Empty strings
 * - Strings with no alphabetic characters
 * - Single words under 12 characters (likely not sentences)
 * - Duplicate content (case-insensitive)
 */
export function dedupeStrings(values: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  values.forEach((value) => {
    if (!value) return;
    const cleaned = value.trim();
    if (!cleaned) return;
    if (!/[a-zA-Z]/.test(cleaned)) return;
    if (!cleaned.includes(' ') && cleaned.length < 12) return;
    const key = cleaned.replace(/\s+/g, ' ').toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    result.push(cleaned);
  });

  return result;
}

/**
 * Cleans a narrative string by normalizing whitespace
 * Returns undefined if the value is empty or has no alphabetic characters
 */
export function cleanNarrative(value?: string | null): string | undefined {
  if (!value) return undefined;
  const cleaned = value.replace(/\s+/g, ' ').trim();
  if (!cleaned) return undefined;
  if (!/[a-zA-Z]/.test(cleaned)) return undefined;
  return cleaned;
}

/**
 * Normalizes a narrative string to lowercase for comparison
 */
export function normalizeNarrative(value?: string | null): string | null {
  const cleaned = cleanNarrative(value);
  return cleaned ? cleaned.toLowerCase() : null;
}

/**
 * Picks the first distinct text from a list of candidates
 * that hasn't already been used
 */
export function pickDistinctText(
  candidates: Array<string | null | undefined>,
  used: string[]
): string | undefined {
  const seen = new Set(
    used
      .map((entry) => normalizeNarrative(entry))
      .filter((entry): entry is string => !!entry)
  );

  for (const candidate of candidates) {
    const cleaned = cleanNarrative(candidate);
    if (!cleaned) continue;
    const normalized = normalizeNarrative(cleaned);
    if (!normalized || seen.has(normalized)) continue;
    return cleaned;
  }

  return undefined;
}

/**
 * Extracts individual sentences from a narrative string
 * Splits on sentence boundaries (., ?, !)
 */
export function extractSentences(value?: string | null): string[] {
  const cleaned = cleanNarrative(value);
  if (!cleaned) return [];

  const sentences = cleaned
    .split(/(?<=[.?!])\s+/)
    .map((sentence) => cleanNarrative(sentence))
    .filter((sentence): sentence is string => !!sentence);

  return sentences.length > 0 ? sentences : cleaned ? [cleaned] : [];
}

/**
 * Extracts the first sentence from a narrative string
 */
export function extractFirstSentence(value?: string | null): string | undefined {
  const sentences = extractSentences(value);
  return sentences[0];
}

/**
 * Picks a narrative from candidates that hasn't been used yet
 * Adds the picked narrative to the used list
 * Falls back to a provided fallback if no unique candidate is found
 */
export function pickNarrative(
  candidates: Array<string | null | undefined>,
  used: string[],
  fallback?: string
): string | undefined {
  const picked = pickDistinctText(candidates, used);
  if (picked) {
    used.push(picked);
    return picked;
  }

  const cleanedFallback = cleanNarrative(fallback);
  if (cleanedFallback) {
    const normalizedFallback = normalizeNarrative(cleanedFallback);
    const seen = new Set(
      used
        .map((entry) => normalizeNarrative(entry))
        .filter((entry): entry is string => !!entry)
    );

    if (!normalizedFallback || seen.has(normalizedFallback)) {
      return undefined;
    }

    used.push(cleanedFallback);
    return cleanedFallback;
  }

  return undefined;
}

/**
 * Determines the confidence level based on a score (0-100)
 */
export function getConfidenceLevel(score: number): string {
  if (score >= 80) return 'excellent';
  if (score >= 65) return 'good';
  if (score >= 50) return 'moderate';
  return 'low';
}

/**
 * Returns color classes for different confidence levels
 */
export function getConfidenceColors(level: string) {
  const colors = {
    excellent: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/20',
      text: 'text-emerald-700 dark:text-emerald-300',
      icon: 'text-emerald-600 dark:text-emerald-400',
      progress: 'bg-gradient-to-r from-emerald-500 to-green-500',
      border: 'border-emerald-200 dark:border-emerald-800',
    },
    good: {
      bg: 'bg-blue-50 dark:bg-blue-950/20',
      text: 'text-blue-700 dark:text-blue-300',
      icon: 'text-blue-600 dark:text-blue-400',
      progress: 'bg-gradient-to-r from-blue-500 to-cyan-500',
      border: 'border-blue-200 dark:border-blue-800',
    },
    moderate: {
      bg: 'bg-amber-50 dark:bg-amber-950/20',
      text: 'text-amber-700 dark:text-amber-300',
      icon: 'text-amber-600 dark:text-amber-400',
      progress: 'bg-gradient-to-r from-amber-500 to-orange-500',
      border: 'border-amber-200 dark:border-amber-800',
    },
    low: {
      bg: 'bg-red-50 dark:bg-red-950/20',
      text: 'text-red-700 dark:text-red-300',
      icon: 'text-red-600 dark:text-red-400',
      progress: 'bg-gradient-to-r from-red-500 to-rose-500',
      border: 'border-red-200 dark:border-red-800',
    }
  };
  return colors[level as keyof typeof colors] || colors.moderate;
}

/**
 * Returns a human-readable label for a confidence score
 */
export function getConfidenceLabel(score: number): string {
  if (score >= 80) return 'High Potential';
  if (score >= 65) return 'Good Idea';
  if (score >= 50) return 'Worth Exploring';
  return 'Needs Work';
}
