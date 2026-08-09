import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@compass/application',
    include: ['test/**/*.test.ts'],
  },
});
