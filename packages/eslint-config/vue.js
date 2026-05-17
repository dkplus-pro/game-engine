import eslintConfigPrettier from 'eslint-config-prettier';
import pluginVue from 'eslint-plugin-vue';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import vueParser from 'vue-eslint-parser';
import core from './core.js';

export default [
  ...core,
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: ['.vue'],
      },
      globals: {
        ...globals.es2021,
        console: 'readonly',
        uni: 'readonly',
        UniApp: 'readonly',
        WechatMiniprogram: 'readonly',
      },
    },
    rules: {
      /** uni-app 页面常为路由名单词（如 pages/index/index.vue） */
      'vue/multi-word-component-names': 'off',
    },
  },
  eslintConfigPrettier,
];
