"use client";

import { useState } from "react";

import { GalleryComposer } from "@/components/admin/gallery-composer";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function GalleryAddButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        Add photos
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
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
          <GalleryComposer onPosted={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
