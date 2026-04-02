import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import importPlugin from 'eslint-plugin-import';
import sonarjsPlugin from 'eslint-plugin-sonarjs';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import vitestPlugin from 'eslint-plugin-vitest';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['node_modules', 'dist', 'build', 'public'] },
  {
    files: ['src/**/*.{js,ts,tsx}'],
    extends: [
      ...tseslint.configs.recommended,
      reactPlugin.configs.flat.recommended,
      reactHooksPlugin.configs.flat.recommended,
      importPlugin.flatConfigs.recommended,
      importPlugin.flatConfigs.typescript,
      sonarjsPlugin.configs.recommended,
    ],
    plugins: {
      'jsx-a11y': jsxA11yPlugin,
      prettier: prettierPlugin,
      vitest: vitestPlugin,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        vi: 'readonly',
      },
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    settings: {
      react: { version: 'detect' },
      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
          paths: ['src'],
        },
      },
    },
    rules: {
      // jsx-a11y recommended (plugin has no flat config export yet)
      ...jsxA11yPlugin.configs.recommended.rules,
      // vitest recommended
      ...vitestPlugin.configs.recommended.rules,
      // prettier as lint rule
      'prettier/prettier': 'error',

      // disabled
      'react/prop-types': 'off',
      'react/destructuring-assignment': 'off',
      'react/static-property-placement': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/jsx-props-no-spreading': 'off',
      'jsx-a11y/alt-text': 'off',
      'no-unused-vars': 'off',

      // custom
      'no-magic-numbers': [
        'error',
        { ignoreArrayIndexes: true, ignore: [1000, -1, 0, 1, 2, 3, 4, 5, 404] },
      ],
      'arrow-body-style': ['error', 'as-needed'],
      'line-comment-position': ['error', { position: 'above' }],
      'no-restricted-imports': ['error', { patterns: [' * as'] }],
      'arrow-parens': ['error', 'as-needed'],
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      'sonarjs/prefer-immediate-return': 'error',
      'sonarjs/no-duplicate-string': 'error',
      'import/no-namespace': 'error',
      'no-underscore-dangle': ['error', { allow: ['__typename', '_env_'] }],
      'vitest/expect-expect': 'off',
      'vitest/valid-expect': 'off',
      'vitest/no-standalone-expect': 'off',
      'vitest/no-mocks-import': 'off',
      'vitest/no-conditional-expect': 'off',
      'vitest/valid-title': 'off',
      'import/no-named-as-default': 'off',

      // react-hooks v7 React Compiler rules — too strict for existing code
      'react-hooks/refs': 'off',
      'react-hooks/globals': 'off',
      'react-hooks/static-components': 'off',
      'react-hooks/set-state-in-effect': 'off',

      // sonarjs v4 new rules — disabled until codebase is ready
      'sonarjs/function-return-type': 'off',
      'sonarjs/no-empty-test-file': 'off',
      'sonarjs/concise-regex': 'off',
      'sonarjs/null-dereference': 'off',
      'sonarjs/deprecation': 'off',
      'sonarjs/redundant-type-aliases': 'off',
      'sonarjs/no-undefined-argument': 'off',
      'sonarjs/no-ignored-exceptions': 'off',
      'sonarjs/no-incomplete-assertions': 'off',

      // allow ternary as statement (e.g. condition ? fn() : fn())
      '@typescript-eslint/no-unused-expressions': ['error', { allowTernary: true }],
    },
  },
  // must be last — disables rules that conflict with prettier formatting
  prettierConfig,
);
