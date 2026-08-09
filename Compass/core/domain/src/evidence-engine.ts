import { MissingEvidenceError } from './errors.js';
import type { Evidence, EvidenceSourceType } from './evidence.js';
import type { EvidenceId } from './ids.js';

/**
 * The Evidence Engine owns the one rule every other engine in this package
 * depends on: nothing gets to assert a conclusion without citing the
 * Evidence that produced it (ADR 0006). It is deliberately small — a guard
 * and a strength ordering — because Evidence itself is just data; the
 * discipline of never skipping the citation is the actual product.
 */

/**
 * Throws MissingEvidenceError if the given evidence id list is empty.
 * Every factory in this package that can produce a non-"unverified" /
 * non-"low-confidence-by-default" conclusion calls this before doing so.
 */
export function requireEvidence(evidenceIds: readonly EvidenceId[], context: string): void {
  if (evidenceIds.length === 0) {
    throw new MissingEvidenceError(
      `${context} requires at least one Evidence citation; none was provided. ` +
        'Absence of evidence must resolve to "unverified", never be asserted directly.',
    );
  }
}

/**
 * A fixed, explainable ordering of how strongly each source type backs a
 * conclusion. Not a numeric confidence score — see
 * docs/architecture/compatibility-engine.md#what-evidence-looks-like for why
 * that distinction is deliberate. Used only to let a rule or a consumer ask
 * "is this backed by at least a declared/observed fact" rather than
 * "assume every source type is equally trustworthy."
 */
const SOURCE_STRENGTH_ORDER: readonly EvidenceSourceType[] = [
  'community-report',
  'maintainer-declaration',
  'declared-metadata',
  'observed-result',
];

function strengthRank(sourceType: EvidenceSourceType): number {
  return SOURCE_STRENGTH_ORDER.indexOf(sourceType);
}

/** True if at least one piece of evidence meets or exceeds the given minimum source strength. */
export function meetsMinimumStrength(evidence: readonly Evidence[], minimum: EvidenceSourceType): boolean {
  const threshold = strengthRank(minimum);
  return evidence.some((item) => strengthRank(item.sourceType) >= threshold);
}

/** The strongest source type present in a set of evidence, or null if the set is empty. */
export function strongestSourceType(evidence: readonly Evidence[]): EvidenceSourceType | null {
  if (evidence.length === 0) return null;
  return evidence.reduce((strongest, item) =>
    strengthRank(item.sourceType) > strengthRank(strongest.sourceType) ? item : strongest,
  ).sourceType;
}
