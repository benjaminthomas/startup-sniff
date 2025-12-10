/**
 * Text Processing Utilities
 * Extracted from ideas/[id]/page.tsx for reusability
 */

/**
 * Deduplicates and cleans an array of strings
 * Filters out empty, short, or non-alphabetic values
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
 * Returns undefined if the value is empty or non-alphabetic
 */
export function cleanNarrative(value?: string | null): string | undefined {
  if (!value) return undefined;
  const cleaned = value.replace(/\s+/g, ' ').trim();
  if (!cleaned) return undefined;
  if (!/[a-zA-Z]/.test(cleaned)) return undefined;
  return cleaned;
}

/**
 * Normalizes a narrative to lowercase for comparison
 */
export function normalizeNarrative(value?: string | null): string | null {
  const cleaned = cleanNarrative(value);
  return cleaned ? cleaned.toLowerCase() : null;
}

/**
 * Picks the first distinct text from candidates that hasn't been used
 * Used for avoiding duplicate narratives in displays
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
 * Extracts sentences from a text value
 * Splits on sentence-ending punctuation
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
 * Extracts just the first sentence from a text value
 */
export function extractFirstSentence(value?: string | null): string | undefined {
  const sentences = extractSentences(value);
  return sentences[0];
}

/**
 * Picks a narrative from multiple candidates, avoiding duplicates
 * Tries original candidates first, then falls back to sentence extraction
 */
export function pickNarrative(
  originalCandidates: Array<string | null | undefined>,
  sentenceCandidates: Array<string | null | undefined>,
  used: string[]
): string | undefined {
  // Try original candidates first
  const direct = pickDistinctText(originalCandidates, used);
  if (direct) return direct;

  // Fall back to sentence extraction
  const seen = new Set(
    used
      .map((entry) => normalizeNarrative(entry))
      .filter((entry): entry is string => !!entry)
  );

  for (const candidate of sentenceCandidates) {
    const sentences = extractSentences(candidate);
    for (const sentence of sentences) {
      const normalized = normalizeNarrative(sentence);
      if (!normalized || seen.has(normalized)) continue;
      return sentence;
    }
  }

  return undefined;
}

/**
 * Gets confidence level label based on score
 */
export function getConfidenceLevel(score: number): string {
  if (score >= 80) return 'Very High';
  if (score >= 60) return 'High';
  if (score >= 40) return 'Medium';
  if (score >= 20) return 'Low';
  return 'Very Low';
}

/**
 * Gets color classes for confidence level display
 */
export function getConfidenceColors(level: string): {
  badge: string;
  progress: string;
  text: string;
  bg: string;
} {
  switch (level) {
    case 'Very High':
      return {
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        progress: 'bg-emerald-500',
        text: 'text-emerald-600',
        bg: 'bg-emerald-50'
      };
    case 'High':
      return {
        badge: 'bg-green-100 text-green-800 border-green-200',
        progress: 'bg-green-500',
        text: 'text-green-600',
        bg: 'bg-green-50'
      };
    case 'Medium':
      return {
        badge: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        progress: 'bg-yellow-500',
        text: 'text-yellow-600',
        bg: 'bg-yellow-50'
      };
    case 'Low':
      return {
        badge: 'bg-orange-100 text-orange-800 border-orange-200',
        progress: 'bg-orange-500',
        text: 'text-orange-600',
        bg: 'bg-orange-50'
      };
    default: // Very Low
      return {
        badge: 'bg-red-100 text-red-800 border-red-200',
        progress: 'bg-red-500',
        text: 'text-red-600',
        bg: 'bg-red-50'
      };
  }
}

/**
 * Gets descriptive confidence label with emoji
 */
export function getConfidenceLabel(score: number): string {
  if (score >= 80) return '🔥 Excellent Potential';
  if (score >= 60) return '✨ Strong Potential';
  if (score >= 40) return '💡 Moderate Potential';
  if (score >= 20) return '🤔 Needs Work';
  return '⚠️ High Risk';
}
