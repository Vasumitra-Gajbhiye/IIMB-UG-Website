import type { Metadata } from "next";
import { Suspense } from "react";

import { GalleryAddButton } from "@/components/gallery/gallery-add-button";
import { GalleryFeed } from "@/components/gallery/gallery-feed";
import { Skeleton } from "@/components/ui/skeleton";
import { ensureUser } from "@/lib/auth";
import {
  listedAuthor,
  pickAlbumCover,
} from "@/lib/gallery";
import {
  listPublicGalleryAlbums,
  listPublicGalleryItems,
} from "@/lib/queries/gallery";

export const metadata: Metadata = {
  title: "Gallery",
};

export default async function GalleryPage() {
  const [session, rows, albumRows] = await Promise.all([
    ensureUser(),
    listPublicGalleryItems(),
    listPublicGalleryAlbums(),
  ]);

  const items = rows.map((row) => {
    const author = listedAuthor(
      (row.post?.author ?? row.album?.author)?.student,
    );
    return {
      id: row.id,
      kind: row.kind,
      url: row.url,
      caption: row.caption,
      takenAt: row.takenAt,
      width: row.width,
      height: row.height,
      albumId: row.albumId,
      ...author,
    };
  });

  const albums = albumRows.map((album) => {
    const cover = pickAlbumCover(album.items);
    return {
      id: album.id,
      name: album.name,
      dateSpans: album.dateSpans.map((span) => ({
        startOn: span.startOn,
        endOn: span.endOn,
      })),
      cover: cover
        ? {
            kind: cover.kind,
            url: cover.url,
            caption: cover.caption,
            width: cover.width,
            height: cover.height,
          }
        : null,
    };
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight">
            Gallery
          </h1>
          <p className="mt-2 text-muted-foreground">
            Photos and videos from the batch, grouped by the day they were
            taken.
          </p>
        </div>
        {session?.isAllowlisted ? <GalleryAddButton /> : null}
      </div>

      <Suspense fallback={<GalleryFeedFallback />}>
        <GalleryFeed
          items={items}
          albums={albums}
          isAllowlisted={Boolean(session?.isAllowlisted)}
        />
      </Suspense>
    </div>
  );
}

function GalleryFeedFallback() {
  return (
    <div className="mt-6 space-y-8">
      <div className="flex gap-2">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-7 w-24" />
      </div>
      <Skeleton className="h-6 w-48" />
    </div>
  );
}
