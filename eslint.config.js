import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'node_modules', '.yarn', '.docs-check'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      'no-console': 'error',
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['antd/es/*', 'antd/lib/*'],
              message: "Import antd types from 'antd' only (antd has no exports map).",
            },
            {
              group: ['lodash', 'lodash/*'],
              message: 'instaui has no runtime dependencies; add a small local helper.',
            },
            {
              group: ['@ant-design/v5-patch-for-react-19'],
              message: 'Apps install this patch themselves; the library must never import it.',
            },
            {
              group: ['react-router', 'react-router/*'],
              message:
                "Never import 'react-router': apps may hoist a different major. Routing goes through injected hooks.",
            },
          ],
        },
      ],
    },
  },
  {
    // The core is pure TypeScript: no React, antd or TanStack, so it stays testable and portable.
    files: ['src/core/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'react',
                'react-dom',
                'react/*',
                'antd',
                'antd/*',
                '@ant-design/*',
                '@tanstack/*',
              ],
              message:
                'src/core must stay framework-free; put React/antd code in src/react or src/antd.',
            },
            {
              group: ['../react/*', '../antd/*', '../components/*'],
              message: 'src/core must not depend on the React or antd layers.',
            },
          ],
        },
      ],
    },
  },
  {
    // The one sanctioned console access.
    files: ['src/core/warn.ts'],
    rules: { 'no-console': 'off' },
  },
  {
    files: ['scripts/**', '*.config.{js,ts}'],
    languageOptions: { globals: globals.node },
    rules: { 'no-console': 'off' },
  },
);
