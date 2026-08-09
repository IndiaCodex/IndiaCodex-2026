/**
 * Normalizes input text by trimming trailing/leading whitespace and normalizing line breaks.
 */
export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .trim()
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');
}

/**
 * Interface representing the required fields for the Cardano idea proof registration.
 */
export interface IdeaPayloadInput {
  title: string;
  short_description: string;
  problem_statement: string;
  proposed_solution: string;
  target_users: string;
  owner_id: string;
  submitted_at: number | string;
}

/**
 * Returns a canonical, sorted key-value object of the idea fields to be hashed.
 * Sorting alphabetically ensures hash verification works across different systems.
 */
export function getCanonicalPayload(idea: IdeaPayloadInput) {
  return {
    owner_id: normalizeText(idea.owner_id),
    problem_statement: normalizeText(idea.problem_statement),
    proposed_solution: normalizeText(idea.proposed_solution),
    short_description: normalizeText(idea.short_description),
    submitted_at: Number(idea.submitted_at),
    target_users: normalizeText(idea.target_users),
    title: normalizeText(idea.title),
  };
}

/**
 * Generates an isomorphic SHA-256 hash using the Web Crypto API.
 * Works seamlessly in modern browsers and Node.js v18+.
 */
export async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Main canonical hashing function used during both registration and verification.
 */
export async function hashIdea(idea: IdeaPayloadInput): Promise<{ canonicalJson: string; hash: string }> {
  const payload = getCanonicalPayload(idea);
  
  // Sort properties explicitly by alphabetically ordering keys
  const sortedPayload: Record<string, any> = {};
  Object.keys(payload)
    .sort()
    .forEach((key) => {
      sortedPayload[key] = (payload as any)[key];
    });

  const canonicalJson = JSON.stringify(sortedPayload);
  const hash = await sha256(canonicalJson);
  
  return { canonicalJson, hash };
}
