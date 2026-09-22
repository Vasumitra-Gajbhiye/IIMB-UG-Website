-- Backfill: the review flow is gone; anything mid-review goes back to draft
UPDATE "Blog" SET "status" = 'DRAFT' WHERE "status" IN ('IN_REVIEW', 'CHANGES_REQUESTED');

-- CreateEnum
CREATE TYPE "ReactionType" AS ENUM ('LIKE', 'DISLIKE');

-- AlterEnum
BEGIN;
CREATE TYPE "PostStatus_new" AS ENUM ('DRAFT', 'PUBLISHED');
ALTER TABLE "Blog" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Blog" ALTER COLUMN "status" TYPE "PostStatus_new" USING ("status"::text::"PostStatus_new");
ALTER TYPE "PostStatus" RENAME TO "PostStatus_old";
ALTER TYPE "PostStatus_new" RENAME TO "PostStatus";
DROP TYPE "PostStatus_old";
ALTER TABLE "Blog" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- DropForeignKey
ALTER TABLE "Blog" DROP CONSTRAINT "Blog_reviewedById_fkey";

-- DropIndex
DROP INDEX "Blog_status_publishedAt_idx";

-- AlterTable
ALTER TABLE "Blog" DROP COLUMN "reviewNote",
DROP COLUMN "reviewedAt",
DROP COLUMN "reviewedById",
DROP COLUMN "submittedAt",
ADD COLUMN     "starredAt" TIMESTAMP(3),
ALTER COLUMN "title" SET DEFAULT 'Untitled';

-- CreateTable
CREATE TABLE "BlogReaction" (
    "id" TEXT NOT NULL,
    "blogId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ReactionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogReaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogComment" (
    "id" TEXT NOT NULL,
    "blogId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlogComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BlogReaction_blogId_type_idx" ON "BlogReaction"("blogId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "BlogReaction_blogId_userId_key" ON "BlogReaction"("blogId", "userId");

-- CreateIndex
CREATE INDEX "BlogComment_blogId_createdAt_idx" ON "BlogComment"("blogId", "createdAt");

-- CreateIndex
CREATE INDEX "Blog_status_publishedAt_id_idx" ON "Blog"("status", "publishedAt", "id");

-- CreateIndex
CREATE INDEX "Blog_starredAt_idx" ON "Blog"("starredAt");

-- AddForeignKey
ALTER TABLE "BlogReaction" ADD CONSTRAINT "BlogReaction_blogId_fkey" FOREIGN KEY ("blogId") REFERENCES "Blog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogReaction" ADD CONSTRAINT "BlogReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogComment" ADD CONSTRAINT "BlogComment_blogId_fkey" FOREIGN KEY ("blogId") REFERENCES "Blog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogComment" ADD CONSTRAINT "BlogComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

