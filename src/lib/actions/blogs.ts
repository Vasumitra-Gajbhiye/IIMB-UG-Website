"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { PostStatus, ReactionType } from "@/generated/prisma/client";
import { ensureUser, requireAllowlisted } from "@/lib/auth";
import {
  BLOG_COMMENT_MAX,
  BLOG_EXCERPT_MAX,
  BLOG_IMAGE_MAX_BYTES,
  BLOG_IMAGE_MIME_TYPES,
  BLOG_TITLE_MAX,
  collectBlockUrls,
  hasBlogContent,
  type BlogCursor,
} from "@/lib/blogs";
import { prisma } from "@/lib/prisma";
import {
  listPublishedBlogs,
  reactionCounts,
  type BlogCardData,
} from "@/lib/queries/blogs";
import {
  blogKeyFromUrl,
  deleteGalleryObjects,
  presignBlogImagePut,
} from "@/lib/r2";
import { uniqueBlogSlug } from "@/lib/slug";

export type BlogActionState = {
  ok: boolean;
  error?: string;
  savedAt?: string;
};

const CONTENT_MAX_CHARS = 1_000_000;

function revalidateBlogs(slug?: string) {
  revalidatePath("/blogs");
  revalidatePath("/blogs/mine", "layout");
  if (slug) revalidatePath(`/blogs/${slug}`);
  revalidatePath("/[slug]", "page");
}

/** Allowlisted author (or mod) of this blog; everyone else is sent away. */
async function requireBlogEditor(id: string) {
  const session = await requireAllowlisted({ redirectTo: "/not-allowlisted" });
  const blog = await prisma.blog.findUnique({ where: { id } });
  if (!blog) return { session, blog: null };
  if (!session.isMod && blog.authorId !== session.studentId) {
    redirect("/blogs");
  }
  return { session, blog };
}

/** Best-effort delete of R2 objects we own; never throws. */
async function deleteBlogObjects(urls: (string | null | undefined)[]) {
  try {
    const keys = urls
      .filter((u): u is string => Boolean(u))
      .map((u) => blogKeyFromUrl(u))
      .filter((k): k is string => Boolean(k));
    await deleteGalleryObjects(keys);
  } catch (error) {
    console.error("Failed to delete blog images", error);
  }
}

export async function createBlog() {
  const session = await requireAllowlisted({ redirectTo: "/not-allowlisted" });
  if (!session.studentId) redirect("/me?next=/blogs");

  const slug = await uniqueBlogSlug("untitled");
  const blog = await prisma.blog.create({
    data: { slug, title: "Untitled", authorId: session.studentId },
  });
  redirect(`/blogs/mine/${blog.id}`);
}

const saveSchema = z.object({
  id: z.string().uuid(),
  title: z
    .string()
    .trim()
    .max(BLOG_TITLE_MAX, `Title must be ${BLOG_TITLE_MAX} characters or fewer.`),
  excerpt: z
    .string()
    .trim()
    .max(
      BLOG_EXCERPT_MAX,
      `Description must be ${BLOG_EXCERPT_MAX} characters or fewer.`,
    ),
  coverImageUrl: z.string().trim().max(500),
  content: z
    .string()
    .min(1, "Missing editor content.")
    .max(CONTENT_MAX_CHARS, "This blog is too long to save."),
});

type SaveResult =
  | { ok: true; blog: { id: string; slug: string; status: PostStatus; publishedAt: Date | null } }
  | { ok: false; error: string };

/** Validate and persist the editor's fields. Shared by save and publish. */
async function persistBlog(formData: FormData): Promise<SaveResult> {
  const parsed = saveSchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title") ?? "",
    excerpt: formData.get("excerpt") ?? "",
    coverImageUrl: formData.get("coverImageUrl") ?? "",
    content: formData.get("content"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid blog." };
  }

  let content: unknown;
  try {
    content = JSON.parse(parsed.data.content);
  } catch {
    return { ok: false, error: "Invalid editor content." };
  }
  if (!Array.isArray(content)) {
    return { ok: false, error: "Invalid editor content." };
  }

  const cover = parsed.data.coverImageUrl || null;
  if (cover && !blogKeyFromUrl(cover)) {
    return { ok: false, error: "Upload the thumbnail again." };
  }

  const { blog } = await requireBlogEditor(parsed.data.id);
  if (!blog) return { ok: false, error: "Blog not found." };

  const updated = await prisma.blog.update({
    where: { id: blog.id },
    data: {
      title: parsed.data.title || "Untitled",
      excerpt: parsed.data.excerpt || null,
      coverImageUrl: cover,
      content: content as object[],
    },
    select: { id: true, slug: true, status: true, publishedAt: true },
  });

  if (blog.coverImageUrl && blog.coverImageUrl !== cover) {
    await deleteBlogObjects([blog.coverImageUrl]);
  }

  return { ok: true, blog: updated };
}

