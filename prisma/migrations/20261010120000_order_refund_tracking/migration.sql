-- "chargedKobo" held the expected charge on pending orders too; the new name says what it is.
-- A real rename (Prisma would drop and re-add the column, losing data).
ALTER TABLE "Order" RENAME COLUMN "chargedKobo" TO "amountKobo";

-- Set once Paystack accepts a refund request; null on a REFUND_PENDING order means "ask again"
ALTER TABLE "Order" ADD COLUMN "refundRequestedAt" TIMESTAMP(3);
