"use client";

import Link from "next/link";
import { Star } from "lucide-react";

import { toggleBlogStar, unpublishBlog } from "@/lib/actions/blogs";
import { DeleteBlogDialog } from "@/components/blogs/delete-blog-dialog";
import { PendingLabel } from "@/components/blogs/pending-label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Author/mod tools on a published blog. The star is mods-only and internal. */
export function BlogAdminControls({
  id,
  title,
  starred,
  isMod,
  isAuthor,
}: {
  id: string;
  title: string;
  starred: boolean;
  isMod: boolean;
  isAuthor: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 p-2">
      <span className="px-1 text-xs text-muted-foreground">
        {isMod && !isAuthor ? "Admin" : "Your blog"}
      </span>
      {isMod ? (
        <form action={toggleBlogStar}>
          <input type="hidden" name="id" value={id} />
          <Button
            type="submit"
            size="sm"
            variant="outline"
            aria-pressed={starred}
            title="Starred blogs appear in the featured carousel. Only admins see stars."
            className={cn(starred && "border-amber-500/60 text-amber-600")}
          >
            <Star className={cn(starred && "fill-current")} />
            <PendingLabel
              idle={starred ? "Starred" : "Star"}
              pendingLabel={starred ? "Unstarring…" : "Starring…"}
            />
          </Button>
        </form>
      ) : null}
      <Button size="sm" variant="outline" asChild>
        <Link href={`/blogs/mine/${id}`}>Edit</Link>
      </Button>
      <form action={unpublishBlog}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="redirectTo" value={isAuthor ? "/blogs/mine" : "/blogs"} />
        <Button type="submit" size="sm" variant="outline">
          <PendingLabel idle="Unpublish" pendingLabel="Unpublishing…" />
        </Button>
      </form>
      <DeleteBlogDialog
        id={id}
        title={title}
        redirectTo={isAuthor ? "/blogs/mine" : "/blogs"}
      />
    </div>
  );
}