export async function saveBlog(
  _prev: BlogActionState,
  formData: FormData,
): Promise<BlogActionState> {
  const result = await persistBlog(formData);
  if (!result.ok) return result;
  revalidateBlogs(
    result.blog.status === PostStatus.PUBLISHED ? result.blog.slug : undefined,
  );
  return { ok: true, savedAt: new Date().toISOString() };
}

export async function publishBlog(
  _prev: BlogActionState,
  formData: FormData,
): Promise<BlogActionState> {
  const result = await persistBlog(formData);
  if (!result.ok) return result;

  const blog = await prisma.blog.findUniqueOrThrow({
    where: { id: result.blog.id },
  });
  // The edits above are saved even when publishing is refused below.
  const refuse = (error: string): BlogActionState => ({
    ok: false,
    error,
    savedAt: new Date().toISOString(),
  });
  if (blog.status === PostStatus.PUBLISHED) {
    return refuse("This blog is already published.");
  }
  if (!blog.title.trim() || blog.title === "Untitled") {
    return refuse("Add a title before publishing.");
  }
  if (!blog.excerpt?.trim()) {
    return refuse("Add a short description before publishing.");
  }
  if (!blog.coverImageUrl) {
    return refuse("Add a thumbnail before publishing.");
  }
  if (!hasBlogContent(blog.content)) {
    return refuse("Write something before publishing.");
  }

  // The slug is fixed at first publish so shared links keep working.
  const slug = blog.publishedAt
    ? blog.slug
    : await uniqueBlogSlug(blog.title, blog.id);

  await prisma.blog.update({
    where: { id: blog.id },
    data: {
      status: PostStatus.PUBLISHED,
      publishedAt: blog.publishedAt ?? new Date(),
      slug,
    },
  });

  revalidateBlogs(slug);
  redirect(`/blogs/${slug}`);
}

const idSchema = z.string().uuid();

export async function unpublishBlog(formData: FormData) {
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return;
  const { blog } = await requireBlogEditor(id.data);
  if (!blog) return;

  await prisma.blog.update({
    where: { id: blog.id },
    data: { status: PostStatus.DRAFT, starredAt: null },
  });
  revalidateBlogs(blog.slug);

  const next = String(formData.get("redirectTo") ?? "");
  if (next === "/blogs" || next === "/blogs/mine") redirect(next);
}

export async function deleteBlog(formData: FormData) {
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return;
  const { blog } = await requireBlogEditor(id.data);
  if (!blog) return;

  await prisma.blog.delete({ where: { id: blog.id } });
  await deleteBlogObjects([blog.coverImageUrl, ...collectBlockUrls(blog.content)]);
  revalidateBlogs(blog.slug);

  const next = String(formData.get("redirectTo") ?? "");
  if (next === "/blogs" || next === "/blogs/mine") redirect(next);
}

export async function toggleBlogStar(formData: FormData) {
  const session = await requireAllowlisted({ redirectTo: "/not-allowlisted" });
  if (!session.isMod) return;
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return;

  const blog = await prisma.blog.findUnique({
    where: { id: id.data },
    select: { id: true, slug: true, status: true, starredAt: true },
  });
  if (!blog || blog.status !== PostStatus.PUBLISHED) return;

  await prisma.blog.update({
    where: { id: blog.id },
    data: { starredAt: blog.starredAt ? null : new Date() },
  });
  revalidateBlogs(blog.slug);
}

export async function presignBlogImage(input: {
  contentType: string;
  sizeBytes: number;
}): Promise<
  | { ok: true; uploadUrl: string; publicUrl: string }
  | { ok: false; error: string }
> {
  const session = await requireAllowlisted({ redirectTo: "/not-allowlisted" });
  if (!session.studentId && !session.isMod) {
    return { ok: false, error: "Finish your profile before writing." };
  }
  const parsed = z
    .object({
      contentType: z.enum(BLOG_IMAGE_MIME_TYPES, {
        error: "Use a JPEG, PNG, WebP or GIF image.",
      }),
      sizeBytes: z
        .number()
        .int()
        .positive()
        .max(
          BLOG_IMAGE_MAX_BYTES,
          `Images must be under ${BLOG_IMAGE_MAX_BYTES / 1024 / 1024} MB.`,
        ),
    })
    .safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid image." };
  }

  try {
    const { uploadUrl, publicUrl } = await presignBlogImagePut({
      userId: session.id,
      ...parsed.data,
    });
    return { ok: true, uploadUrl, publicUrl };
  } catch (error) {
    console.error(error);
    return { ok: false, error: "Image uploads are not configured." };
  }
}

