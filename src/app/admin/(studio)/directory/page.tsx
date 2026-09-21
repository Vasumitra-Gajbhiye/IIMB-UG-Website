import type { Metadata } from "next";
import Link from "next/link";

import { DirectoryTable } from "@/components/admin/directory-table";
import { ensureEnvSuperAdminsInAllowlist, requireMod } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Directory",
};

const PAGE_SIZE = 20;

type SearchParams = Promise<{ page?: string }>;

export default async function AdminDirectoryPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireMod();

  const params = await searchParams;
  const requested = Number.parseInt(params.page ?? "1", 10);
  const page = Number.isFinite(requested) && requested > 0 ? requested : 1;

  await ensureEnvSuperAdminsInAllowlist();

  // Only allowlisted people (students + mods) appear here — not every sign-up.
  const total = await prisma.allowedEmail.count();
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const skip = (currentPage - 1) * PAGE_SIZE;

  const allowed = await prisma.allowedEmail.findMany({
    orderBy: [{ createdAt: "asc" }, { email: "asc" }],
    take: PAGE_SIZE,
    skip,
  });
  const students = await prisma.student.findMany({
    where: { email: { in: allowed.map((a) => a.email) } },
    select: { email: true, name: true, track: true, batch: true },
  });
  const byEmail = new Map(students.map((s) => [s.email, s]));

  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold tracking-tight">
        Directory
      </h1>
      <p className="mt-2 text-muted-foreground">
        Students and mods on the allowlist. Edit name, course and batch; a
        student profile is created the first time you save a row.
      </p>

      <div className="mt-8">
        <DirectoryTable
          rows={allowed.map((a) => {
            const s = byEmail.get(a.email);
            return {
              email: a.email,
              isMod: a.role === "SUPER_ADMIN",
              name: s?.name ?? "",
              track: s?.track ?? "",
              batch: s?.batch ?? null,
            };
          })}
        />
      </div>

      {total > 0 ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <p>
            Page {currentPage} of {totalPages} · {total}{" "}
            {total === 1 ? "person" : "people"}
          </p>
          <div className="flex gap-2">
            {currentPage > 1 ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/directory?page=${currentPage - 1}`}>
                  Previous
                </Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
            )}
            {currentPage < totalPages ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/directory?page=${currentPage + 1}`}>
                  Next
                </Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" disabled>
                Next
              </Button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
