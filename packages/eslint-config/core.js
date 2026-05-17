import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/** 不含 Prettier：供 `vue.js` 在 Vue 规则之后统一接上 `eslint-config-prettier` */
export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ['dist/**', 'unpackage/**', 'node_modules/**'],
  },
  {
    files: ['**/*.{js,ts}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.es2021,
        console: 'readonly',
        uni: 'readonly',
        UniApp: 'readonly',
        WechatMiniprogram: 'readonly',
      },
    },
  },
];
