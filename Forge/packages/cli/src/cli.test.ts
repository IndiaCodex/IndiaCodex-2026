import { describe, expect, it } from "vitest";
import { runCli, UnknownCommandError } from "./cli.js";

describe("runCli", () => {
  it("throws UnknownCommandError for an unrecognized command", async () => {
    await expect(runCli(["not-a-real-command"])).rejects.toThrow(UnknownCommandError);
  });

  it("prints usage and resolves cleanly when no command is given", async () => {
    await expect(runCli([])).resolves.toBeUndefined();
  });
});
