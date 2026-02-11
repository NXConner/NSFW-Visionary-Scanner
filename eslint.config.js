import js from "@eslint/js";
import globals from "globals";
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/coverage/**",
      "**/.vite/**",
      "**/.turbo/**",
      "**/.cache/**",
      "android/**",
      "ios/**",
      "supabase/**",
      "exports/**",
      "public/**",
      "deleted files/**",
      "**/*.min.*",
    ],
  },

  // Baseline JS rules
  js.configs.recommended,

  // TypeScript rules (non-type-checked; avoids requiring a TS project for lint)
  ...tseslint.configs.recommended,

  // Shared language options for the project
  {
    files: ["**/*.{js,jsx,ts,tsx,mjs,cjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },

  // React / JSX rules (no eslint-plugin-react dependency required)
  {
    files: ["**/*.{jsx,tsx}"],
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "jsx-a11y": jsxA11y,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,

      // Keep fast-refresh safe in dev; only warns so pre-commit doesn't block.
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],

      // A11y plugin is installed; start with a small, low-noise subset.
      // (Full recommended set can be enabled later once the codebase is clean.)
      "jsx-a11y/alt-text": "warn",
      "jsx-a11y/anchor-is-valid": "warn",
      "jsx-a11y/no-static-element-interactions": "off",
      "jsx-a11y/click-events-have-key-events": "off",
    },
  },

  // Reduce false-positives / noise across a large codebase.
  {
    rules: {
      "no-undef": "off",
      "no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
);
