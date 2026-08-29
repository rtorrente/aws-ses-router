import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { includeIgnoreFile } from "@eslint/compat";
import js from "@eslint/js";
import { configs, plugins, rules } from "eslint-config-airbnb-extended";
import { rules as prettierConfigRules } from "eslint-config-prettier";
import prettierPlugin from "eslint-plugin-prettier";

const gitignorePath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".gitignore",
);

const ignoreFiles = ["commitlint.config.cjs"];

export default [
  ...(existsSync(gitignorePath) ? [includeIgnoreFile(gitignorePath)] : []),
  ...ignoreFiles,
  { name: "js/config", ...js.configs.recommended },
  plugins.stylistic,
  plugins.importX,
  ...configs.base.recommended,
  rules.base.importsStrict,
  plugins.typescriptEslint,
  ...configs.base.typescript,
  rules.typescript.typescriptEslintStrict,
  {
    name: "prettier/plugin/config",
    plugins: { prettier: prettierPlugin },
  },
  {
    name: "prettier/config",
    rules: {
      ...prettierConfigRules,
      "prettier/prettier": "error",
    },
  },
  {
    name: "custom/config",
    rules: {
      "import-x/prefer-default-export": "off",
      "no-use-before-define": ["error", { functions: false }],
      "arrow-body-style": "off",
      "@typescript-eslint/no-use-before-define": [
        "error",
        { functions: false },
      ],
      "@typescript-eslint/prefer-nullish-coalescing": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-empty-function": "warn",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-unnecessary-type-arguments": "off",
    },
  },
];
