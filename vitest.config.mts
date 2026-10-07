import { config } from 'dotenv';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Integration tests use the audiophile_test database. An existing DATABASE_URL (as in CI) wins.
config({ path: '.env.test', quiet: true });

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
    // server-only throws outside Next's server bundles; tests import server modules directly
    alias: { 'server-only': new URL('./test/empty-module.ts', import.meta.url).pathname },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globalSetup: ['./vitest.global-setup.ts'],
  },
});
