"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

import { deleteGalleryAlbum, type GalleryActionState } from "@/lib/actions/gallery";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatGalleryDate } from "@/lib/gallery";

export type AdminGalleryAlbum = {
  id: string;
  name: string;
  createdAt: Date | string;
  author: {
    student: { name: string; slug: string; isListed: boolean } | null;
  };
  items: {
    id: string;
    kind: "IMAGE" | "VIDEO";
    url: string;
  }[];
};

const initial: GalleryActionState = { ok: false };

export function GalleryAlbumList({
  albums,
  isMod,
}: {
  albums: AdminGalleryAlbum[];
  isMod: boolean;
}) {
  if (albums.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No albums yet. Create one from the gallery.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {albums.map((album) => (
        <GalleryAlbumRow key={album.id} album={album} isMod={isMod} />
      ))}
    </ul>
  );
}

function GalleryAlbumRow({
  album,
  isMod,
}: {
  album: AdminGalleryAlbum;
  isMod: boolean;
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [state, action] = useActionState(deleteGalleryAlbum, initial);
  const preview = album.items.find((item) => item.kind === "IMAGE") ?? album.items[0];
  const label = album.author.student?.name;

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.ok) toast.success("Album deleted.");
  }, [state]);

  return (
    <li className="flex items-center gap-3 rounded-xl border border-border p-3">
      <div className="size-16 shrink-0 overflow-hidden rounded-md bg-muted">
        {preview?.kind === "VIDEO" ? (
          <video
            src={preview.url}
            className="size-full object-cover"
            muted
            playsInline
            preload="metadata"
          />
        ) : preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview.url} alt="" className="size-full object-cover" />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {album.name}
          {isMod && label ? ` · ${label}` : ""}
        </p>
        <p className="text-xs text-muted-foreground">
          {album.items.length} {album.items.length === 1 ? "file" : "files"} ·
          Created {formatGalleryDate(new Date(album.createdAt))}
        </p>
      </div>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        onClick={() => setDeleteOpen(true)}
      >
        Delete
      </Button>
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this album?</DialogTitle>
            <DialogDescription>
              {album.items.length} file
              {album.items.length === 1 ? "" : "s"} will be removed from the
              gallery and from storage. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <form action={action}>
              <input type="hidden" name="id" value={album.id} />
              <Button variant="destructive" type="submit">
                Delete
              </Button>
            </form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </li>
  );
}
