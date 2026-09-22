import { PostStatus, ReactionType } from "@/generated/prisma/client";
import type { Prisma, Track } from "@/generated/prisma/client";
import { BLOG_PAGE_SIZE, type BlogCursor } from "@/lib/blogs";
import { prisma } from "@/lib/prisma";

export type BlogAuthor = {
  name: string;
  slug: string;
  avatarUrl: string | null;
  track: Track;
  isListed: boolean;
};

export type BlogCardData = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  publishedAt: string;
  starred: boolean;
  author: BlogAuthor;
  likes: number;
  dislikes: number;
  comments: number;
};

export type BlogComment = {
  id: string;
  body: string;
  createdAt: string;
  userId: string;
  name: string;
  avatarUrl: string | null;
  profileSlug: string | null;
};

const authorSelect = {
  select: { name: true, slug: true, avatarUrl: true, track: true, isListed: true },
} satisfies Prisma.StudentDefaultArgs;

const cardSelect = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  coverImageUrl: true,
  publishedAt: true,
  starredAt: true,
  author: authorSelect,
  _count: { select: { comments: true } },
} satisfies Prisma.BlogSelect;

type CardRow = Prisma.BlogGetPayload<{ select: typeof cardSelect }>;

export type ReactionCounts = { likes: number; dislikes: number };

export async function reactionCounts(
  blogIds: string[],
): Promise<Map<string, ReactionCounts>> {
  const counts = new Map<string, ReactionCounts>(
    blogIds.map((id) => [id, { likes: 0, dislikes: 0 }]),
  );
  if (blogIds.length === 0) return counts;
  const groups = await prisma.blogReaction.groupBy({
    by: ["blogId", "type"],
    where: { blogId: { in: blogIds } },
    _count: { _all: true },
  });
  for (const g of groups) {
    const entry = counts.get(g.blogId);
    if (!entry) continue;
    if (g.type === ReactionType.LIKE) entry.likes = g._count._all;
    else entry.dislikes = g._count._all;
  }
  return counts;
}

async function toCards(rows: CardRow[]): Promise<BlogCardData[]> {
  const counts = await reactionCounts(rows.map((r) => r.id));
  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    coverImageUrl: row.coverImageUrl,
    publishedAt: (row.publishedAt ?? new Date()).toISOString(),
    starred: Boolean(row.starredAt),
    author: row.author,
    likes: counts.get(row.id)?.likes ?? 0,
    dislikes: counts.get(row.id)?.dislikes ?? 0,
    comments: row._count.comments,
  }));
}

/** Published blogs, newest first, keyset-paginated on (publishedAt, id). */
export async function listPublishedBlogs(
  cursor?: BlogCursor | null,
  take = BLOG_PAGE_SIZE,
): Promise<{ blogs: BlogCardData[]; nextCursor: BlogCursor | null }> {
  const where: Prisma.BlogWhereInput = { status: PostStatus.PUBLISHED };
  if (cursor) {
    const at = new Date(cursor.publishedAt);
    where.OR = [
      { publishedAt: { lt: at } },
      { publishedAt: at, id: { lt: cursor.id } },
    ];
  }
  const rows = await prisma.blog.findMany({
    where,
    orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
    take: take + 1,
    select: cardSelect,
  });
  const page = rows.slice(0, take);
  const last = page[page.length - 1];
  const nextCursor =
    rows.length > take && last?.publishedAt
      ? { publishedAt: last.publishedAt.toISOString(), id: last.id }
      : null;
  return { blogs: await toCards(page), nextCursor };
}

/** Starred (featured) published blogs, most recently starred first. */
export async function listStarredBlogs(): Promise<BlogCardData[]> {
  const rows = await prisma.blog.findMany({
    where: { status: PostStatus.PUBLISHED, starredAt: { not: null } },
    orderBy: { starredAt: "desc" },
    select: cardSelect,
  });
  return toCards(rows);
}

/** A student's published blogs for their directory profile. */
export async function listStudentBlogs(studentId: string, take = 20) {
  const rows = await prisma.blog.findMany({
    where: { authorId: studentId, status: PostStatus.PUBLISHED },
    orderBy: { publishedAt: "desc" },
    take,
    select: cardSelect,
  });
  return toCards(rows);
}

export async function getPublishedBlogBySlug(
  slug: string,
  viewerUserId?: string | null,
) {
  const blog = await prisma.blog.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      content: true,
      coverImageUrl: true,
      status: true,
      publishedAt: true,
      updatedAt: true,
      starredAt: true,
      authorId: true,
      author: authorSelect,
    },
  });
  if (!blog || blog.status !== PostStatus.PUBLISHED) return null;

  const [counts, mine] = await Promise.all([
    reactionCounts([blog.id]),
    viewerUserId
      ? prisma.blogReaction.findUnique({
          where: { blogId_userId: { blogId: blog.id, userId: viewerUserId } },
          select: { type: true },
        })
      : null,
  ]);

  return {
    ...blog,
    likes: counts.get(blog.id)?.likes ?? 0,
    dislikes: counts.get(blog.id)?.dislikes ?? 0,
    myReaction: mine?.type ?? null,
  };
}

export async function listBlogComments(blogId: string): Promise<BlogComment[]> {
  const rows = await prisma.blogComment.findMany({
    where: { blogId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      body: true,
      createdAt: true,
      userId: true,
      user: {
        select: {
          name: true,
          student: { select: { name: true, avatarUrl: true, slug: true, isListed: true } },
        },
      },
    },
  });
  return rows.map((row) => ({
    id: row.id,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    userId: row.userId,
    name: row.user.student?.name ?? row.user.name ?? "Member",
    avatarUrl: row.user.student?.avatarUrl ?? null,
    profileSlug: row.user.student?.isListed ? row.user.student.slug : null,
  }));
}

export async function listMyBlogs(studentId: string) {
  return prisma.blog.findMany({
    where: { authorId: studentId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      coverImageUrl: true,
      status: true,
      publishedAt: true,
      updatedAt: true,
    },
  });
}

/** The blog if this session may edit it (its author, or a mod), else null. */
export async function getEditableBlog(
  id: string,
  session: { studentId: string | null; isMod: boolean },
) {
  const blog = await prisma.blog.findUnique({ where: { id } });
  if (!blog) return null;
  if (!session.isMod && blog.authorId !== session.studentId) return null;
  return blog;
}
