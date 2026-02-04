import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import jsxA11y from "eslint-plugin-jsx-a11y";

const jsxA11yWarnRules = Object.entries(jsxA11y.configs.recommended.rules ?? {}).reduce(
  (acc, [rule, config]) => {
    if (Array.isArray(config)) {
      acc[rule] = ["warn", ...config.slice(1)];
      return acc;
    }
    if (typeof config === "string") {
      acc[rule] = config === "off" ? "off" : "warn";
      return acc;
    }
    acc[rule] = ["warn", config];
    return acc;
  },
  {},
);

export default tseslint.config(
  {
    ignores: [
      "dist",
      "deleted files/**",
      "external-repos/**",
      "supabase/functions/**",
      ".github/workflows/**",
      "node_modules/**",
      "*.config.js",
      "*.config.ts",
      "android/app/build/**",
      "android/.gradle/**",
      "android/build/**",
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "jsx-a11y": jsxA11y,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11yWarnRules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
      // This codebase is intentionally not in TS strict mode yet (see tsconfig.*),
      // and many integrations (Supabase, Stripe, 3D/ML libs) surface values as `unknown`/untyped.
      // We enforce correctness via typecheck + tests; treat `any` cleanup as a gradual hardening task.
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    files: [
      "src/components/**/*.{ts,tsx}",
      "src/components/ui/**/*.{ts,tsx}",
      "src/contexts/**/*.{ts,tsx}",
      "src/dlc/**/*.{ts,tsx}",
    ],
    rules: {
      // These modules intentionally export helpers, context, and variants alongside components.
      // Fast refresh still works fine in practice; keep lint signal focused on app code.
      "react-refresh/only-export-components": "off",
    },
  },
);
