import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@compass/storage-sqlite',
    include: ['test/**/*.test.ts'],
  },
});
