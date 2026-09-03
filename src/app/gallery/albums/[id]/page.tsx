import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { GalleryAlbumActions } from "@/components/gallery/gallery-album-actions";
import { GalleryMasonry } from "@/components/gallery/gallery-masonry";
import { ensureUser } from "@/lib/auth";
import { formatAlbumSpan, listedAuthor } from "@/lib/gallery";
import { getPublicGalleryAlbum } from "@/lib/queries/gallery";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const album = await getPublicGalleryAlbum(id);
  return {
    title: album?.name ?? "Album",
  };
}

export default async function GalleryAlbumPage({ params }: Props) {
  const { id } = await params;
  const [session, album] = await Promise.all([
    ensureUser(),
    getPublicGalleryAlbum(id),
  ]);

  if (!album) notFound();

  const author = listedAuthor(album.author.student);
  const canManage =
    Boolean(session?.isAllowlisted) &&
    (session?.id === album.authorId || Boolean(session?.isMod));

  const items = album.items.map((row) => ({
    id: row.id,
    kind: row.kind,
    url: row.url,
    caption: row.caption,
    takenAt: row.takenAt,
    width: row.width,
    height: row.height,
    albumId: row.albumId,
    ...author,
  }));

  const dateLabel = album.dateSpans
    .map((span) => formatAlbumSpan(span.startOn, span.endOn))
    .join(" · ");

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <p className="text-sm text-muted-foreground">
        <Link href="/gallery" className="underline-offset-4 hover:underline">
          Gallery
        </Link>
      </p>
      <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight">
        {album.name}
      </h1>
      {dateLabel ? (
        <p className="mt-2 text-muted-foreground">{dateLabel}</p>
      ) : null}
      {author.authorName && author.authorSlug ? (
        <p className="mt-1 text-sm text-muted-foreground">
          <Link
            href={`/directory/${author.authorSlug}`}
            className="text-primary underline-offset-4 hover:underline"
          >
            {author.authorName}
          </Link>
        </p>
      ) : author.authorName ? (
        <p className="mt-1 text-sm text-muted-foreground">{author.authorName}</p>
      ) : null}

      {canManage ? (
        <GalleryAlbumActions
          key={album.name}
          albumId={album.id}
          name={album.name}
          fileCount={album.items.length}
        />
      ) : null}

      {items.length === 0 ? (
        <p className="mt-12 text-muted-foreground">This album is empty.</p>
      ) : (
        <div className="mt-10">
          <GalleryMasonry items={items} mode="photos" />
        </div>
      )}
    </div>
  );
}
