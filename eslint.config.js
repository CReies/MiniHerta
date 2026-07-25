import js from "@eslint/js";
import astro from "eslint-plugin-astro";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: [".astro/**", ".test-dist/**", "dist/**", "node_modules/**", "banner-data/cleaned/**", "pnpm-lock.yaml"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs["flat/recommended"],
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        Blob: "readonly",
        Buffer: "readonly",
        FileReader: "readonly",
        HTMLButtonElement: "readonly",
        HTMLElement: "readonly",
        HTMLInputElement: "readonly",
        HTMLSelectElement: "readonly",
        HTMLTemplateElement: "readonly",
        Option: "readonly",
        URL: "readonly",
        console: "readonly",
        document: "readonly",
        fetch: "readonly",
        clearTimeout: "readonly",
        localStorage: "readonly",
        navigator: "readonly",
        process: "readonly",
        setTimeout: "readonly",
        window: "readonly",
      },
    },
    rules: {
      "@typescript-eslint/no-empty-object-type": "off",
    },
  },
  {
    files: ["src/app/**/*.ts", "src/domain/**/*.ts", "src/shared/**/*.ts"],
    rules: {
      "no-restricted-globals": [
        "error",
        { name: "document", message: "Browser DOM belongs in the UI or infrastructure layer." },
        { name: "fetch", message: "Network access belongs in the infrastructure layer." },
        { name: "localStorage", message: "Browser storage belongs in the infrastructure layer." },
        { name: "navigator", message: "Browser APIs belong in the UI or infrastructure layer." },
        { name: "window", message: "Browser DOM belongs in the UI or infrastructure layer." },
      ],
    },
  },
];
