import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import stylistic from '@stylistic/eslint-plugin'
import { defineConfig, globalIgnores } from 'eslint/config'

const sharedRules = {
  semi: ['error', 'never'],
  quotes: ['error', 'single', { avoidEscape: true }],
  '@typescript-eslint/no-extra-semi': 'off',
  '@stylistic/member-delimiter-style': ['error', {
    multiline: { delimiter: 'none' },
    singleline: { delimiter: 'semi', requireLast: false },
  }],
}

export default defineConfig([
  globalIgnores(['dist', 'dist-firefox']),
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { '@stylistic': stylistic },
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: sharedRules,
  },
  {
    // Test files: React-specific rules don't apply here
    files: ['tests/**/*.{ts,tsx}'],
    plugins: { '@stylistic': stylistic },
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: { ...globals.browser, ...globals.node },
    },
    rules: sharedRules,
  },
])
