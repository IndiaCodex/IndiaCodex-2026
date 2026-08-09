import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@compass/plugin-sdk',
    include: ['test/**/*.test.ts'],
  },
});
