import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@compass/cli',
    include: ['test/**/*.test.ts'],
  },
});
