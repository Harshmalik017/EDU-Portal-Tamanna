import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: [".next/**", ".vercel/**", "node_modules/**", ".github/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { files: ["**/*.js"], languageOptions: { sourceType: "commonjs" }, rules: { "@typescript-eslint/no-require-imports": "off" } },
);
