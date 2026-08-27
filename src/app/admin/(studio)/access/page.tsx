import type { Metadata } from "next";

import { AccessManager } from "@/components/admin/access-manager";
import {
  ensureEnvSuperAdminsInAllowlist,
  requireMod,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSuperAdminEmail } from "@/lib/super-admin";

export const metadata: Metadata = {
  title: "Access",
};

export default async function AdminAccessPage() {
  await requireMod();
  await ensureEnvSuperAdminsInAllowlist();

  const rows = await prisma.allowedEmail.findMany({
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });

  // Sort mods first, then by createdAt — Prisma enum order may not match intent
  const sorted = [...rows].sort((a, b) => {
    if (a.role !== b.role) {
      return a.role === "SUPER_ADMIN" ? -1 : 1;
    }
    return a.createdAt.getTime() - b.createdAt.getTime();
  });

  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold tracking-tight">
        Access
      </h1>
      <p className="mt-2 text-muted-foreground">
        Grant Studio entry (Student) or mod powers (Access + Directory).
        Hardcoded super-admin emails cannot be removed or demoted.
      </p>
      <div className="mt-8">
        <AccessManager
          rows={sorted.map((row) => ({
            id: row.id,
            email: row.email,
            role: row.role,
            createdAt: row.createdAt.toISOString(),
            locked: isSuperAdminEmail(row.email),
          }))}
        />
      </div>
    </div>
  );
}
