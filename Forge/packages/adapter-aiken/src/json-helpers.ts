export function asRecord(value: unknown, context: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null) {
    throw new Error(`expected an object for ${context}`);
  }
  return value as Record<string, unknown>;
}
