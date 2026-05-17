import { defineConfig } from 'vitest/config';

export const config = defineConfig({
  test: {
    coverage: {
      exclude: [
        'src/**/*.test.ts'
      ],
      include: ['src/**/*.ts'],
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: './coverage'
    },
    exclude: ['node_modules', 'dist'],
    globals: false,
    include: ['src/**/*.test.ts'],
    projects: [
      {
        server: {
          deps: {
            inline: ['@obsidian-typings', 'obsidian-dev-utils']
          }
        },
        test: {
          environment: 'node',
          include: ['src/**/*.test.ts'],
          name: 'unit-tests'
        }
      }
    ]
  }
});
