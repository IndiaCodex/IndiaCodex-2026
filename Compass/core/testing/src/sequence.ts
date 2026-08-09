/**
 * A single monotonically increasing counter backing every builder's
 * default values, so two calls to the same builder never collide by
 * accident. Not a source of meaning — just uniqueness. Tests that want a
 * clean, predictable count (e.g. to assert on generated ids) can call
 * `resetTestSequence()` in a `beforeEach`.
 */
let counter = 0;

export function nextSequence(): number {
  counter += 1;
  return counter;
}

export function resetTestSequence(): void {
  counter = 0;
}
