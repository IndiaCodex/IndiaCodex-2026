import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@compass/domain',
    include: ['test/**/*.test.ts'],
  },
});
