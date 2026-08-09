import { createPortToken } from "@forge/plugin-api";
import type { PortToken } from "@forge/plugin-api";

export interface IFileSystemPort {
  writeFile(path: string, contents: string): Promise<void>;
  mkdir(path: string): Promise<void>;
  readFile(path: string): Promise<string>;
  exists(path: string): Promise<boolean>;
}

export const IFileSystemPortToken: PortToken<IFileSystemPort> =
  createPortToken<IFileSystemPort>("IFileSystemPort");
