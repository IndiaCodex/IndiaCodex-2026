import { describe, expect, it } from "vitest";
import { createPortToken } from "./port-token.js";

describe("createPortToken", () => {
  it("carries the given description", () => {
    const token = createPortToken<{ ping(): void }>("IPingPort");

    expect(token.description).toBe("IPingPort");
  });

  it("produces a unique symbol per call, even with the same description", () => {
    const first = createPortToken<number>("ISamePort");
    const second = createPortToken<number>("ISamePort");

    expect(first.key).not.toBe(second.key);
  });
});
