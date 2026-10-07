import 'dotenv/config';
import { createPrismaClient } from '../lib/prisma-client';
import { seedProducts } from './seed-products';

// Not lib/db.ts: that one is guarded with server-only, which throws outside Next
const db = createPrismaClient();

seedProducts(db)
  .then((count) => console.log(`Seeded ${count} products`))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
