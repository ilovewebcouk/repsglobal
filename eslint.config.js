import js from "@eslint/js";
import eslintPluginPrettier from "eslint-plugin-prettier/recommended";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", ".output", ".vinxi"] },
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
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "server-only",
              message:
                "TanStack Start does not use the Next.js `server-only` package. Rename the module to `*.server.ts` or mark it with `@tanstack/react-start/server-only`.",
            },
          ],
        },
      ],
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  {
    files: [
      "src/routes/_authenticated/**/*.{ts,tsx}",
      "src/components/dashboard/**/*.{ts,tsx}",
    ],
    ignores: ["src/components/dashboard/ui/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/components/ui/button",
                "@/components/ui/dialog",
                "@/components/ui/alert-dialog",
                "@/components/ui/input",
                "@/components/ui/textarea",
                "@/components/ui/select",
                "@/components/ui/card",
                "@/components/ui/badge",
                "@/components/ui/empty",
                "@/components/ui/tooltip",
                "@/components/ui/sonner",
              ],
              message:
                "Use the dashboard UI kit (`@/components/dashboard/ui`) — shadcn defaults are light-themed and break dark dashboards.",
            },
          ],
        },
      ],
    },
  },
  eslintPluginPrettier,
);
