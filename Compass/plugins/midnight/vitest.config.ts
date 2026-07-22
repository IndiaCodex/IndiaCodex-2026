import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@compass/plugin-midnight',
    include: ['test/**/*.test.ts'],
  },
});
