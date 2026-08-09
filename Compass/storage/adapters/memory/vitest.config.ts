import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@compass/storage-memory',
    include: ['test/**/*.test.ts'],
  },
});
