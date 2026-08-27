import type { Metadata } from "next";
import Link from "next/link";

import { requireAllowlisted } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Studio",
};

export default async function AdminDashboardPage() {
  const session = await requireAllowlisted();

  if (!session.isMod) {
    return (
      <div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight">
          Studio
        </h1>
        <p className="mt-2 text-muted-foreground">
          Student tools (profile editor, writing) will land here later. You are
          allowlisted as{" "}
          <span className="font-medium text-foreground">{session.email}</span>.
        </p>
      </div>
    );
  }

  const [allowlistedCount, signedUpCount] = await Promise.all([
    prisma.allowedEmail.count(),
    prisma.user.count(),
  ]);

  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold tracking-tight">
        Studio
      </h1>
      <p className="mt-2 text-muted-foreground">
        Signed in as{" "}
        <span className="font-medium text-foreground">{session.email}</span>{" "}
        (mod).
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/access"
          className="rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/40"
        >
          <p className="text-sm text-muted-foreground">Allowlisted emails</p>
          <p className="mt-1 font-serif text-3xl font-semibold tabular-nums">
            {allowlistedCount}
          </p>
          <p className="mt-2 text-sm text-primary">Manage Access →</p>
        </Link>
        <Link
          href="/admin/directory"
          className="rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/40"
        >
          <p className="text-sm text-muted-foreground">Signed-up users</p>
          <p className="mt-1 font-serif text-3xl font-semibold tabular-nums">
            {signedUpCount}
          </p>
          <p className="mt-2 text-sm text-primary">Open Directory →</p>
        </Link>
      </div>
    </div>
  );
}
