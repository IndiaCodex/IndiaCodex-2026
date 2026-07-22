import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Deliberately explicit, non-overlapping globs: 'storage/*' would also match the
    // `storage/adapters` directory itself (a plain folder, no package.json of its own),
    // and Vitest would pick that up as a second, redundantly-named "adapters" project
    // on top of 'storage/adapters/*' — double-counting every adapter test.
    projects: ['core/*', 'plugins/*', 'storage/storage-sdk', 'storage/adapters/*', 'interfaces/*'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: [
        'core/*/src/**',
        'plugins/*/src/**',
        'storage/storage-sdk/src/**',
        'storage/adapters/*/src/**',
        'interfaces/*/src/**',
      ],
      exclude: ['**/*.test.ts', '**/index.ts'],
    },
  },
});