export type ReactionResult =
  | {
      ok: true;
      likes: number;
      dislikes: number;
      myReaction: ReactionType | null;
    }
  | { ok: false; error: string };

export async function setBlogReaction(
  blogId: string,
  type: ReactionType | null,
): Promise<ReactionResult> {
  const session = await ensureUser();
  if (!session) return { ok: false, error: "Sign in to react." };

  const parsed = z
    .object({
      blogId: z.string().uuid(),
      type: z.enum([ReactionType.LIKE, ReactionType.DISLIKE]).nullable(),
    })
    .safeParse({ blogId, type });
  if (!parsed.success) return { ok: false, error: "Invalid reaction." };

  const blog = await prisma.blog.findUnique({
    where: { id: parsed.data.blogId },
    select: { id: true, slug: true, status: true },
  });
  if (!blog || blog.status !== PostStatus.PUBLISHED) {
    return { ok: false, error: "Blog not found." };
  }

  const where = { blogId_userId: { blogId: blog.id, userId: session.id } };
  if (parsed.data.type) {
    await prisma.blogReaction.upsert({
      where,
      create: { blogId: blog.id, userId: session.id, type: parsed.data.type },
      update: { type: parsed.data.type },
    });
  } else {
    await prisma.blogReaction.deleteMany({
      where: { blogId: blog.id, userId: session.id },
    });
  }

  const counts = (await reactionCounts([blog.id])).get(blog.id)!;
  revalidatePath("/blogs");
  revalidatePath(`/blogs/${blog.slug}`);
  return { ok: true, ...counts, myReaction: parsed.data.type };
}

export async function addBlogComment(
  _prev: BlogActionState,
  formData: FormData,
): Promise<BlogActionState> {
  const session = await ensureUser();
  if (!session) return { ok: false, error: "Sign in to comment." };

  const parsed = z
    .object({
      blogId: z.string().uuid(),
      body: z
        .string()
        .trim()
        .min(1, "Write a comment first.")
        .max(
          BLOG_COMMENT_MAX,
          `Comments must be ${BLOG_COMMENT_MAX} characters or fewer.`,
        ),
    })
    .safeParse({ blogId: formData.get("blogId"), body: formData.get("body") });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid comment." };
  }

  const blog = await prisma.blog.findUnique({
    where: { id: parsed.data.blogId },
    select: { id: true, slug: true, status: true },
  });
  if (!blog || blog.status !== PostStatus.PUBLISHED) {
    return { ok: false, error: "Blog not found." };
  }

  await prisma.blogComment.create({
    data: { blogId: blog.id, userId: session.id, body: parsed.data.body },
  });
  revalidatePath("/blogs");
  revalidatePath(`/blogs/${blog.slug}`);
  return { ok: true, savedAt: new Date().toISOString() };
}

export async function deleteBlogComment(formData: FormData) {
  const session = await ensureUser();
  if (!session) return;
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return;

  const comment = await prisma.blogComment.findUnique({
    where: { id: id.data },
    select: {
      id: true,
      userId: true,
      blog: { select: { slug: true, authorId: true } },
    },
  });
  if (!comment) return;
  const allowed =
    comment.userId === session.id ||
    session.isMod ||
    (session.studentId !== null && comment.blog.authorId === session.studentId);
  if (!allowed) return;

  await prisma.blogComment.delete({ where: { id: comment.id } });
  revalidatePath("/blogs");
  revalidatePath(`/blogs/${comment.blog.slug}`);
}

/** Public: the next page of published blogs as the reader scrolls. */
export async function loadMoreBlogs(
  cursor: BlogCursor,
): Promise<{ blogs: BlogCardData[]; nextCursor: BlogCursor | null }> {
  const parsed = z
    .object({ publishedAt: z.string().datetime(), id: z.string().uuid() })
    .safeParse(cursor);
  if (!parsed.success) return { blogs: [], nextCursor: null };
  const [session, page] = await Promise.all([
    ensureUser(),
    listPublishedBlogs(parsed.data),
  ]);
  // Stars are internal: only mods may see which blogs are starred.
  if (session?.isMod) return page;
  return { ...page, blogs: page.blogs.map((b) => ({ ...b, starred: false })) };
}
