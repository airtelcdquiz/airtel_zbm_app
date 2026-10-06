import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // `next build` lance ESLint et échoue sur la moindre erreur. Ces deux
    // règles relèvent du nettoyage de style (variables de scaffolding non
    // encore câblées, types `any` à préciser) : elles restent signalées en
    // warning pour être traitées progressivement, sans bloquer le build.
    // Les règles de correctness (next/core-web-vitals, react-hooks) restent
    // des erreurs.
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrors: "none",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];

export default eslintConfig;
