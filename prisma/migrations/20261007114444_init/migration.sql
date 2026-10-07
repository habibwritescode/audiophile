-- CreateEnum
CREATE TYPE "Category" AS ENUM ('headphones', 'speakers', 'earphones');

-- CreateTable
CREATE TABLE "Product" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "category" "Category" NOT NULL,
    "isNew" BOOLEAN NOT NULL DEFAULT false,
    "priceCents" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "features" TEXT NOT NULL,
    "stock" INTEGER NOT NULL,
    "image" JSONB NOT NULL,
    "categoryImage" JSONB NOT NULL,
    "thumbnail" JSONB NOT NULL,
    "cartImage" TEXT NOT NULL,
    "gallery" JSONB NOT NULL,
    "includes" JSONB NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RelatedProduct" (
    "productId" INTEGER NOT NULL,
    "relatedId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "RelatedProduct_pkey" PRIMARY KEY ("productId","relatedId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_category_idx" ON "Product"("category");

-- AddForeignKey
ALTER TABLE "RelatedProduct" ADD CONSTRAINT "RelatedProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelatedProduct" ADD CONSTRAINT "RelatedProduct_relatedId_fkey" FOREIGN KEY ("relatedId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Stock can never go negative, even if application code has a bug or two orders race.
-- Prisma has no schema syntax for CHECK constraints, so it lives here.
ALTER TABLE "Product" ADD CONSTRAINT "Product_stock_non_negative" CHECK ("stock" >= 0);
