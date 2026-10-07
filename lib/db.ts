import 'server-only';
import { createPrismaClient } from './prisma-client';

// Next's dev server re-evaluates modules on every change; reuse one client instead of
// opening a new connection pool each time.
const globalForPrisma = globalThis as unknown as { prisma?: ReturnType<typeof createPrismaClient> };

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
