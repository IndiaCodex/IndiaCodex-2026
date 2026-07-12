import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { ISdkGeneratorPort } from "@forge/application";
import type { Blueprint } from "@forge/domain";
import { generateSdkModule } from "./sdk-module-generator.js";

export class SdkGeneratorAdapter implements ISdkGeneratorPort {
  async generate(blueprint: Blueprint, outDir: string): Promise<readonly string[]> {
    await mkdir(outDir, { recursive: true });
    const filePath = join(outDir, "index.ts");
    await writeFile(filePath, generateSdkModule(blueprint), "utf8");
    return [filePath];
  }
}
