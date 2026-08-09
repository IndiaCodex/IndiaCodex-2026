import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NodeFileSystemAdapter } from "./node-file-system.adapter.js";

describe("NodeFileSystemAdapter", () => {
  let root: string;
  const adapter = new NodeFileSystemAdapter();

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), "forge-fs-test-"));
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it("reports a path as not existing until it is created", async () => {
    const target = join(root, "validators");
    expect(await adapter.exists(target)).toBe(false);

    await adapter.mkdir(target);

    expect(await adapter.exists(target)).toBe(true);
  });

  it("writes and reads a file, creating parent directories as needed", async () => {
    const target = join(root, "nested", "dir", "README.md");

    await adapter.writeFile(target, "# hello");

    expect(await adapter.readFile(target)).toBe("# hello");
  });
});
