import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    root: '.',
    // Parallel test files race mongodb-memory-server's binary download/rename in CI.
    fileParallelism: false,
  },
});
