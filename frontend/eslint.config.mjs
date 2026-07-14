import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Paths ESLint should never check (build output, vendored assets)
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'dist/**',
      'coverage/**',
      'public/**',
    ],
  },

  // Next.js recommended rules including React hooks and accessibility
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // Strict rules for production source code only (excludes test files)
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['**/*.spec.*', '**/*.test.*', '**/__tests__/**'],
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'react/jsx-sort-props': ['warn', {
        callbacksLast: true,
        shorthandFirst: true,
      }],
    },
  },

  // Relaxed rules for test files where mocks and any types are unavoidable
  {
    files: ['**/*.spec.*', '**/*.test.*', '**/__tests__/**'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/unbound-method': 'off',
      'no-console': 'off',
    },
  },
];

export default eslintConfig;
