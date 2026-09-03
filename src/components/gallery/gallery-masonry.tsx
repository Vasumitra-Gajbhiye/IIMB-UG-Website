"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  dateInputToTakenAt,
  expandAlbumDayKeys,
  formatGalleryDate,
  formatGalleryDay,
  galleryDayKey,
} from "@/lib/gallery";

export type PublicGalleryItem = {
  id: string;
  kind: "IMAGE" | "VIDEO";
  url: string;
  caption: string | null;
  takenAt: Date | string;
  width: number | null;
  height: number | null;
  authorName: string | null;
  authorSlug: string | null;
  albumId: string | null;
};

export type PublicGalleryAlbum = {
  id: string;
  name: string;
  dateSpans: { startOn: Date | string; endOn: Date | string }[];
  cover: {
    kind: "IMAGE" | "VIDEO";
    url: string;
    caption: string | null;
    width: number | null;
    height: number | null;
  } | null;
};

export type GalleryMasonryMode = "mixed" | "photos" | "albums";

type ItemTile = {
  type: "item";
  id: string;
  dayKey: string;
  item: PublicGalleryItem;
};

type AlbumTile = {
  type: "album";
  id: string;
  dayKey: string;
  album: PublicGalleryAlbum;
};

type GalleryTile = ItemTile | AlbumTile;

export function GalleryMasonry({
  items,
  albums = [],
  mode = "mixed",
}: {
  items: PublicGalleryItem[];
  albums?: PublicGalleryAlbum[];
  mode?: GalleryMasonryMode;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const groups = groupTiles(buildTiles(items, albums, mode));
  const active = items.find((item) => item.id === activeId) ?? null;

  return (
    <>
      <div className="space-y-10">
        {groups.map((group) => (
          <section key={group.key}>
            <h2 className="font-serif text-xl font-semibold tracking-tight">
              {group.label}
            </h2>
            <div className="mt-4 columns-2 gap-3 sm:columns-3 lg:columns-4">
              {group.tiles.map((tile) =>
                tile.type === "album" ? (
                  <Link
                    key={tile.id}
                    href={`/gallery/albums/${tile.album.id}`}
                    className="mb-3 block w-full break-inside-avoid overflow-hidden rounded-xl ring-1 ring-foreground/10 transition hover:ring-primary/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    <AlbumCard album={tile.album} />
                  </Link>
                ) : (
                  <button
                    key={tile.id}
                    type="button"
                    onClick={() => setActiveId(tile.item.id)}
                    className="mb-3 block w-full cursor-pointer break-inside-avoid overflow-hidden rounded-xl border-0 bg-transparent p-0 text-left ring-1 ring-foreground/10 transition hover:ring-primary/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    <MediaThumb item={tile.item} />
                  </button>
                ),
              )}
            </div>
          </section>
        ))}
      </div>

      <Dialog open={Boolean(active)} onOpenChange={(open) => !open && setActiveId(null)}>
        {active ? <GalleryLightbox item={active} /> : null}
      </Dialog>
    </>
  );
}

function AlbumCard({ album }: { album: PublicGalleryAlbum }) {
  const cover = album.cover;

  return (
    <span className="relative block aspect-video w-full overflow-hidden bg-muted">
      {cover?.kind === "VIDEO" ? (
        <video
          src={cover.url}
          className="size-full object-cover"
          muted
          playsInline
          preload="metadata"
        />
      ) : cover ? (
        <Image
          src={cover.url}
          alt=""
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover"
          unoptimized
        />
      ) : null}
      <span className="absolute inset-0 bg-white/60" />
      <span className="absolute inset-x-0 top-0 p-3 font-serif text-base font-semibold tracking-tight text-foreground sm:text-lg">
        {album.name}
      </span>
    </span>
  );
}

function GalleryLightbox({ item }: { item: PublicGalleryItem }) {
  const taken = new Date(item.takenAt);
  const title = item.caption?.trim() || (item.kind === "VIDEO" ? "Video" : "Photo");

  return (
    <DialogContent
      className="max-h-[90vh] overflow-y-auto sm:max-w-4xl"
      showCloseButton
    >
      <DialogHeader>
        <DialogTitle className="font-serif text-lg">{title}</DialogTitle>
        <DialogDescription>
          {formatGalleryDate(taken)}
          {item.authorName && item.authorSlug ? (
            <>
              {" · "}
              <Link
                href={`/directory/${item.authorSlug}`}
                className="text-primary underline-offset-4 hover:underline"
              >
                {item.authorName}
              </Link>
            </>
          ) : item.authorName ? (
            <> · {item.authorName}</>
          ) : null}
        </DialogDescription>
      </DialogHeader>
      <div className="overflow-hidden rounded-lg bg-muted">
        {item.kind === "VIDEO" ? (
          <video
            src={item.url}
            className="mx-auto max-h-[70vh] w-full"
            controls
            playsInline
            preload="metadata"
          />
        ) : (
          <Image
            src={item.url}
            alt={item.caption ?? ""}
            width={item.width ?? 1600}
            height={item.height ?? 1200}
            className="mx-auto h-auto max-h-[70vh] w-auto object-contain"
            sizes="(max-width: 896px) 100vw, 896px"
            unoptimized
          />
        )}
      </div>
    </DialogContent>
  );
}

function MediaThumb({ item }: { item: PublicGalleryItem }) {
  const ratio =
    item.width && item.height ? item.width / item.height : 4 / 3;

  if (item.kind === "VIDEO") {
    return (
      <span className="relative block w-full bg-muted" style={{ aspectRatio: ratio }}>
        <video
          src={item.url}
          className="size-full object-cover"
          muted
          playsInline
          preload="metadata"
        />
        <span className="absolute inset-0 flex items-center justify-center bg-black/25">
          <span className="flex size-10 items-center justify-center rounded-full bg-background/90 text-foreground shadow">
            <Play className="size-4 fill-current" />
          </span>
        </span>
      </span>
    );
  }

  return (
    <span
      className="relative block w-full bg-muted"
      style={{ aspectRatio: ratio }}
    >
      <Image
        src={item.url}
        alt={item.caption ?? ""}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        className="object-cover"
        unoptimized
      />
    </span>
  );
}

function buildTiles(
  items: PublicGalleryItem[],
  albums: PublicGalleryAlbum[],
  mode: GalleryMasonryMode,
): GalleryTile[] {
  const tiles: GalleryTile[] = [];

  if (mode !== "albums") {
    const source =
      mode === "photos" ? items : items.filter((item) => !item.albumId);
    for (const item of source) {
      tiles.push({
        type: "item",
        id: item.id,
        dayKey: galleryDayKey(new Date(item.takenAt)),
        item,
      });
    }
  }

  if (mode !== "photos") {
    for (const album of albums) {
      for (const dayKey of expandAlbumDayKeys(album.dateSpans)) {
        tiles.push({
          type: "album",
          id: `${album.id}-${dayKey}`,
          dayKey,
          album,
        });
      }
    }
  }

  return tiles;
}

function groupTiles(tiles: GalleryTile[]) {
  const groups = new Map<string, GalleryTile[]>();
  for (const tile of tiles) {
    const list = groups.get(tile.dayKey);
    if (list) list.push(tile);
    else groups.set(tile.dayKey, [tile]);
  }

  const keys = [...groups.keys()].sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
  return keys.map((key) => ({
    key,
    label: formatGalleryDay(dateInputToTakenAt(key)),
    tiles: (groups.get(key) ?? []).sort((a, b) => {
      if (a.type === b.type) return 0;
      return a.type === "album" ? -1 : 1;
    }),
  }));
}
