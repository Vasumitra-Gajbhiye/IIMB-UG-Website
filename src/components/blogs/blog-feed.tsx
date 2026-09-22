"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { BlogCard } from "@/components/blogs/blog-card";
import { loadMoreBlogs } from "@/lib/actions/blogs";
import { BLOG_PAGE_SIZE, type BlogCursor } from "@/lib/blogs";
import type { BlogCardData } from "@/lib/queries/blogs";

type Props = {
  initial: BlogCardData[];
  initialCursor: BlogCursor | null;
  showStars: boolean;
};

/** Published blogs; loads the next page when the reader nears the bottom. */
export function BlogFeed({ initial, initialCursor, showStars }: Props) {
  const [blogs, setBlogs] = useState(initial);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);
  const busy = useRef(false);

  const loadMore = useCallback(async () => {
    if (busy.current || !cursor) return;
    busy.current = true;
    setLoading(true);
    setFailed(false);
    try {
      const next = await loadMoreBlogs(cursor);
      setBlogs((prev) => {
        const seen = new Set(prev.map((b) => b.id));
        return [...prev, ...next.blogs.filter((b) => !seen.has(b.id))];
      });
      setCursor(next.nextCursor);
    } catch {
      setFailed(true);
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }, [cursor]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || !cursor || failed) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMore();
      },
      { rootMargin: "400px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [cursor, failed, loadMore]);

  if (blogs.length === 0) {
    return (
      <p className="mt-10 rounded-xl border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
        No blogs published yet.
      </p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {blogs.map((blog) => (
          <BlogCard key={blog.id} blog={blog} showStar={showStars} />
        ))}
      </div>
      {cursor ? (
        <div
          ref={sentinel}
          className="py-8 text-center text-sm text-muted-foreground"
        >
          {failed ? (
            <button
              type="button"
              onClick={() => void loadMore()}
              className="underline underline-offset-4"
            >
              Couldn&apos;t load more. Retry
            </button>
          ) : loading ? (
            "Loading…"
          ) : null}
        </div>
      ) : blogs.length > BLOG_PAGE_SIZE ? (
        <p className="py-8 text-center text-xs text-muted-foreground">
          You&apos;ve reached the end.
        </p>
      ) : null}
    </>
  );
}
