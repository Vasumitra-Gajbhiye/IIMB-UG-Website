import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AuthorAvatar } from "@/components/blogs/author-avatar";
import { BlockNoteViewer } from "@/components/blogs/blocknote-viewer-dynamic";
import { BlogAdminControls } from "@/components/blogs/blog-admin-controls";
import { CommentSection } from "@/components/blogs/comment-section";
import { ReactionBar } from "@/components/blogs/reaction-bar";
import { Separator } from "@/components/ui/separator";
import { ensureUser } from "@/lib/auth";
import { formatBlogDate } from "@/lib/blogs";
import { TRACK_LABEL } from "@/lib/constants";
import { getPublishedBlogBySlug, listBlogComments } from "@/lib/queries/blogs";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const blog = await getPublishedBlogBySlug(slug);
  if (!blog) return { title: "Blog not found" };
  const description = blog.excerpt ?? undefined;
  return {
    title: blog.title,
    description,
    authors: [{ name: blog.author.name }],
    openGraph: {
      title: blog.title,
      description,
      type: "article",
      publishedTime: blog.publishedAt?.toISOString(),
      images: blog.coverImageUrl ? [blog.coverImageUrl] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const session = await ensureUser();
  const blog = await getPublishedBlogBySlug(slug, session?.id);
  if (!blog) notFound();

  const comments = await listBlogComments(blog.id);
  const isAuthor = Boolean(session?.studentId && session.studentId === blog.authorId);
  const isMod = Boolean(session?.isMod);
  const signInHref = `/sign-in?redirect_url=${encodeURIComponent(`/blogs/${blog.slug}`)}`;
  const authorName = blog.author.isListed ? (
    <Link href={`/${blog.author.slug}`} className="font-medium text-foreground no-underline hover:underline">
      {blog.author.name}
    </Link>
  ) : (
    <span className="font-medium text-foreground">{blog.author.name}</span>
  );

  return (
    <article className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <Link href="/blogs" className="text-sm text-muted-foreground no-underline hover:text-foreground">
        ← All blogs
      </Link>

      {isAuthor || isMod ? (
        <div className="mt-4">
          <BlogAdminControls
            id={blog.id}
            title={blog.title}
            starred={Boolean(blog.starredAt)}
            isMod={isMod}
            isAuthor={isAuthor}
          />
        </div>
      ) : null}

      <header className="mt-6">
        <h1 className="font-serif text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
          {blog.title}
        </h1>
        {blog.excerpt ? (
          <p className="mt-3 text-lg text-muted-foreground">{blog.excerpt}</p>
        ) : null}
        <div className="mt-5 flex items-center gap-3 text-sm text-muted-foreground">
          <AuthorAvatar name={blog.author.name} avatarUrl={blog.author.avatarUrl} className="size-10" />
          <div>
            <div>{authorName}</div>
            <div className="text-xs">
              {TRACK_LABEL[blog.author.track]} ·{" "}
              {blog.publishedAt ? (
                <time dateTime={blog.publishedAt.toISOString()}>
                  {formatBlogDate(blog.publishedAt)}
                </time>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      {blog.coverImageUrl ? (
        <div className="relative mt-8 aspect-video overflow-hidden rounded-xl bg-muted">
          <Image
            src={blog.coverImageUrl}
            alt=""
            fill
            priority
            sizes="(min-width: 768px) 720px, 100vw"
            className="object-cover"
          />
        </div>
      ) : null}

      <div className="mt-8">
        <BlockNoteViewer content={blog.content} />
      </div>

      <div className="mt-10">
        <ReactionBar
          blogId={blog.id}
          likes={blog.likes}
          dislikes={blog.dislikes}
          myReaction={blog.myReaction}
          signedIn={Boolean(session)}
          signInHref={signInHref}
        />
      </div>

      <Separator className="my-10" />

      <CommentSection
        blogId={blog.id}
        comments={comments}
        viewer={
          session
            ? { userId: session.id, canModerate: isMod || isAuthor }
            : null
        }
        signInHref={signInHref}
      />
    </article>
  );
}
