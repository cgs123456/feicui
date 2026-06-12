import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import tseslint from 'typescript-eslint'
import globals from 'globals'

export default [
  // 全局忽略
  {
    ignores: ['dist/**', 'node_modules/**']
  },
  // 全局基础配置
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin
    }
  },
  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  // TypeScript 规则 (仅 .vue <script lang="ts">)
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser
      }
    },
    rules: {
      'no-undef': 'off'
    }
  },
  // TypeScript 文件规则
  ...tseslint.configs.recommended.map(config => ({
    ...config,
    files: ['**/*.ts', '**/*.d.ts']
  })),
  // 自定义规则
  {
    rules: {
      'vue/multi-word-component-names': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'vue/no-unused-vars': 'warn',
      'no-console': 'off',
      'no-debugger': 'warn'
    }
  }
]