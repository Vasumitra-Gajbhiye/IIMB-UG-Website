"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { AuthorAvatar } from "@/components/blogs/author-avatar";
import { CoverFallback } from "@/components/blogs/blog-card";
import { Button } from "@/components/ui/button";
import { formatBlogDate } from "@/lib/blogs";
import type { BlogCardData } from "@/lib/queries/blogs";
import { cn } from "@/lib/utils";

const AUTOPLAY_MS = 6000;

/** Admin-starred blogs. Renders nothing when none are starred. */
export function FeaturedCarousel({ blogs }: { blogs: BlogCardData[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const many = blogs.length > 1;

  const goTo = useCallback(
    (next: number) => {
      const el = track.current;
      if (!el || blogs.length === 0) return;
      const i = (next + blogs.length) % blogs.length;
      el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
    },
    [blogs.length],
  );

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const onScroll = () => {
      if (el.clientWidth === 0) return;
      setIndex(Math.round(el.scrollLeft / el.clientWidth));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!many || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setTimeout(() => goTo(index + 1), AUTOPLAY_MS);
    return () => window.clearTimeout(timer);
  }, [index, many, paused, goTo]);

  if (blogs.length === 0) return null;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured blogs"
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div
        ref={track}
        className="flex snap-x snap-mandatory overflow-x-auto rounded-2xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {blogs.map((blog, i) => (
          <div
            key={blog.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${blogs.length}`}
            className="relative aspect-[4/3] w-full shrink-0 snap-start overflow-hidden bg-muted sm:aspect-[21/9]"
          >
            {blog.coverImageUrl ? (
              <Image
                src={blog.coverImageUrl}
                alt=""
                fill
                priority={i === 0}
                sizes="(min-width: 1024px) 1024px, 100vw"
                className="object-cover"
              />
            ) : (
              <CoverFallback />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-8">
              <p className="text-xs font-medium tracking-wider text-white/80 uppercase">
                Featured
              </p>
              <h2 className="mt-1 max-w-2xl font-serif text-2xl leading-tight font-semibold tracking-tight sm:text-4xl">
                <Link
                  href={`/blogs/${blog.slug}`}
                  className="text-white no-underline after:absolute after:inset-0 after:content-['']"
                >
                  {blog.title}
                </Link>
              </h2>
              {blog.excerpt ? (
                <p className="mt-2 line-clamp-2 max-w-2xl text-sm text-white/85 sm:text-base">
                  {blog.excerpt}
                </p>
              ) : null}
              <div className="mt-3 flex items-center gap-2 text-xs text-white/80">
                <AuthorAvatar
                  name={blog.author.name}
                  avatarUrl={blog.author.avatarUrl}
                  className="ring-1 ring-white/40"
                />
                <span className="font-medium text-white">{blog.author.name}</span>
                <span aria-hidden>·</span>
                <time dateTime={blog.publishedAt}>{formatBlogDate(blog.publishedAt)}</time>
              </div>
            </div>
          </div>
        ))}
      </div>

      {many ? (
        <>
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-1/2 left-3 hidden -translate-y-1/2 rounded-full opacity-90 sm:inline-flex"
            onClick={() => goTo(index - 1)}
            aria-label="Previous featured blog"
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-1/2 right-3 hidden -translate-y-1/2 rounded-full opacity-90 sm:inline-flex"
            onClick={() => goTo(index + 1)}
            aria-label="Next featured blog"
          >
            <ChevronRight />
          </Button>
          <div className="mt-3 flex justify-center gap-1.5">
            {blogs.map((blog, i) => (
              <button
                key={blog.id}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Go to featured blog ${i + 1}`}
                aria-current={i === index}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === index ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30",
                )}
              />
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
