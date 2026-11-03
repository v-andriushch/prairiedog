import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['{apps,modules,packages}/*/src/**/*.test.ts'],
  },
});
