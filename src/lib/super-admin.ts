import { SUPER_ADMIN_EMAIL } from "@/lib/constants";

/** Parse SUPER_ADMIN_EMAILS (comma-separated). Falls back to SUPER_ADMIN_EMAIL constant. */
export function getSuperAdminEmails(): string[] {
  const raw = process.env.SUPER_ADMIN_EMAILS?.trim();
  if (!raw) return [SUPER_ADMIN_EMAIL.toLowerCase()];
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isSuperAdminEmail(email: string): boolean {
  return getSuperAdminEmails().includes(email.trim().toLowerCase());
}
