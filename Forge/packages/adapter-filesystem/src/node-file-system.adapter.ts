import { mkdir, readFile, writeFile } from "node:fs/promises";
import { access } from "node:fs/promises";
import { dirname } from "node:path";
import type { IFileSystemPort } from "@forge/application";

export class NodeFileSystemAdapter implements IFileSystemPort {
  async mkdir(path: string): Promise<void> {
    await mkdir(path, { recursive: true });
  }

  async writeFile(path: string, contents: string): Promise<void> {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, contents, "utf8");
  }

  async readFile(path: string): Promise<string> {
    return readFile(path, "utf8");
  }

  async exists(path: string): Promise<boolean> {
    try {
      await access(path);
      return true;
    } catch {
      return false;
    }
  }
}
