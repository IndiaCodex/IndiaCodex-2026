/**
 * Deterministically serializes a JSON-compatible value with object keys
 * sorted lexicographically, so structurally identical values always
 * produce byte-identical output regardless of property insertion order.
 * This is what makes the Execution Journal's hash chain (ADR-0006)
 * reproducible: the same event content always hashes the same way,
 * independent of how it was constructed in memory.
 */
export function canonicalJson(value: unknown): string {
  return stringify(value);
}

function stringify(value: unknown): string {
  if (value === null || typeof value === "undefined") {
    return "null";
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (typeof value === "string") {
    return JSON.stringify(value);
  }
  if (value instanceof Date) {
    return JSON.stringify(value.toISOString());
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stringify(item)).join(",")}]`;
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stringify(v)}`).join(",")}}`;
  }
  throw new TypeError(`Cannot canonicalize value of type ${typeof value}`);
}
