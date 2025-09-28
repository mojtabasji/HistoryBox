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
    ignores: [
      // Dependencies
      "node_modules/**",
      ".pnp",
      ".pnp.*",
      // Production builds
      ".next/**",
      "out/**",
      "build/**",
      "dist/**",
      // Generated files
      "src/generated/**",
      "**/generated/**",
      "prisma/migrations/**",
      // Scripts
      "scripts/**",
      // Configs and env
      "next-env.d.ts",
      ".vercel/**",
      // Misc
      "coverage/**",
      "*.log",
      "pids",
      "*.pid",
      "*.seed",
      "*.pid.lock",
      // Env files
      ".env*",
    ],
  },
];

export default eslintConfig;
