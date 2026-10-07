// Prisma commands prefer DATABASE_URL_UNPOOLED (see prisma.config.ts) and load .env, which could
// point at a real database. Pin both to the test database so tests never migrate or seed anything else.
export const testDatabaseEnv = () => ({
  ...process.env,
  DATABASE_URL_UNPOOLED: process.env.DATABASE_URL,
});
