import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@compass/reporting',
    include: ['test/**/*.test.ts'],
  },
});
