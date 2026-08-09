import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import eslintConfigPrettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";

export default defineConfig(
  globalIgnores(["**/dist/**", "**/node_modules/**", "**/coverage/**", "**/*.tsbuildinfo"]),
  js.configs.recommended,
  {
    files: ["packages/**/*.ts", "examples/**/*.ts"],
    extends: [tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": "error",
    },
  },
  {
    files: ["*.js", "*.mjs", "*.ts"],
    extends: [tseslint.configs.recommended],
  },
  {
    files: ["**/*.test.ts"],
    rules: {
      // vi.fn()-mocked methods passed to expect(...) are not "unbound"
      // in any way that matters — this rule exists for plain object
      // methods that rely on `this`, which test doubles never do.
      "@typescript-eslint/unbound-method": "off",
    },
  },
  eslintConfigPrettier,
);
