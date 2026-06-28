import { FlatCompat } from "@eslint/eslintrc";
import eslintConfigPrettier from "eslint-config-prettier";

const compat = new FlatCompat();

const eslintConfig = [
  {
    ignores: [".next/**", "next-env.d.ts", "build/**", "dist/**", "*.tsbuildinfo"],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  eslintConfigPrettier,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          ignoreRestSiblings: true,
          // Allow unused type exports (used for Tree display in UI components)
        },
      ],
    },
  },
];

export default eslintConfig;
