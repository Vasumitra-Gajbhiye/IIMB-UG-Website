import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PenLine } from "lucide-react";

import { CoverFallback } from "@/components/blogs/blog-card";
import { BlogStatusBadge } from "@/components/blogs/blog-status-badge";
import { DeleteBlogDialog } from "@/components/blogs/delete-blog-dialog";
import { NewBlogButton } from "@/components/blogs/new-blog-button";
import { Button } from "@/components/ui/button";
import { PostStatus } from "@/generated/prisma/enums";
import { requireAllowlisted } from "@/lib/auth";
import { formatBlogDate } from "@/lib/blogs";
import { listMyBlogs } from "@/lib/queries/blogs";

export const metadata: Metadata = {
  title: "My Blogs",
};

export default async function MyBlogsPage() {
  const session = await requireAllowlisted({ redirectTo: "/not-allowlisted" });
  const blogs = session.studentId ? await listMyBlogs(session.studentId) : [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-12">
      <Link href="/blogs" className="text-sm text-muted-foreground no-underline hover:text-foreground">
        ← All blogs
      </Link>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight">My Blogs</h1>
          <p className="mt-2 text-muted-foreground">
            Your drafts and published blogs.
          </p>
        </div>
        {session.studentId ? <NewBlogButton /> : null}
      </div>

      {!session.studentId ? (
        <div className="mt-10 rounded-xl border border-dashed border-border px-6 py-14 text-center">
          <p className="font-medium">Finish your profile to start writing</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Blogs appear under your name and link to your profile, so set that up first.
          </p>
          <Button className="mt-5" asChild>
            <Link href="/me?next=/blogs/mine">Set up my profile</Link>
          </Button>
        </div>
      ) : blogs.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-border px-6 py-14 text-center">
          <PenLine className="mx-auto size-8 text-muted-foreground" aria-hidden />
          <p className="mt-3 font-medium">You haven&apos;t written any blogs yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Click Add Blog to start a draft. It stays private until you publish it.
          </p>
          <div className="mt-5 flex justify-center">
            <NewBlogButton />
          </div>
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-border rounded-xl border border-border bg-card">
          {blogs.map((blog) => (
            <li key={blog.id} className="flex items-center gap-4 p-3 sm:p-4">
              <Link
                href={`/blogs/mine/${blog.id}`}
                className="relative hidden aspect-video w-28 shrink-0 overflow-hidden rounded-md bg-muted sm:block"
                tabIndex={-1}
                aria-hidden
              >
                {blog.coverImageUrl ? (
                  <Image src={blog.coverImageUrl} alt="" fill sizes="112px" className="object-cover" />
                ) : (
                  <CoverFallback />
                )}
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <BlogStatusBadge status={blog.status} />
                  <span className="text-xs text-muted-foreground">
                    {blog.status === PostStatus.PUBLISHED && blog.publishedAt
                      ? `Published ${formatBlogDate(blog.publishedAt)}`
                      : `Edited ${formatBlogDate(blog.updatedAt)}`}
                  </span>
                </div>
                <Link
                  href={`/blogs/mine/${blog.id}`}
                  className="mt-1 block truncate font-medium text-foreground no-underline hover:underline"
                >
                  {blog.title || "Untitled"}
                </Link>
                {blog.excerpt ? (
                  <p className="truncate text-sm text-muted-foreground">{blog.excerpt}</p>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {blog.status === PostStatus.PUBLISHED ? (
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/blogs/${blog.slug}`}>View</Link>
                  </Button>
                ) : null}
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/blogs/mine/${blog.id}`}>Edit</Link>
                </Button>
                <DeleteBlogDialog id={blog.id} title={blog.title || "Untitled"} size="icon-sm" iconOnly />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
