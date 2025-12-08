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
      "supabase/functions/**",
      ".github/workflows/**",
      "node_modules/**",
      "*.config.js",
      "*.config.ts"
    ] 
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
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-require-imports": "off",
    },
  },
);
