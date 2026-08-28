"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { GalleryItemKind } from "@/generated/prisma/client";
import { requireAllowlisted } from "@/lib/auth";
import {
  CAPTION_MAX_LENGTH,
  IMAGE_MAX_BYTES,
  MAX_FILES_PER_POST,
  VIDEO_MAX_BYTES,
  checkFile,
  extFromMime,
  isHeicMime,
} from "@/lib/gallery";
import { prisma } from "@/lib/prisma";
import { deleteGalleryObjects, presignGalleryPut, publicUrlForKey } from "@/lib/r2";

export type GalleryActionState = {
  ok: boolean;
  error?: string;
};

export type PresignRequest = {
  contentType: string;
  sizeBytes: number;
};

export type PresignResult = {
  key: string;
  uploadUrl: string;
  publicUrl: string;
};

export type GalleryItemInput = {
  key: string;
  url: string;
  contentType: string;
  sizeBytes: number;
  width?: number | null;
  height?: number | null;
  caption?: string | null;
  takenAt: string;
  sortOrder: number;
  kind: "IMAGE" | "VIDEO";
};

const presignSchema = z.object({
  files: z
    .array(
      z.object({
        contentType: z.string().min(1),
        sizeBytes: z.number().int().positive(),
      }),
    )
    .min(1, "Add at least one file.")
    .max(MAX_FILES_PER_POST, `At most ${MAX_FILES_PER_POST} files per post.`),
});

const itemSchema = z.object({
  key: z.string().min(1),
  url: z.string().url(),
  contentType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
  width: z.number().int().positive().nullable().optional(),
  height: z.number().int().positive().nullable().optional(),
  caption: z.string().trim().max(CAPTION_MAX_LENGTH).nullable().optional(),
  takenAt: z.string().min(1),
  sortOrder: z.number().int().min(0),
  kind: z.enum(["IMAGE", "VIDEO"]),
});

function revalidateGallery() {
  revalidatePath("/gallery");
  revalidatePath("/admin/gallery");
}

export async function presignGalleryUploads(
  files: PresignRequest[],
): Promise<{ ok: true; uploads: PresignResult[] } | { ok: false; error: string }> {
  const session = await requireAllowlisted();
  const parsed = presignSchema.safeParse({ files });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid files.",
    };
  }

  const uploads: PresignResult[] = [];
  for (const file of parsed.data.files) {
    const check = checkFile({
      name: `upload.${extFromMime(file.contentType) ?? "bin"}`,
      type: file.contentType,
      size: file.sizeBytes,
    });
    if (!check.ok) {
      return { ok: false, error: check.error };
    }
    if (isHeicMime(file.contentType)) {
      return {
        ok: false,
        error: "Convert HEIC photos to JPEG before uploading.",
      };
    }
    try {
      uploads.push(
        await presignGalleryPut({
          userId: session.id,
          contentType: check.contentType,
          sizeBytes: file.sizeBytes,
        }),
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not prepare upload.";
      return { ok: false, error: message };
    }
  }

  return { ok: true, uploads };
}

export async function createGalleryPost(
  items: GalleryItemInput[],
): Promise<GalleryActionState> {
  const session = await requireAllowlisted();

  if (items.length === 0) {
    return { ok: false, error: "Nothing uploaded successfully." };
  }
  if (items.length > MAX_FILES_PER_POST) {
    return {
      ok: false,
      error: `At most ${MAX_FILES_PER_POST} files per post.`,
    };
  }

  const accepted: z.infer<typeof itemSchema>[] = [];
  const prefix = `gallery/${session.id}/`;

  for (const raw of items) {
    const parsed = itemSchema.safeParse(raw);
    if (!parsed.success) continue;

    const check = checkFile({
      name: `upload.${extFromMime(parsed.data.contentType) ?? "bin"}`,
      type: parsed.data.contentType,
      size: parsed.data.sizeBytes,
    });
    if (!check.ok) continue;
    if (isHeicMime(parsed.data.contentType)) continue;
    if (check.kind !== parsed.data.kind) continue;
    if (!parsed.data.key.startsWith(prefix)) continue;

    try {
      if (parsed.data.url !== publicUrlForKey(parsed.data.key)) continue;
    } catch {
      continue;
    }

    const takenAt = new Date(parsed.data.takenAt);
    if (Number.isNaN(takenAt.getTime())) continue;

    const max =
      check.kind === "VIDEO" ? VIDEO_MAX_BYTES : IMAGE_MAX_BYTES;
    if (parsed.data.sizeBytes > max) continue;

    accepted.push(parsed.data);
  }

  if (accepted.length === 0) {
    return { ok: false, error: "No valid files to publish." };
  }

  try {
    await prisma.galleryPost.create({
      data: {
        authorId: session.id,
        items: {
          create: accepted.map((item) => ({
            kind:
              item.kind === "VIDEO"
                ? GalleryItemKind.VIDEO
                : GalleryItemKind.IMAGE,
            key: item.key,
            url: item.url,
            contentType: item.contentType,
            sizeBytes: item.sizeBytes,
            width: item.width ?? null,
            height: item.height ?? null,
            caption: item.caption?.trim() || null,
            takenAt: new Date(item.takenAt),
            sortOrder: item.sortOrder,
          })),
        },
      },
    });
  } catch {
    try {
      await deleteGalleryObjects(accepted.map((item) => item.key));
    } catch {
      // Objects may remain in R2; they are unused without a DB row.
    }
    return { ok: false, error: "Could not save the gallery post." };
  }

  revalidateGallery();
  return { ok: true };
}

export async function deleteGalleryPost(
  _prev: GalleryActionState,
  formData: FormData,
): Promise<GalleryActionState> {
  const session = await requireAllowlisted();
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) return { ok: false, error: "Invalid post." };

  const post = await prisma.galleryPost.findUnique({
    where: { id: id.data },
    include: { items: { select: { key: true } } },
  });
  if (!post) return { ok: false, error: "Post not found." };
  if (post.authorId !== session.id && !session.isMod) {
    return { ok: false, error: "You cannot delete this post." };
  }

  try {
    await deleteGalleryObjects(post.items.map((item) => item.key));
  } catch {
    return { ok: false, error: "Could not remove files from storage." };
  }

  await prisma.galleryPost.delete({ where: { id: post.id } });
  revalidateGallery();
  return { ok: true };
}

export async function deleteGalleryItem(
  _prev: GalleryActionState,
  formData: FormData,
): Promise<GalleryActionState> {
  const session = await requireAllowlisted();
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) return { ok: false, error: "Invalid item." };

  const item = await prisma.galleryItem.findUnique({
    where: { id: id.data },
    include: { post: { select: { id: true, authorId: true } } },
  });
  if (!item) return { ok: false, error: "Item not found." };
  if (item.post.authorId !== session.id && !session.isMod) {
    return { ok: false, error: "You cannot delete this item." };
  }

  try {
    await deleteGalleryObjects([item.key]);
  } catch {
    return { ok: false, error: "Could not remove the file from storage." };
  }

  await prisma.galleryItem.delete({ where: { id: item.id } });

  const remaining = await prisma.galleryItem.count({
    where: { postId: item.post.id },
  });
  if (remaining === 0) {
    await prisma.galleryPost.delete({ where: { id: item.post.id } });
  }

  revalidateGallery();
  return { ok: true };
}
