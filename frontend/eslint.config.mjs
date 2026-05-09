import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Глобальные игноры
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'dist/**',
      'coverage/**',
      'public/**',
    ],
  },
  
  // Основная конфигурация Next.js
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  
  // Правила для production кода
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['**/*.spec.*', '**/*.test.*', '**/__tests__/**'],
    rules: {
      // Строгие правила для основного кода
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
  
  // Мягкие правила для тестов
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