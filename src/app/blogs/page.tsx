import type { Metadata } from "next";
import Link from "next/link";
import { NotebookPen } from "lucide-react";

import { BlogFeed } from "@/components/blogs/blog-feed";
import { FeaturedCarousel } from "@/components/blogs/featured-carousel";
import { NewBlogButton } from "@/components/blogs/new-blog-button";
import { Button } from "@/components/ui/button";
import { ensureUser } from "@/lib/auth";
import { listPublishedBlogs, listStarredBlogs } from "@/lib/queries/blogs";

export const metadata: Metadata = {
  title: "Blogs",
  description: "Writing from the inaugural IIMB UG batch.",
};

export default async function BlogsPage() {
  const [session, featured, first] = await Promise.all([
    ensureUser(),
    listStarredBlogs(),
    listPublishedBlogs(),
  ]);
  const canWrite = Boolean(session?.isAllowlisted);
  const isMod = Boolean(session?.isMod);
  // Stars are internal: never send them to non-mods.
  const blogs = isMod
    ? first.blogs
    : first.blogs.map((b) => ({ ...b, starred: false }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight">Blogs</h1>
          <p className="mt-2 text-muted-foreground">
            Stories, notes and ideas from the batch.
          </p>
        </div>
        {canWrite ? (
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/blogs/mine">
                <NotebookPen data-icon="inline-start" />
                My Blogs
              </Link>
            </Button>
            <NewBlogButton />
          </div>
        ) : null}
      </div>

      {featured.length > 0 ? (
        <div className="mt-8">
          <FeaturedCarousel blogs={featured.map((b) => ({ ...b, starred: false }))} />
        </div>
      ) : null}

      <div className="mt-10">
        {featured.length > 0 && blogs.length > 0 ? (
          <h2 className="mb-4 text-sm font-medium tracking-wider text-muted-foreground uppercase">
            Latest
          </h2>
        ) : null}
        <BlogFeed initial={blogs} initialCursor={first.nextCursor} showStars={isMod} />
      </div>
    </div>
  );
}
