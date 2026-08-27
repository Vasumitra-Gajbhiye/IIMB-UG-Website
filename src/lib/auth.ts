import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { Role } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getSuperAdminEmails, isSuperAdminEmail } from "@/lib/super-admin";

export type SessionUser = {
  id: string;
  clerkId: string;
  email: string;
  role: Role;
  studentId: string | null;
  isMod: boolean;
  isAllowlisted: boolean;
};

function primaryEmailFromClerk(user: {
  primaryEmailAddress?: { emailAddress: string } | null;
  emailAddresses: { emailAddress: string }[];
}): string | null {
  const raw =
    user.primaryEmailAddress?.emailAddress ??
    user.emailAddresses[0]?.emailAddress ??
    null;
  return raw ? raw.trim().toLowerCase() : null;
}

async function resolveRole(email: string): Promise<Role> {
  if (isSuperAdminEmail(email)) return Role.SUPER_ADMIN;
  const allowed = await prisma.allowedEmail.findUnique({
    where: { email },
    select: { role: true },
  });
  return allowed?.role ?? Role.STUDENT;
}

async function resolveStudentId(email: string): Promise<string | null> {
  const student = await prisma.student.findUnique({
    where: { email },
    select: { id: true },
  });
  return student?.id ?? null;
}

export async function isEmailAllowlisted(email: string): Promise<boolean> {
  if (isSuperAdminEmail(email)) return true;
  const row = await prisma.allowedEmail.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { id: true },
  });
  return Boolean(row);
}

/**
 * Upsert Prisma User from the current Clerk session.
 * Call from /me and gated admin layouts so Directory sees sign-ups without a webhook.
 */
export async function ensureUser(): Promise<SessionUser | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email = primaryEmailFromClerk(clerkUser);
  if (!email) return null;

  const role = await resolveRole(email);
  const studentId = await resolveStudentId(email);

  const user = await prisma.user.upsert({
    where: { clerkId: userId },
    create: {
      clerkId: userId,
      email,
      role,
      studentId,
    },
    update: {
      email,
      role,
      ...(studentId ? { studentId } : {}),
    },
  });

  const allowlisted = await isEmailAllowlisted(email);

  return {
    id: user.id,
    clerkId: user.clerkId,
    email: user.email,
    role: user.role,
    studentId: user.studentId,
    isMod: user.role === Role.SUPER_ADMIN || isSuperAdminEmail(email),
    isAllowlisted: allowlisted,
  };
}

/**
 * Sync a Clerk webhook user payload into Prisma (create/update).
 */
export async function syncUserFromClerk(data: {
  id: string;
  email_addresses: { id: string; email_address: string }[];
  primary_email_address_id: string | null;
}): Promise<void> {
  const primary =
    data.email_addresses.find((e) => e.id === data.primary_email_address_id) ??
    data.email_addresses[0];
  if (!primary) return;

  const email = primary.email_address.trim().toLowerCase();
  const role = await resolveRole(email);
  const studentId = await resolveStudentId(email);

  await prisma.user.upsert({
    where: { clerkId: data.id },
    create: {
      clerkId: data.id,
      email,
      role,
      studentId,
    },
    update: {
      email,
      role,
      ...(studentId ? { studentId } : {}),
    },
  });
}

export async function deleteUserByClerkId(clerkId: string): Promise<void> {
  await prisma.user.deleteMany({ where: { clerkId } });
}

/** Require sign-in + allowlist. Redirects to forbidden if not allowlisted. */
export async function requireAllowlisted(): Promise<SessionUser> {
  const session = await ensureUser();
  if (!session) redirect("/sign-in");
  if (!session.isAllowlisted) redirect("/admin/forbidden");
  return session;
}

/** Require mod (SUPER_ADMIN). Non-mods redirect to /admin. */
export async function requireMod(): Promise<SessionUser> {
  const session = await requireAllowlisted();
  if (!session.isMod) redirect("/admin");
  return session;
}

/** Ensure env super-admins exist as AllowedEmail rows (display + seed safety). */
export async function ensureEnvSuperAdminsInAllowlist(): Promise<void> {
  const emails = getSuperAdminEmails();
  await Promise.all(
    emails.map((email) =>
      prisma.allowedEmail.upsert({
        where: { email },
        create: { email, role: Role.SUPER_ADMIN },
        update: { role: Role.SUPER_ADMIN },
      }),
    ),
  );
}
