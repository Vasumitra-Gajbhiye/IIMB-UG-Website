-- Free the "FaqCategory" name (types and tables share a namespace in Postgres)
ALTER TYPE "FaqCategory" RENAME TO "FaqCategory_old";

-- DropIndex
DROP INDEX "Faq_category_sortOrder_idx";

-- CreateTable
CREATE TABLE "FaqCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FaqCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FaqCategory_name_key" ON "FaqCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "FaqCategory_slug_key" ON "FaqCategory"("slug");

-- Seed categories: General (default) plus the three former enum values
INSERT INTO "FaqCategory" ("id", "name", "slug", "isDefault") VALUES
  (gen_random_uuid()::text, 'General', 'general', true),
  (gen_random_uuid()::text, 'Admissions', 'admissions', false),
  (gen_random_uuid()::text, 'Academics', 'academics', false),
  (gen_random_uuid()::text, 'Campus Life', 'campus-life', false);

-- AlterTable: add new columns (categoryId nullable until backfilled)
ALTER TABLE "Faq" ADD COLUMN "authorId" TEXT,
ADD COLUMN "categoryId" TEXT;

-- Backfill categoryId from the old enum column
UPDATE "Faq" f SET "categoryId" = c."id"
FROM "FaqCategory" c
WHERE c."slug" = CASE f."category"::text
  WHEN 'ADMISSIONS' THEN 'admissions'
  WHEN 'ACADEMICS' THEN 'academics'
  WHEN 'CAMPUS_LIFE' THEN 'campus-life'
  ELSE 'general'
END;

ALTER TABLE "Faq" ALTER COLUMN "categoryId" SET NOT NULL;
ALTER TABLE "Faq" DROP COLUMN "category";

-- DropEnum
DROP TYPE "FaqCategory_old";

-- CreateIndex
CREATE INDEX "Faq_categoryId_sortOrder_idx" ON "Faq"("categoryId", "sortOrder");

-- AddForeignKey
ALTER TABLE "FaqCategory" ADD CONSTRAINT "FaqCategory_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Faq" ADD CONSTRAINT "Faq_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "FaqCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Faq" ADD CONSTRAINT "Faq_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
