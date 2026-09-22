"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { Track } from "@/generated/prisma/client";
import { ensureUser } from "@/lib/auth";
import { BATCH_YEARS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { NAME_MAX_LENGTH, ROLL_NUMBER_MAX_LENGTH, testYearOptions } from "@/lib/profile";

export type OnboardingActionState =
  | { ok: true }
  | { ok: false; error: string; field?: string };

const nameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(NAME_MAX_LENGTH, `Name must be ${NAME_MAX_LENGTH} characters or fewer`);

const aspirantSchema = z.object({
  name: nameSchema,
  testYear: z
    .number()
    .int()
    .refine((y) => testYearOptions().includes(y), "Invalid year")
    .nullable(),
});

export type AspirantOnboardingInput = z.input<typeof aspirantSchema>;

export async function completeAspirantOnboarding(
  input: AspirantOnboardingInput,
): Promise<OnboardingActionState> {
  const session = await ensureUser();
  if (!session) return { ok: false, error: "Sign in to continue." };

  const parsed = aspirantSchema.safeParse(input);
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
    data: {
      name: parsed.data.name,
      testYear: parsed.data.testYear,
      applicantType: "ASPIRANT",
      onboardingCompleted: true,
    },
  });

  revalidatePath("/me");
  return { ok: true };
}

const studentApplicationSchema = z.object({
  name: nameSchema,
  rollNumber: z
    .string()
    .trim()
    .min(1, "Roll number is required")
    .max(
      ROLL_NUMBER_MAX_LENGTH,
      `Roll number must be ${ROLL_NUMBER_MAX_LENGTH} characters or fewer`,
    ),
  batch: z
    .number({ error: "Pick your batch year" })
    .int()
    .refine((y) => BATCH_YEARS.includes(y), "Invalid batch year"),
  track: z.enum([Track.DATA_SCIENCE, Track.ECONOMICS], {
    error: "Pick your course",
  }),
});

export type StudentApplicationInput = z.input<typeof studentApplicationSchema>;

/** Submits (or resubmits, after a rejection) a pending admitted-student application. */
export async function submitStudentApplication(
  input: StudentApplicationInput,
): Promise<OnboardingActionState> {
  const session = await ensureUser();
  if (!session) return { ok: false, error: "Sign in to continue." };

  const existingApplication = await prisma.studentApplication.findUnique({
    where: { userId: session.id },
    select: { status: true },
  });
  if (existingApplication?.status === "APPROVED") {
    return { ok: false, error: "Your application was already approved." };
  }

  const parsed = studentApplicationSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      ok: false,
      error: issue?.message ?? "Invalid input",
      field: String(issue?.path[0] ?? ""),
    };
  }
  const data = parsed.data;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: session.id },
      data: { applicantType: "ADMITTED_STUDENT", onboardingCompleted: true },
    }),
    prisma.studentApplication.upsert({
      where: { userId: session.id },
      create: { userId: session.id, ...data },
      update: {
        ...data,
        status: "PENDING",
        reviewedById: null,
        reviewedAt: null,
        rejectReason: null,
      },
    }),
  ]);

  revalidatePath("/me");
  revalidatePath("/admin/students");
  return { ok: true };
}

/**
 * Super-admin-only: clears the caller's own onboarding state (and any
 * pending/rejected application) so the onboarding flow can be re-tested
 * without deleting the Clerk account. Never touches Student/AllowedEmail
 * rows a prior approval already created.
 */
export async function resetOwnOnboarding(): Promise<OnboardingActionState> {
  const session = await ensureUser();
  if (!session?.isMod) return { ok: false, error: "Not allowed." };

  await prisma.$transaction([
    prisma.studentApplication.deleteMany({ where: { userId: session.id } }),
    prisma.user.update({
      where: { id: session.id },
      data: { onboardingCompleted: false, applicantType: null },
    }),
  ]);

  revalidatePath("/me");
  revalidatePath("/onboarding");
  return { ok: true };
}
