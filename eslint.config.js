const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier/flat');

module.exports = defineConfig([
  expoConfig,
  // core は Node の Vitest で検証する純粋なロジック、ui は React を使う共有表示、app は画面構成を置く。
  {
    files: ['src/core/**/*.{js,jsx,ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'react',
                'react-*',
                'react-native/*',
                'expo',
                'expo-*',
                'expo/*',
                '@expo/*',
                '@/ui/*',
                '@/app/*',
              ],
              message:
                'core は Node で検証するため React・React Native・Expo・上位層へ依存できません。UI が必要な処理は ui 層へ移してください。',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/ui/**/*.{js,jsx,ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/app/*'],
              message: 'ui 層は画面構成を持つ app 層へ依存できません。',
            },
          ],
        },
      ],
    },
  },
  prettierConfig,
]);
