import { describe, expect, it } from "vitest";
import { extractNumbers } from "./number-words.js";

describe("extractNumbers", () => {
  it("extracts digit numbers", () => {
    expect(extractNumbers("Build an escrow with 4 milestones")).toEqual([4]);
  });

  it("extracts spelled-out number words", () => {
    expect(extractNumbers("Build an escrow with four milestones")).toEqual([4]);
  });

  it("returns an empty array when no number is present", () => {
    expect(extractNumbers("Build an escrow smart contract with milestone-based payments")).toEqual(
      [],
    );
  });

  it("extracts multiple numbers in order encountered", () => {
    const result = extractNumbers("5 milestones over three phases");
    expect(result).toContain(5);
    expect(result).toContain(3);
  });
});
