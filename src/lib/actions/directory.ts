"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { Track } from "@/generated/prisma/client";
import { requireMod } from "@/lib/auth";
import { BATCH_YEARS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { uniqueStudentSlug } from "@/lib/slug";

export type DirectoryActionState = {
  ok: boolean;
  error?: string;
};

const changeSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  name: z.string().trim().min(1, "Name is required").max(100),
  track: z.enum([Track.DATA_SCIENCE, Track.ECONOMICS], {
    error: "Pick a course",
  }),
  batch: z
    .number()
    .int()
    .refine((y) => BATCH_YEARS.includes(y), "Invalid batch")
    .nullable(),
});

export type DirectoryChange = z.input<typeof changeSchema>;

export async function updateDirectoryRows(
  changes: DirectoryChange[],
): Promise<DirectoryActionState> {
  await requireMod();

  const parsed = z.array(changeSchema).safeParse(changes);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  for (const change of parsed.data) {
    // Only allowlisted people (students + mods) can be edited here
    const allowed = await prisma.allowedEmail.findUnique({
      where: { email: change.email },
      select: { id: true },
    });
    if (!allowed) {
      return { ok: false, error: `${change.email} is not on the allowlist.` };
    }

    const existing = await prisma.student.findUnique({
      where: { email: change.email },
      select: { id: true },
    });

    if (existing) {
      await prisma.student.update({
        where: { id: existing.id },
        data: { name: change.name, track: change.track, batch: change.batch },
      });
    } else {
      const student = await prisma.student.create({
        data: {
          email: change.email,
          name: change.name,
          track: change.track,
          batch: change.batch,
          slug: await uniqueStudentSlug(change.name),
        },
      });
      // Link an already signed-up user right away
      await prisma.user.updateMany({
        where: { email: change.email, studentId: null },
        data: { studentId: student.id },
      });
    }
  }

  revalidatePath("/admin/directory");
  return { ok: true };
}
