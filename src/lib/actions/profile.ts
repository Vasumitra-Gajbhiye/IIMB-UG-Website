"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { Track } from "@/generated/prisma/client";
import { ensureUser, requireAllowlisted } from "@/lib/auth";
import { BATCH_YEARS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import {
  BIO_MAX_LENGTH,
  NAME_MAX_LENGTH,
  PROFILE_IMAGE_MIME_TYPES,
  PROFILE_IMAGE_SPECS,
  SOCIAL_META,
  normalizeSocial,
  testYearOptions,
  validateSlug,
  type SocialKind,
} from "@/lib/profile";
import {
  deleteGalleryObjects,
  presignProfileImagePut,
  profileKeyFromUrl,
} from "@/lib/r2";
import { uniqueStudentSlug } from "@/lib/slug";

export type ProfileActionState =
  | { ok: true; slug?: string }
  | { ok: false; error: string; field?: string };

const nameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(NAME_MAX_LENGTH, `Name must be ${NAME_MAX_LENGTH} characters or fewer`);

const socialField = (kind: SocialKind) =>
  z
    .string()
    .max(200)
    .transform((raw, ctx) => {
      const value = normalizeSocial(kind, raw);
      if (value === undefined) {
        ctx.addIssue({
          code: "custom",
          message: `Enter a valid ${SOCIAL_META[kind].label} link or handle`,
        });
        return z.NEVER;
      }
      return value;
    });

const imageUrlField = z.string().url().max(500).nullable();

const studentSchema = z.object({
  name: nameSchema,
  track: z.enum([Track.DATA_SCIENCE, Track.ECONOMICS], {
    error: "Pick your course",
  }),
  batch: z
    .number({ error: "Pick your batch year" })
    .int()
    .refine((y) => BATCH_YEARS.includes(y), "Invalid batch year"),
  slug: z.string().trim().toLowerCase(),
  bio: z
    .string()
    .trim()
    .max(BIO_MAX_LENGTH, `Bio must be ${BIO_MAX_LENGTH} characters or fewer`),
  instagram: socialField("instagram"),
  linkedin: socialField("linkedin"),
  github: socialField("github"),
  avatarUrl: imageUrlField,
  bannerUrl: imageUrlField,
});

export type StudentProfileInput = z.input<typeof studentSchema>;

export async function presignProfileImage(input: {
  kind: "avatar" | "banner";
  contentType: string;
  sizeBytes: number;
}): Promise<
  | { ok: true; uploadUrl: string; publicUrl: string }
  | { ok: false; error: string }
> {
  const session = await ensureUser();
  if (!session) return { ok: false, error: "Sign in to upload images." };

  const spec = PROFILE_IMAGE_SPECS[input.kind as keyof typeof PROFILE_IMAGE_SPECS];
  if (!spec) return { ok: false, error: "Unknown image type." };
  if (!(PROFILE_IMAGE_MIME_TYPES as readonly string[]).includes(input.contentType)) {
    return { ok: false, error: "Use a JPG, PNG or WebP image." };
  }
  if (!Number.isInteger(input.sizeBytes) || input.sizeBytes <= 0) {
    return { ok: false, error: "Invalid file." };
  }
  // The client uploads a cropped re-encode, which is always well under the
  // original-file limit; enforce the same ceiling here.
  if (input.sizeBytes > spec.maxBytes) {
    return { ok: false, error: "That image is too large." };
  }

  try {
    const { uploadUrl, publicUrl } = await presignProfileImagePut({
      userId: session.id,
      kind: input.kind,
      contentType: input.contentType,
      sizeBytes: input.sizeBytes,
    });
    return { ok: true, uploadUrl, publicUrl };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not prepare upload.",
    };
  }
}

/** Only accept image URLs we minted for this user (or keep what's stored). */
function ownsImage(url: string | null, userId: string, current: string | null) {
  if (url === null || url === current) return true;
  try {
    return profileKeyFromUrl(url, userId) !== null;
  } catch {
    return false;
  }
}

