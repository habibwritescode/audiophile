import { existsSync, readFileSync } from 'node:fs';
import { config, parse } from 'dotenv';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Integration tests use the audiophile_test database. An existing DATABASE_URL (as in CI) wins.
config({ path: '.env.test', quiet: true });

// Paystack integration tests need the test secret key. Take only that from .env (never its
// DATABASE_URL); CI sets it from a GitHub secret instead.
if (!process.env.PAYSTACK_SECRET_KEY && existsSync('.env')) {
  const key = parse(readFileSync('.env')).PAYSTACK_SECRET_KEY;
  if (key) process.env.PAYSTACK_SECRET_KEY = key;
}

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
