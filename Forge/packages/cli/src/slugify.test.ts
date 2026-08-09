import { describe, expect, it } from "vitest";
import { slugify } from "./slugify.js";

describe("slugify", () => {
  it("derives a slug from the meaningful words in a description", () => {
    expect(slugify("Build an escrow smart contract with milestone-based payments")).toBe(
      "escrow-smart-contract",
    );
  });

  it("falls back to a generic name when nothing but stopwords remain", () => {
    expect(slugify("Build a the with for")).toBe("forge-project");
  });

  it("strips punctuation", () => {
    expect(slugify("Build an escrow, please!")).toBe("escrow-please");
  });
});
