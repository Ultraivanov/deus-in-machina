import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    pool: 'forks',
  },
  esbuild: {
    target: 'es2022',
  },
});
