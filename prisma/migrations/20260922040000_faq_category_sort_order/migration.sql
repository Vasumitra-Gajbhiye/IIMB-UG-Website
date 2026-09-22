-- AlterTable
ALTER TABLE "FaqCategory" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- Backfill: preserve current display order (General first, then A-Z)
WITH ranked AS (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "isDefault" DESC, "name" ASC) - 1 AS rn
  FROM "FaqCategory"
)
UPDATE "FaqCategory" c
SET "sortOrder" = ranked.rn
FROM ranked
WHERE ranked."id" = c."id";

-- CreateIndex
CREATE INDEX "FaqCategory_sortOrder_idx" ON "FaqCategory"("sortOrder");
