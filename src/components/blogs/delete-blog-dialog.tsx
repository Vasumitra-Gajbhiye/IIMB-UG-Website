"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";

import { deleteBlog } from "@/lib/actions/blogs";
import { PendingLabel } from "@/components/blogs/pending-label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function DeleteBlogDialog({
  id,
  title,
  redirectTo,
  size = "sm",
  iconOnly = false,
}: {
  id: string;
  title: string;
  redirectTo?: "/blogs" | "/blogs/mine";
  size?: "sm" | "icon-sm";
  iconOnly?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={iconOnly ? "ghost" : "destructive"}
          size={size}
          aria-label={iconOnly ? `Delete ${title}` : undefined}
        >
          {iconOnly ? <Trash2 /> : "Delete"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this blog?</DialogTitle>
          <DialogDescription>
            “{title}” and all its likes and comments will be removed. This
            cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <form action={deleteBlog}>
            <input type="hidden" name="id" value={id} />
            {redirectTo ? (
              <input type="hidden" name="redirectTo" value={redirectTo} />
            ) : null}
            <Button variant="destructive" type="submit">
              <PendingLabel idle="Delete" pendingLabel="Deleting…" />
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
