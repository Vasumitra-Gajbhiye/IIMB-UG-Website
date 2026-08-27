import type { Metadata } from "next";
import Link from "next/link";

import { requireMod } from "@/lib/auth";
import { TRACK_LABEL } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

  const total = await prisma.user.count();
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const skip = (currentPage - 1) * PAGE_SIZE;

  const users = await prisma.user.findMany({
    include: {
      student: { select: { name: true, track: true } },
    },
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE,
    skip,
  });

  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold tracking-tight">
        Directory
      </h1>
      <p className="mt-2 text-muted-foreground">
        Everyone who has signed up via Clerk. Name and course show{" "}
        <span className="font-medium text-foreground">—</span> until they link a
        student profile.
      </p>

      <div className="mt-8 rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Signed up</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground">
                  No one has signed up yet.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>{user.student?.name ?? "—"}</TableCell>
                  <TableCell>
                    {user.student
                      ? TRACK_LABEL[user.student.track]
                      : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.createdAt.toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {total > 0 ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <p>
            Page {currentPage} of {totalPages} · {total}{" "}
            {total === 1 ? "user" : "users"}
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
