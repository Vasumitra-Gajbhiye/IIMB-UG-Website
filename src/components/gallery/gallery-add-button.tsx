"use client";

import { useState } from "react";

import { GalleryComposer } from "@/components/admin/gallery-composer";
import { GalleryAlbumComposer } from "@/components/gallery/gallery-album-composer";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function GalleryAddButton() {
  const [photosOpen, setPhotosOpen] = useState(false);
  const [albumOpen, setAlbumOpen] = useState(false);

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => setPhotosOpen(true)}>
          Add photos
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setAlbumOpen(true)}
        >
          Create album
        </Button>
      </div>
      <Dialog open={photosOpen} onOpenChange={setPhotosOpen}>
        <DialogContent
          className="max-h-[90vh] overflow-y-auto sm:max-w-3xl"
          showCloseButton
        >
          <DialogHeader>
            <DialogTitle className="font-serif text-lg">Add photos</DialogTitle>
            <DialogDescription>
              Drop photos or videos, add captions and dates, then post. They go
              live on the gallery right away.
            </DialogDescription>
          </DialogHeader>
          <GalleryComposer onPosted={() => setPhotosOpen(false)} />
        </DialogContent>
      </Dialog>
      <Dialog open={albumOpen} onOpenChange={setAlbumOpen}>
        <DialogContent
          className="max-h-[90vh] overflow-y-auto sm:max-w-3xl"
          showCloseButton
        >
          <DialogHeader>
            <DialogTitle className="font-serif text-lg">
              Create album
            </DialogTitle>
            <DialogDescription>
              Name the album, pick the days it should appear, then add photos or
              videos. Each file still needs its own date.
            </DialogDescription>
          </DialogHeader>
          <GalleryAlbumComposer onPosted={() => setAlbumOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
