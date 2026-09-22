import Image from "next/image";
import Link from "next/link";
import { MessageCircle, Star, ThumbsUp } from "lucide-react";

import { AuthorAvatar } from "@/components/blogs/author-avatar";
import { formatBlogDate } from "@/lib/blogs";
import type { BlogCardData } from "@/lib/queries/blogs";

/** Muted gradient shown when a (seeded/legacy) blog has no thumbnail. */
export function CoverFallback() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 bg-gradient-to-br from-primary/25 via-primary/10 to-muted"
    />
  );
}

export function BlogCard({
  blog,
  showStar = false,
}: {
  blog: BlogCardData;
  showStar?: boolean;
}) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-colors hover:border-primary/40">
      <div className="relative aspect-video overflow-hidden bg-muted">
        {blog.coverImageUrl ? (
          <Image
            src={blog.coverImageUrl}
            alt=""
            fill
            sizes="(min-width: 1024px) 480px, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <CoverFallback />
        )}
        {showStar && blog.starred ? (
          <span
            className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-xs font-medium text-amber-600"
            title="Starred (only admins see this)"
          >
            <Star className="size-3 fill-current" aria-hidden />
            Starred
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h2 className="font-serif text-xl leading-snug font-semibold tracking-tight">
          <Link
            href={`/blogs/${blog.slug}`}
            className="no-underline after:absolute after:inset-0 after:content-['']"
          >
            {blog.title}
          </Link>
        </h2>
        {blog.excerpt ? (
          <p className="line-clamp-3 text-sm text-muted-foreground">{blog.excerpt}</p>
        ) : null}
        <div className="mt-auto flex items-center gap-2 pt-2 text-xs text-muted-foreground">
          <AuthorAvatar name={blog.author.name} avatarUrl={blog.author.avatarUrl} />
          <span className="truncate font-medium text-foreground">{blog.author.name}</span>
          <span aria-hidden>·</span>
          <time dateTime={blog.publishedAt} className="shrink-0">
            {formatBlogDate(blog.publishedAt)}
          </time>
          <span className="ml-auto flex shrink-0 items-center gap-3">
            <span className="flex items-center gap-1" title="Likes">
              <ThumbsUp className="size-3.5" aria-hidden />
              <span className="sr-only">Likes</span>
              {blog.likes}
            </span>
            <span className="flex items-center gap-1" title="Comments">
              <MessageCircle className="size-3.5" aria-hidden />
              <span className="sr-only">Comments</span>
              {blog.comments}
            </span>
          </span>
        </div>
      </div>
    </article>
  );
}
