-- Name shown on "You may also like" cards. Added as nullable, backfilled from "name", then made
-- required, so the migration also works on a table that already has rows. The seed sets the
-- design's shortened names (e.g. "XX99 Mark I").
ALTER TABLE "Product" ADD COLUMN "cardName" TEXT;
UPDATE "Product" SET "cardName" = "name";
ALTER TABLE "Product" ALTER COLUMN "cardName" SET NOT NULL;
