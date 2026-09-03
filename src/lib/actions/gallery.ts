"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { GalleryItemKind } from "@/generated/prisma/client";
import { requireAllowlisted } from "@/lib/auth";
import {
  ALBUM_NAME_MAX_LENGTH,
  CAPTION_MAX_LENGTH,
  IMAGE_MAX_BYTES,
  MAX_ALBUM_DATE_SPANS,
  MAX_FILES_PER_POST,
  VIDEO_MAX_BYTES,
  checkFile,
  dateInputToTakenAt,
  extFromMime,
  isDateInput,
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

export type AlbumDateSpanInput = {
  startOn: string;
  endOn: string;
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

const spanSchema = z
  .object({
    startOn: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid start date."),
    endOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid end date."),
  })
  .refine((span) => span.endOn >= span.startOn, {
    message: "End date must be on or after the start date.",
  });

const albumNameSchema = z
  .string()
  .trim()
  .min(1, "Album name is required.")
  .max(
    ALBUM_NAME_MAX_LENGTH,
    `Name must be ${ALBUM_NAME_MAX_LENGTH} characters or fewer.`,
  );

function revalidateGallery(albumId?: string) {
  revalidatePath("/gallery");
  revalidatePath("/gallery/albums", "layout");
  revalidatePath("/admin/gallery");
  if (albumId) revalidatePath(`/gallery/albums/${albumId}`);
}

function takenAtToDay(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

function acceptGalleryItems(
  items: GalleryItemInput[],
  userId: string,
): z.infer<typeof itemSchema>[] {
  const accepted: z.infer<typeof itemSchema>[] = [];
  const prefix = `gallery/${userId}/`;

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
    if (!isDateInput(takenAtToDay(parsed.data.takenAt))) continue;

    const max =
      check.kind === "VIDEO" ? VIDEO_MAX_BYTES : IMAGE_MAX_BYTES;
    if (parsed.data.sizeBytes > max) continue;

    accepted.push(parsed.data);
  }

  return accepted;
}

function itemCreateData(item: z.infer<typeof itemSchema>) {
  return {
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
  };
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

  const accepted = acceptGalleryItems(items, session.id);

  if (accepted.length === 0) {
    return { ok: false, error: "No valid files to publish." };
  }

  try {
    await prisma.galleryPost.create({
      data: {
        authorId: session.id,
        items: {
          create: accepted.map((item) => itemCreateData(item)),
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

export async function createGalleryAlbum(input: {
  name: string;
  spans: AlbumDateSpanInput[];
  items: GalleryItemInput[];
}): Promise<GalleryActionState> {
  const session = await requireAllowlisted();

  const name = albumNameSchema.safeParse(input.name);
  if (!name.success) {
    return {
      ok: false,
      error: name.error.issues[0]?.message ?? "Album name is required.",
    };
  }

  if (input.spans.length === 0) {
    return { ok: false, error: "Add at least one date." };
  }
  if (input.spans.length > MAX_ALBUM_DATE_SPANS) {
    return {
      ok: false,
      error: `At most ${MAX_ALBUM_DATE_SPANS} date entries per album.`,
    };
  }

  const spans: AlbumDateSpanInput[] = [];
  for (const raw of input.spans) {
    const parsed = spanSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Invalid album dates.",
      };
    }
    spans.push(parsed.data);
  }

  if (input.items.length === 0) {
    return { ok: false, error: "Nothing uploaded successfully." };
  }
  if (input.items.length > MAX_FILES_PER_POST) {
    return {
      ok: false,
      error: `At most ${MAX_FILES_PER_POST} files per album.`,
    };
  }

  const accepted = acceptGalleryItems(input.items, session.id);
  if (accepted.length === 0) {
    return { ok: false, error: "No valid files to publish. Each file needs a date." };
  }

  try {
    const album = await prisma.galleryAlbum.create({
      data: {
        name: name.data,
        authorId: session.id,
        dateSpans: {
          create: spans.map((span) => ({
            startOn: dateInputToTakenAt(span.startOn),
            endOn: dateInputToTakenAt(span.endOn),
          })),
        },
        items: {
          create: accepted.map((item) => itemCreateData(item)),
        },
      },
    });
    revalidateGallery(album.id);
  } catch {
    try {
      await deleteGalleryObjects(accepted.map((item) => item.key));
    } catch {
      // Objects may remain in R2; they are unused without a DB row.
    }
    return { ok: false, error: "Could not save the album." };
  }

  return { ok: true };
}

export async function renameGalleryAlbum(
  id: string,
  name: string,
): Promise<GalleryActionState> {
  const session = await requireAllowlisted();
  const albumId = z.string().uuid().safeParse(id);
  if (!albumId.success) return { ok: false, error: "Invalid album." };

  const parsedName = albumNameSchema.safeParse(name);
  if (!parsedName.success) {
    return {
      ok: false,
      error: parsedName.error.issues[0]?.message ?? "Album name is required.",
    };
  }

  const album = await prisma.galleryAlbum.findUnique({
    where: { id: albumId.data },
    select: { id: true, authorId: true },
  });
  if (!album) return { ok: false, error: "Album not found." };
  if (album.authorId !== session.id && !session.isMod) {
    return { ok: false, error: "You cannot rename this album." };
  }

  await prisma.galleryAlbum.update({
    where: { id: album.id },
    data: { name: parsedName.data },
  });
  revalidateGallery(album.id);
  return { ok: true };
}

export async function deleteGalleryAlbum(
  _prev: GalleryActionState,
  formData: FormData,
): Promise<GalleryActionState> {
  const session = await requireAllowlisted();
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) return { ok: false, error: "Invalid album." };

  const album = await prisma.galleryAlbum.findUnique({
    where: { id: id.data },
    include: { items: { select: { key: true } } },
  });
  if (!album) return { ok: false, error: "Album not found." };
  if (album.authorId !== session.id && !session.isMod) {
    return { ok: false, error: "You cannot delete this album." };
  }

  try {
    await deleteGalleryObjects(album.items.map((item) => item.key));
  } catch {
    return { ok: false, error: "Could not remove files from storage." };
  }

  await prisma.galleryAlbum.delete({ where: { id: album.id } });
  revalidateGallery(album.id);
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
    include: {
      post: { select: { id: true, authorId: true } },
      album: { select: { id: true, authorId: true } },
    },
  });
  if (!item) return { ok: false, error: "Item not found." };

  const ownerId = item.post?.authorId ?? item.album?.authorId;
  if (!ownerId) return { ok: false, error: "Item not found." };
  if (ownerId !== session.id && !session.isMod) {
    return { ok: false, error: "You cannot delete this item." };
  }

  try {
    await deleteGalleryObjects([item.key]);
  } catch {
    return { ok: false, error: "Could not remove the file from storage." };
  }

  await prisma.galleryItem.delete({ where: { id: item.id } });

  if (item.postId) {
    const remaining = await prisma.galleryItem.count({
      where: { postId: item.postId },
    });
    if (remaining === 0) {
      await prisma.galleryPost.delete({ where: { id: item.postId } });
    }
  }

  revalidateGallery(item.albumId ?? undefined);
  return { ok: true };
}
