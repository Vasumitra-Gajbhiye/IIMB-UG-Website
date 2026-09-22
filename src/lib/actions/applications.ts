"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireMod } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uniqueStudentSlug } from "@/lib/slug";

export type ApplicationActionState = {
  ok: boolean;
  error?: string;
};

function refresh() {
  revalidatePath("/admin/students");
  revalidatePath("/admin/directory");
  revalidatePath("/admin/access");
  revalidatePath("/me");
}

export async function approveApplication(
  applicationId: string,
): Promise<ApplicationActionState> {
  const session = await requireMod();

  const application = await prisma.studentApplication.findUnique({
    where: { id: applicationId },
    include: { user: true },
  });
  if (!application) return { ok: false, error: "Application not found." };
  if (application.status === "APPROVED") {
    return { ok: false, error: "Already approved." };
  }

  const { name, track, batch, rollNumber, user } = application;

  try {
    const existing = await prisma.student.findUnique({
      where: { email: user.email },
    });
    const slug = existing?.slug ?? (await uniqueStudentSlug(name));

    const fields = { name, track, batch, rollNumber, email: user.email };

    await prisma.$transaction(async (tx) => {
      const student = existing
        ? await tx.student.update({ where: { id: existing.id }, data: fields })
        : await tx.student.create({ data: { ...fields, slug } });

      await tx.allowedEmail.upsert({
        where: { email: user.email },
        create: { email: user.email, role: "STUDENT" },
        update: { role: "STUDENT" },
      });

      await tx.user.update({
        where: { id: user.id },
        data: { studentId: student.id },
      });

      await tx.studentApplication.update({
        where: { id: applicationId },
        data: {
          status: "APPROVED",
          reviewedById: session.id,
          reviewedAt: new Date(),
          rejectReason: null,
        },
      });
    });
  } catch (err) {
    if ((err as { code?: string })?.code === "P2002") {
      return { ok: false, error: "That roll number is already in use." };
    }
    throw err;
  }

  refresh();
  return { ok: true };
}

const rejectSchema = z.object({
  applicationId: z.string().uuid(),
  reason: z.string().trim().max(500).optional(),
});

export async function rejectApplication(
  input: z.input<typeof rejectSchema>,
): Promise<ApplicationActionState> {
  const session = await requireMod();

  const parsed = rejectSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input." };

  const application = await prisma.studentApplication.findUnique({
    where: { id: parsed.data.applicationId },
  });
  if (!application) return { ok: false, error: "Application not found." };

  await prisma.studentApplication.update({
    where: { id: parsed.data.applicationId },
    data: {
      status: "REJECTED",
      reviewedById: session.id,
      reviewedAt: new Date(),
      rejectReason: parsed.data.reason || null,
    },
  });

  refresh();
  return { ok: true };
}
