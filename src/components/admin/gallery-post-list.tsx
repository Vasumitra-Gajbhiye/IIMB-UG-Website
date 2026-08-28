"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

import { deleteGalleryPost, type GalleryActionState } from "@/lib/actions/gallery";
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

export type AdminGalleryPost = {
  id: string;
  createdAt: Date | string;
  author: {
    student: { name: string; slug: string; isListed: boolean } | null;
  };
  items: {
    id: string;
    kind: "IMAGE" | "VIDEO";
    url: string;
    caption: string | null;
  }[];
};

const initial: GalleryActionState = { ok: false };

export function GalleryPostList({
  posts,
  isMod,
}: {
  posts: AdminGalleryPost[];
  isMod: boolean;
}) {
  if (posts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No posts yet. Drop files above and click Post.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {posts.map((post) => (
        <GalleryPostRow key={post.id} post={post} isMod={isMod} />
      ))}
    </ul>
  );
}

function GalleryPostRow({
  post,
  isMod,
}: {
  post: AdminGalleryPost;
  isMod: boolean;
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [state, action] = useActionState(deleteGalleryPost, initial);
  const preview = post.items[0];
  const label = post.author.student?.name;

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.ok) toast.success("Post deleted.");
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
        <p className="text-sm font-medium">
          {post.items.length} {post.items.length === 1 ? "file" : "files"}
          {isMod && label ? ` · ${label}` : ""}
        </p>
        <p className="text-xs text-muted-foreground">
          Posted {formatGalleryDate(new Date(post.createdAt))}
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
            <DialogTitle>Delete this post?</DialogTitle>
            <DialogDescription>
              {post.items.length} file
              {post.items.length === 1 ? "" : "s"} will be removed from the
              gallery and from storage. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <form action={action}>
              <input type="hidden" name="id" value={post.id} />
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
