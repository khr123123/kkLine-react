export default tseslint.config(
  { ignores: ['**/node_modules', '**/dist', '**/out'] },

  // 推荐规则（先加载）
  tseslint.configs.recommended,
  eslintPluginReact.configs.flat.recommended,
  eslintPluginReact.configs.flat['jsx-runtime'],

  {
    // ✅ 设置 React 版本
    settings: {
      react: {
        version: 'detect'
      }
    }
  },

  // ✅ 全局生效的规则覆盖（不要加 files）
  {
    plugins: {
      'react-hooks': eslintPluginReactHooks,
      'react-refresh': eslintPluginReactRefresh
    },
    rules: {
      ...eslintPluginReactHooks.configs.recommended.rules,
      ...eslintPluginReactRefresh.configs.vite.rules,

      // ✅ 手动覆盖，确保生效
      'react-refresh/only-export-components': 'off',
      'react-hooks/rules-of-hooks': 'off',
      'react-hooks/exhaustive-deps': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      'no-console': 'off',
      'no-debugger': 'off',
    }
  },

  // Prettier 放最后
  eslintConfigPrettier
);
