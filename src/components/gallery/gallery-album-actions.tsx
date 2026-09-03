"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  deleteGalleryAlbum,
  renameGalleryAlbum,
  type GalleryActionState,
} from "@/lib/actions/gallery";
import { ALBUM_NAME_MAX_LENGTH } from "@/lib/gallery";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: GalleryActionState = { ok: false };

export function GalleryAlbumActions({
  albumId,
  name,
  fileCount,
}: {
  albumId: string;
  name: string;
  fileCount: number;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState(name);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [state, action] = useActionState(deleteGalleryAlbum, initial);

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.ok) {
      toast.success("Album deleted.");
      router.push("/gallery");
      router.refresh();
    }
  }, [state, router]);

  async function saveName() {
    const next = draft.trim();
    if (!next || next === name || saving) return;
    setSaving(true);
    const result = await renameGalleryAlbum(albumId, next);
    if (!result.ok) {
      toast.error(result.error ?? "Could not rename the album.");
    } else {
      toast.success("Album renamed.");
      router.refresh();
    }
    setSaving(false);
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1 space-y-1.5">
          <Label htmlFor="rename-album">Rename album</Label>
          <Input
            id="rename-album"
            value={draft}
            maxLength={ALBUM_NAME_MAX_LENGTH}
            onChange={(event) => setDraft(event.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={saving || !draft.trim() || draft.trim() === name}
            onClick={() => void saveName()}
          >
            {saving ? <Loader2 className="animate-spin" /> : null}
            Save name
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => setDeleteOpen(true)}
          >
            Delete album
          </Button>
        </div>
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this album?</DialogTitle>
            <DialogDescription>
              {fileCount} file{fileCount === 1 ? "" : "s"} will be removed from
              the gallery and from storage. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <form action={action}>
              <input type="hidden" name="id" value={albumId} />
              <Button variant="destructive" type="submit">
                Delete
              </Button>
            </form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
