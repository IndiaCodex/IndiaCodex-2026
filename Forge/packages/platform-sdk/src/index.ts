export type { CreateForgeInput } from "./forge.js";
export { Forge } from "./forge.js";

// Re-exported so a plugin author, or any future presentation layer, only
// ever needs to depend on this one package.
export * from "@forge/domain";
export * from "@forge/plugin-api";
export * from "@forge/application";
