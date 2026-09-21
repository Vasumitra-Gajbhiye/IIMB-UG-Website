"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { Role } from "@/generated/prisma/client";
import { requireMod } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSuperAdminEmail } from "@/lib/super-admin";

const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("Enter a valid email")
  .transform((v) => v.toLowerCase());

const roleSchema = z.enum([Role.STUDENT, Role.SUPER_ADMIN]);

export type AccessActionState = {
  ok: boolean;
  error?: string;
};

export async function addAllowedEmail(
  _prev: AccessActionState,
  formData: FormData,
): Promise<AccessActionState> {
  await requireMod();

  const parsed = z
    .object({
      email: emailSchema,
      role: roleSchema.default(Role.STUDENT),
    })
    .safeParse({
      email: formData.get("email"),
      role: formData.get("role") || Role.STUDENT,
    });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const { email, role } = parsed.data;

  // Env super-admins always stay SUPER_ADMIN even if form says STUDENT
  const finalRole = isSuperAdminEmail(email) ? Role.SUPER_ADMIN : role;

  try {
    await prisma.allowedEmail.upsert({
      where: { email },
      create: { email, role: finalRole },
      update: { role: finalRole },
    });
  } catch {
    return { ok: false, error: "Could not save that email." };
  }

  // Keep User.role in sync if they already signed up
  await prisma.user.updateMany({
    where: { email },
    data: { role: finalRole },
  });

  revalidatePath("/admin/access");
  revalidatePath("/admin");
  return { ok: true };
}

export async function updateAllowedEmailRoles(
  changes: { id: string; role: string }[],
): Promise<AccessActionState> {
  await requireMod();

  const parsed = z
    .array(z.object({ id: z.string().uuid(), role: roleSchema }))
    .safeParse(changes);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  for (const change of parsed.data) {
    const row = await prisma.allowedEmail.findUnique({
      where: { id: change.id },
    });
    if (!row) return { ok: false, error: "Row not found." };

    if (isSuperAdminEmail(row.email)) {
      return {
        ok: false,
        error: "Hardcoded super-admin emails cannot be demoted.",
      };
    }

    await prisma.allowedEmail.update({
      where: { id: row.id },
      data: { role: change.role },
    });

    await prisma.user.updateMany({
      where: { email: row.email },
      data: { role: change.role },
    });
  }

  revalidatePath("/admin/access");
  revalidatePath("/admin");
  return { ok: true };
}

export async function removeAllowedEmail(
  _prev: AccessActionState,
  formData: FormData,
): Promise<AccessActionState> {
  await requireMod();

  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) return { ok: false, error: "Invalid id." };

  const row = await prisma.allowedEmail.findUnique({
    where: { id: id.data },
  });
  if (!row) return { ok: false, error: "Row not found." };

  if (isSuperAdminEmail(row.email)) {
    return {
      ok: false,
      error: "Hardcoded super-admin emails cannot be removed.",
    };
  }

  await prisma.allowedEmail.delete({ where: { id: row.id } });

  // Demote existing User to STUDENT (they lose allowlist; next gate fails)
  await prisma.user.updateMany({
    where: { email: row.email },
    data: { role: Role.STUDENT },
  });

  revalidatePath("/admin/access");
  revalidatePath("/admin");
  return { ok: true };
}
