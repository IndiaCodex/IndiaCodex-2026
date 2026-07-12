export interface ClassifiedIntent {
  readonly category: string;
  readonly confidence: number;
}

/**
 * Keyword coverage per known template category. Necessarily hand-curated —
 * classifying "does this description match this template" requires some
 * notion of what the template is about, which a template's own metadata
 * (id/description) doesn't give us in a machine-scoreable form.
 */
const CATEGORY_KEYWORDS: Readonly<Record<string, readonly string[]>> = {
  "escrow-milestone": [
    "escrow",
    "milestone",
    "milestones",
    "installment",
    "installments",
    "phased payment",
    "phased payments",
  ],
  "nft-minting-royalty": [
    "nft",
    "nfts",
    "mint",
    "minting",
    "royalty",
    "royalties",
    "collectible",
    "collectibles",
  ],
  "token-vesting": [
    "vesting",
    "vest",
    "vested",
    "cliff",
    "unlock schedule",
    "token lock",
    "release schedule",
    "beneficiary schedule",
  ],
};

/**
 * Deterministic keyword-coverage scoring — not a hosted model call. Per
 * ADR-003, intent classification only ever needs to be reliable enough to
 * pick among a small, known set of audited templates; a network-dependent
 * model would trade demo reliability for a task this well-suited to a
 * transparent heuristic.
 */
export function classifyIntent(
  description: string,
  availableCategories: readonly string[],
): ClassifiedIntent {
  const normalized = description.toLowerCase();
  let best: { category: string; score: number } | undefined;

  for (const category of availableCategories) {
    const keywords = CATEGORY_KEYWORDS[category] ?? [];
    const matches = keywords.filter((keyword) => normalized.includes(keyword));
    const score = keywords.length > 0 ? matches.length / keywords.length : 0;
    if (!best || score > best.score) {
      best = { category, score };
    }
  }

  if (!best || best.score === 0) {
    const fallback = availableCategories[0];
    if (!fallback) {
      throw new Error("No template categories are available to classify against");
    }
    return { category: fallback, confidence: 0.3 };
  }

  return { category: best.category, confidence: Math.min(1, 0.5 + best.score * 0.5) };
}
