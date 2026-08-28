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
import { formatGalleryDate, formatGalleryDay, galleryDayKey } from "@/lib/gallery";

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
};

export function GalleryMasonry({ items }: { items: PublicGalleryItem[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const groups = groupByDay(items);
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
              {group.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveId(item.id)}
                  className="mb-3 block w-full cursor-pointer break-inside-avoid overflow-hidden rounded-xl border-0 bg-transparent p-0 text-left ring-1 ring-foreground/10 transition hover:ring-primary/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <MediaThumb item={item} />
                </button>
              ))}
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

function groupByDay(items: PublicGalleryItem[]) {
  const groups: { key: string; label: string; items: PublicGalleryItem[] }[] =
    [];
  const index = new Map<string, number>();

  for (const item of items) {
    const date = new Date(item.takenAt);
    const key = galleryDayKey(date);
    const existing = index.get(key);
    if (existing == null) {
      index.set(key, groups.length);
      groups.push({
        key,
        label: formatGalleryDay(date),
        items: [item],
      });
    } else {
      groups[existing].items.push(item);
    }
  }

  return groups;
}
