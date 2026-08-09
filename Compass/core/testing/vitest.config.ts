import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@compass/testing',
    include: ['test/**/*.test.ts'],
  },
});
