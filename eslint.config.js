import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'node_modules', '.yarn'] },
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
    // Pre-1.0 component, replaced by the new engine in R1 (see UPGRADE_PLAN.md §13).
    // Its known hook-dependency defects are tracked as bugs B05/B18/B26 rather than patched here.
    files: ['src/components/**'],
    rules: {
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  {
    files: ['scripts/**', '*.config.{js,ts}'],
    languageOptions: { globals: globals.node },
    rules: { 'no-console': 'off' },
  },
);
