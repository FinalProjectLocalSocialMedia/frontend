import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      '.system_generated/**',
      'vite.config.ts',
      'vitest.config.ts',
    ],
  },
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-hooks/incompatible-library': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  // Quy tắc phụ thuộc 5.2 (đã cập nhật):
  // App người dùng KHÔNG ĐƯỢC import từ src/features/admin, src/features/moderation, hoặc src/features/admin-moderation.
  // App người dùng vẫn có thể import từ src/features cho các feature khác.
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: [
      'src/features/admin/**',
      'src/features/moderation/**',
      'src/features/admin-moderation/**',
      'src/routes/admin-routes.tsx',
      'src/routes/admin-routes/**',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@/features/admin',
                '@/features/admin/**',
                '**/features/admin',
                '**/features/admin/**',
              ],
              message:
                'App người dùng không được import từ src/features/admin (Quy tắc phụ thuộc 5.2).',
            },
            {
              group: [
                '@/features/moderation',
                '@/features/moderation/**',
                '**/features/moderation',
                '**/features/moderation/**',
              ],
              message:
                'App người dùng không được import từ src/features/moderation (Quy tắc phụ thuộc 5.2).',
            },
            {
              group: [
                '@/features/admin-moderation',
                '@/features/admin-moderation/**',
                '**/features/admin-moderation',
                '**/features/admin-moderation/**',
              ],
              message:
                'App người dùng không được import từ src/features/admin-moderation (Quy tắc phụ thuộc 5.2).',
            },
          ],
        },
      ],
    },
  },
  // Quy tắc phụ thuộc 5.2: admin-moderation KHÔNG import từ moderation hay admin
  {
    files: ['src/features/admin-moderation/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@/features/moderation',
                '@/features/moderation/**',
                '**/features/moderation/**',
                '../moderation/**',
                '../../features/moderation/**',
              ],
              message:
                'admin-moderation không được import từ moderation (Quy tắc phụ thuộc 5.2).',
            },
            {
              group: [
                '@/features/admin',
                '@/features/admin/**',
                '**/features/admin/**',
                '../admin/**',
                '../../features/admin/**',
              ],
              message:
                'admin-moderation không được import từ admin (Quy tắc phụ thuộc 5.2).',
            },
          ],
        },
      ],
    },
  },
  // Quy tắc phụ thuộc 5.2: moderation KHÔNG import từ admin
  {
    files: ['src/features/moderation/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@/features/admin',
                '@/features/admin/**',
                '**/features/admin/**',
                '../admin/**',
                '../../features/admin/**',
              ],
              message:
                'moderation không được import từ admin (Quy tắc phụ thuộc 5.2).',
            },
          ],
        },
      ],
    },
  },
  // Quy tắc phụ thuộc 5.2: các feature admin/moderation chỉ dùng components/ui, theme-provider, lib/utils, lib/http-client, components/map
  {
    files: [
      'src/features/admin/**/*.{ts,tsx}',
      'src/features/moderation/**/*.{ts,tsx}',
      'src/features/admin-moderation/**/*.{ts,tsx}',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@/pages/**',
                '@/components/chat/**',
                '@/components/chat-page',
                '@/components/profile-page',
                '@/components/layout/**',
                '@/components/explore/**',
              ],
              message:
                'Feature admin/moderation không được import các component thuộc app người dùng (chỉ dùng components/ui, components/theme-provider, components/map, lib/utils, lib/http-client).',
            },
          ],
        },
      ],
    },
  },
)
