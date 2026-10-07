import { execSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { Client } from 'pg';
import { createPrismaClient } from './lib/prisma-client';
import { seedProducts } from './prisma/seed-products';
import { testDatabaseEnv } from './test/database-env';

const hasPendingMigrations = async (connectionString: string) => {
  const migrations = readdirSync('prisma/migrations', { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  const client = new Client({ connectionString });
  await client.connect();
  try {
    const { rows } = await client.query<{ migration_name: string }>(
      'select migration_name from _prisma_migrations where finished_at is not null and rolled_back_at is null'
    );
    const applied = new Set(rows.map((row) => row.migration_name));
    return migrations.some((name) => !applied.has(name));
  } catch {
    return true; // No _prisma_migrations table yet: a fresh database
  } finally {
    await client.end();
  }
};

// Brings the test database up to date once per run. The Prisma CLI takes ~1.5s to start, so
// migrations only run when one is missing; the seed runs in-process every time, so test data
// always matches lib/data.json. Without a database URL, integration tests skip themselves.
export default async function setup() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.warn('DATABASE_URL not set: database integration tests will be skipped.');
    return;
  }

  if (await hasPendingMigrations(url)) {
    execSync('npx prisma migrate deploy', { stdio: 'ignore', env: testDatabaseEnv() });
  }

  const db = createPrismaClient();
  try {
    await seedProducts(db);
  } finally {
    await db.$disconnect();
  }
}
