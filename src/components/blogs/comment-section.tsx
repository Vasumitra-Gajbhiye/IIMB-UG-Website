"use client";

import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  addBlogComment,
  deleteBlogComment,
  type BlogActionState,
} from "@/lib/actions/blogs";
import { AuthorAvatar } from "@/components/blogs/author-avatar";
import { PendingLabel } from "@/components/blogs/pending-label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BLOG_COMMENT_MAX, formatRelative } from "@/lib/blogs";
import type { BlogComment } from "@/lib/queries/blogs";

const initial: BlogActionState = { ok: false };

export function CommentSection({
  blogId,
  comments,
  viewer,
  signInHref,
}: {
  blogId: string;
  comments: BlogComment[];
  /** Null when signed out. `canModerate`: blog author or mod. */
  viewer: { userId: string; canModerate: boolean } | null;
  signInHref: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action] = useActionState(addBlogComment, initial);

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <section aria-labelledby="comments-heading" className="space-y-6">
      <h2 id="comments-heading" className="font-serif text-2xl font-semibold tracking-tight">
        Comments{comments.length ? ` (${comments.length})` : ""}
      </h2>

      {viewer ? (
        <form ref={formRef} action={action} className="space-y-2">
          <input type="hidden" name="blogId" value={blogId} />
          <Textarea
            name="body"
            required
            maxLength={BLOG_COMMENT_MAX}
            rows={3}
            placeholder="Add a comment…"
            aria-label="Comment"
          />
          <div className="flex justify-end">
            <Button type="submit" size="sm">
              <PendingLabel idle="Post comment" pendingLabel="Posting…" />
            </Button>
          </div>
        </form>
      ) : (
        <p className="rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
          <Link href={signInHref} className="font-medium text-primary underline-offset-4 hover:underline">
            Sign in
          </Link>{" "}
          to like and comment.
        </p>
      )}

      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No comments yet. Start the conversation.</p>
      ) : (
        <ul className="space-y-5">
          {comments.map((comment) => {
            const canDelete =
              viewer && (viewer.canModerate || viewer.userId === comment.userId);
            return (
              <li key={comment.id} className="flex gap-3">
                <AuthorAvatar
                  name={comment.name}
                  avatarUrl={comment.avatarUrl}
                  className="size-8"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-sm">
                    {comment.profileSlug ? (
                      <Link
                        href={`/${comment.profileSlug}`}
                        className="font-medium text-foreground no-underline hover:underline"
                      >
                        {comment.name}
                      </Link>
                    ) : (
                      <span className="font-medium">{comment.name}</span>
                    )}
                    <time
                      dateTime={comment.createdAt}
                      className="text-xs text-muted-foreground"
                      suppressHydrationWarning
                    >
                      {formatRelative(comment.createdAt)}
                    </time>
                    {canDelete ? (
                      <form action={deleteBlogComment} className="ml-auto">
                        <input type="hidden" name="id" value={comment.id} />
                        <Button
                          type="submit"
                          variant="ghost"
                          size="icon-xs"
                          aria-label="Delete comment"
                          title="Delete comment"
                        >
                          <Trash2 />
                        </Button>
                      </form>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm break-words whitespace-pre-wrap">{comment.body}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
