const STOPWORDS = new Set([
  "build",
  "create",
  "make",
  "an",
  "a",
  "the",
  "with",
  "for",
  "and",
  "of",
  "to",
]);

/**
 * Derives a filesystem-friendly default project name from a natural
 * language description, e.g. "Build an escrow smart contract with
 * milestone-based payments" -> "escrow-smart-contract".
 */
export function slugify(description: string): string {
  const words = description
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 0 && !STOPWORDS.has(word));

  const slug = words.slice(0, 3).join("-");
  return slug.length > 0 ? slug : "forge-project";
}
