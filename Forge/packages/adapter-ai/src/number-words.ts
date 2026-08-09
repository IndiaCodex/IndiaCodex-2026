const NUMBER_WORDS: Readonly<Record<string, number>> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
};

/**
 * Extracts every number mentioned in free text, in the order encountered —
 * digits first within a match, then spelled-out number words. This is
 * intentionally simple: it has no notion of which number belongs to which
 * concept, which is why callers only use it where exactly one numeric
 * parameter is in play.
 */
export function extractNumbers(text: string): readonly number[] {
  const found: number[] = [];

  for (const match of text.matchAll(/\b\d+\b/g)) {
    found.push(Number.parseInt(match[0], 10));
  }

  const lower = text.toLowerCase();
  for (const [word, value] of Object.entries(NUMBER_WORDS)) {
    if (new RegExp(`\\b${word}\\b`).test(lower)) {
      found.push(value);
    }
  }

  return found;
}
