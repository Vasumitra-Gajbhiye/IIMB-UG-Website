import type { Metadata } from "next";
import Link from "next/link";

import { GalleryMasonry } from "@/components/gallery/gallery-masonry";
import { Button } from "@/components/ui/button";
import { ensureUser } from "@/lib/auth";
import { listPublicGalleryItems } from "@/lib/queries/gallery";

export const metadata: Metadata = {
  title: "Gallery",
};

export default async function GalleryPage() {
  const [session, rows] = await Promise.all([
    ensureUser(),
    listPublicGalleryItems(),
  ]);

  const items = rows.map((row) => {
    const student = row.post.author.student;
    const listed = student?.isListed ? student : null;
    return {
      id: row.id,
      kind: row.kind,
      url: row.url,
      caption: row.caption,
      takenAt: row.takenAt,
      width: row.width,
      height: row.height,
      authorName: listed?.name ?? null,
      authorSlug: listed?.slug ?? null,
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
        {session?.isAllowlisted ? (
          <Button asChild>
            <Link href="/admin/gallery">Add photos</Link>
          </Button>
        ) : null}
      </div>

      {items.length === 0 ? (
        <p className="mt-12 text-muted-foreground">
          Nothing here yet.
          {session?.isAllowlisted
            ? " Add the first photos from Studio."
            : " Check back after the batch starts posting."}
        </p>
      ) : (
        <div className="mt-10">
          <GalleryMasonry items={items} />
        </div>
      )}
    </div>
  );
}
