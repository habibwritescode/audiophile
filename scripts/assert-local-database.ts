import 'dotenv/config';

// Guards destructive commands (db:reset). Checks the same URL Prisma uses (see prisma.config.ts).
const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
const host = url ? new URL(url).hostname : undefined;

if (!host || !['localhost', '127.0.0.1', '::1'].includes(host)) {
  console.error(`Refusing to continue: database host is "${host ?? 'not set'}", not this machine.`);
  process.exit(1);
}
