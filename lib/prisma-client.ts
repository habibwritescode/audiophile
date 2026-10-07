import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client';

// Plain factory, usable from scripts like the seed. App code uses lib/db.ts instead.
export const createPrismaClient = () =>
  new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
