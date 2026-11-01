import electronToolkit from '@electron-toolkit/eslint-config'
import prettier from '@vue/eslint-config-prettier'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'

export default defineConfigWithVueTs(
  { ignores: ['**/node_modules', '**/dist', '**/out', 'resources/monaco-editor'] },
  electronToolkit,
  pluginVue.configs['flat/recommended'],
  vueTsConfigs.recommended,
  prettier,
  {
    files: ['**/*.{js,cjs}'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off'
    }
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',
      'vue/block-lang': 'warn',
      'vue/require-prop-types': 'warn',
      'vue/no-use-v-if-with-v-for': 'warn',
      'vue/require-default-prop': 'off',
      'vue/multi-word-component-names': 'off',
      'vue/no-unused-vars': ['error', { ignorePattern: '^_' }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_'
        }
      ]
    }
  }
)
