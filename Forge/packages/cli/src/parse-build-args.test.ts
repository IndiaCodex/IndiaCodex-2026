import { describe, expect, it } from "vitest";
import { InvalidBuildArgsError, parseBuildArgs } from "./parse-build-args.js";

describe("parseBuildArgs", () => {
  it("parses a bare description with defaults", () => {
    const parsed = parseBuildArgs(["Build an escrow smart contract with milestone-based payments"]);

    expect(parsed.description).toBe("Build an escrow smart contract with milestone-based payments");
    expect(parsed.name).toBeUndefined();
    expect(parsed.network).toBe("preview");
  });

  it("parses --name and --network flags", () => {
    const parsed = parseBuildArgs([
      "Build an escrow contract",
      "--name",
      "my-escrow",
      "--network",
      "preprod",
    ]);

    expect(parsed.name).toBe("my-escrow");
    expect(parsed.network).toBe("preprod");
  });

  it("throws InvalidBuildArgsError when no description is given", () => {
    expect(() => parseBuildArgs([])).toThrow(InvalidBuildArgsError);
  });

  it("throws InvalidBuildArgsError for an unknown network", () => {
    expect(() => parseBuildArgs(["desc", "--network", "not-a-network"])).toThrow(
      InvalidBuildArgsError,
    );
  });

  it("parses a valid --min-confidence flag", () => {
    const parsed = parseBuildArgs(["desc", "--min-confidence", "0.8"]);

    expect(parsed.minConfidence).toBe(0.8);
  });

  it("leaves minConfidence undefined when the flag is not given", () => {
    const parsed = parseBuildArgs(["desc"]);

    expect(parsed.minConfidence).toBeUndefined();
  });

  it("throws InvalidBuildArgsError for a non-numeric --min-confidence", () => {
    expect(() => parseBuildArgs(["desc", "--min-confidence", "not-a-number"])).toThrow(
      InvalidBuildArgsError,
    );
  });

  it("throws InvalidBuildArgsError for a --min-confidence outside 0 to 1", () => {
    expect(() => parseBuildArgs(["desc", "--min-confidence", "1.5"])).toThrow(
      InvalidBuildArgsError,
    );
    expect(() => parseBuildArgs(["desc", "--min-confidence", "-0.1"])).toThrow(
      InvalidBuildArgsError,
    );
  });
});
