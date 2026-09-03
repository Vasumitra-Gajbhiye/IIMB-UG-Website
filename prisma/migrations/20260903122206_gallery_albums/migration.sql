-- AlterTable
ALTER TABLE "GalleryItem" ADD COLUMN     "albumId" TEXT,
ALTER COLUMN "postId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "GalleryAlbum" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GalleryAlbum_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GalleryAlbumDateSpan" (
    "id" TEXT NOT NULL,
    "albumId" TEXT NOT NULL,
    "startOn" TIMESTAMP(3) NOT NULL,
    "endOn" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GalleryAlbumDateSpan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GalleryAlbum_authorId_createdAt_idx" ON "GalleryAlbum"("authorId", "createdAt");

-- CreateIndex
CREATE INDEX "GalleryAlbumDateSpan_albumId_idx" ON "GalleryAlbumDateSpan"("albumId");

-- CreateIndex
CREATE INDEX "GalleryAlbumDateSpan_startOn_endOn_idx" ON "GalleryAlbumDateSpan"("startOn", "endOn");

-- CreateIndex
CREATE INDEX "GalleryItem_albumId_sortOrder_idx" ON "GalleryItem"("albumId", "sortOrder");

-- AddForeignKey
ALTER TABLE "GalleryItem" ADD CONSTRAINT "GalleryItem_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "GalleryAlbum"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GalleryAlbum" ADD CONSTRAINT "GalleryAlbum_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GalleryAlbumDateSpan" ADD CONSTRAINT "GalleryAlbumDateSpan_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "GalleryAlbum"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Each gallery item belongs to exactly one post or album.
ALTER TABLE "GalleryItem" ADD CONSTRAINT "GalleryItem_post_or_album_chk" CHECK (
  ("postId" IS NOT NULL AND "albumId" IS NULL)
  OR ("postId" IS NULL AND "albumId" IS NOT NULL)
);

ALTER TABLE "GalleryAlbumDateSpan" ADD CONSTRAINT "GalleryAlbumDateSpan_range_chk" CHECK ("endOn" >= "startOn");