async function cleanupReplaced(
  userId: string,
  pairs: { before: string | null; after: string | null }[],
) {
  const keys: string[] = [];
  for (const { before, after } of pairs) {
    if (!before || before === after) continue;
    try {
      const key = profileKeyFromUrl(before, userId);
      if (key) keys.push(key);
    } catch {
      // R2 not configured — nothing to clean.
    }
  }
  if (keys.length === 0) return;
  try {
    await deleteGalleryObjects(keys);
  } catch {
    // Best effort; an orphaned object is harmless.
  }
}

export async function saveStudentProfile(
  input: StudentProfileInput,
): Promise<ProfileActionState> {
  const session = await requireAllowlisted({ redirectTo: "/me" });

  const parsed = studentSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      ok: false,
      error: issue?.message ?? "Invalid input",
      field: String(issue?.path[0] ?? ""),
    };
  }
  const data = parsed.data;

  const existing = await prisma.student.findUnique({
    where: { email: session.email },
  });

  let slug = data.slug;
  if (!slug) {
    slug = await uniqueStudentSlug(data.name, existing?.id);
  } else {
    const problem = validateSlug(slug);
    if (problem) return { ok: false, error: problem, field: "slug" };
    const taken = await prisma.student.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (taken && taken.id !== existing?.id) {
      return { ok: false, error: "That username is already taken.", field: "slug" };
    }
  }

  for (const [field, url, current] of [
    ["avatarUrl", data.avatarUrl, existing?.avatarUrl ?? null],
    ["bannerUrl", data.bannerUrl, existing?.bannerUrl ?? null],
  ] as const) {
    if (!ownsImage(url, session.id, current)) {
      return { ok: false, error: "Invalid image.", field };
    }
  }

  const fields = {
    name: data.name,
    track: data.track,
    batch: data.batch,
    slug,
    bio: data.bio || null,
    instagramUrl: data.instagram,
    linkedinUrl: data.linkedin,
    githubUrl: data.github,
    avatarUrl: data.avatarUrl,
    bannerUrl: data.bannerUrl,
  };

  if (existing) {
    await prisma.student.update({ where: { id: existing.id }, data: fields });
  } else {
    const created = await prisma.student.create({
      data: { ...fields, email: session.email },
    });
    await prisma.user.update({
      where: { id: session.id },
      data: { studentId: created.id },
    });
  }

  await cleanupReplaced(session.id, [
    { before: existing?.avatarUrl ?? null, after: data.avatarUrl },
    { before: existing?.bannerUrl ?? null, after: data.bannerUrl },
  ]);

  revalidatePath("/me");
  revalidatePath(`/${slug}`);
  if (existing && existing.slug !== slug) revalidatePath(`/${existing.slug}`);
  revalidatePath("/admin/directory");
  return { ok: true, slug };
}

const guestSchema = z.object({
  name: nameSchema,
  testYear: z
    .number({ error: "Pick the year you'll appear for the test" })
    .int()
    .refine((y) => testYearOptions().includes(y), "Invalid year"),
});

export type GuestProfileInput = z.input<typeof guestSchema>;

export async function saveGuestProfile(
  input: GuestProfileInput,
): Promise<ProfileActionState> {
  const session = await ensureUser();
  if (!session) return { ok: false, error: "Sign in to save your profile." };
  if (session.isAllowlisted) {
    return { ok: false, error: "Use the student profile form." };
  }

  const parsed = guestSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      ok: false,
      error: issue?.message ?? "Invalid input",
      field: String(issue?.path[0] ?? ""),
    };
  }

  await prisma.user.update({
    where: { id: session.id },
    data: { name: parsed.data.name, testYear: parsed.data.testYear },
  });

  revalidatePath("/me");
  return { ok: true };
}
