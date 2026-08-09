import { IFileSystemPortToken } from "@forge/application";
import type { ForgePlugin } from "@forge/plugin-api";
import { NodeFileSystemAdapter } from "./node-file-system.adapter.js";

export function createFileSystemPlugin(): ForgePlugin {
  return {
    name: "@forge/adapter-filesystem",
    version: "0.0.0",
    register: (context) => {
      context.bindPort(IFileSystemPortToken, new NodeFileSystemAdapter());
    },
  };
}
