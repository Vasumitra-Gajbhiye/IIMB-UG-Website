"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  GalleryMasonry,
  type GalleryMasonryMode,
  type PublicGalleryAlbum,
  type PublicGalleryItem,
} from "@/components/gallery/gallery-masonry";
import { Button } from "@/components/ui/button";

export type GalleryFilter = "photos" | "albums" | null;

export function GalleryFeed({
  items,
  albums,
  isAllowlisted,
}: {
  items: PublicGalleryItem[];
  albums: PublicGalleryAlbum[];
  isAllowlisted: boolean;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const raw = searchParams.get("filter");
  const filter: GalleryFilter =
    raw === "photos" || raw === "albums" ? raw : null;
  const mode: GalleryMasonryMode =
    filter === "photos" ? "photos" : filter === "albums" ? "albums" : "mixed";

  function setFilter(next: GalleryFilter) {
    const value = filter === next ? null : next;
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("filter", value);
    else params.delete("filter");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  const hasContent =
    mode === "photos"
      ? items.length > 0
      : mode === "albums"
        ? albums.length > 0
        : items.some((item) => !item.albumId) || albums.length > 0;

  return (
    <>
      <div className="mt-6 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={filter === "photos" ? "default" : "outline"}
          aria-pressed={filter === "photos"}
          onClick={() => setFilter("photos")}
        >
          Photos only
        </Button>
        <Button
          type="button"
          size="sm"
          variant={filter === "albums" ? "default" : "outline"}
          aria-pressed={filter === "albums"}
          onClick={() => setFilter("albums")}
        >
          Album only
        </Button>
      </div>
      {hasContent ? (
        <div className="mt-10">
          <GalleryMasonry items={items} albums={albums} mode={mode} />
        </div>
      ) : (
        <p className="mt-12 text-muted-foreground">
          {emptyCopy(filter, isAllowlisted)}
        </p>
      )}
    </>
  );
}

function emptyCopy(filter: GalleryFilter, isAllowlisted: boolean): string {
  if (filter === "photos") return "No photos or videos yet.";
  if (filter === "albums") {
    return isAllowlisted
      ? "No albums yet. Create the first one."
      : "No albums yet.";
  }
  return isAllowlisted
    ? "Nothing here yet. Add the first photos."
    : "Nothing here yet. Check back after the batch starts posting.";
}
