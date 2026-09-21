import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { DirectoryFilters } from "@/components/directory/directory-filters";
import { StudentGrid } from "@/components/directory/student-grid";
import { Button } from "@/components/ui/button";
import {
  DIRECTORY_CHUNK_SIZE,
  DIRECTORY_PAGE_SIZE,
  countDirectoryStudents,
  listDirectoryStudents,
} from "@/lib/queries/directory";

export const metadata: Metadata = {
  title: "Directory",
};

type SearchParams = Promise<{
  q?: string;
  track?: string;
  batch?: string;
  page?: string;
}>;

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const filters = {
    q: params.q?.slice(0, 100),
    track: params.track,
    batch: params.batch,
  };

  const total = await countDirectoryStudents(filters);
  const totalPages = Math.max(1, Math.ceil(total / DIRECTORY_PAGE_SIZE));
  const requested = Number.parseInt(params.page ?? "1", 10);
  const page = Math.min(
    Number.isFinite(requested) && requested > 0 ? requested : 1,
    totalPages,
  );
  const pageTotal = Math.min(
    DIRECTORY_PAGE_SIZE,
    total - (page - 1) * DIRECTORY_PAGE_SIZE,
  );

  const initial = await listDirectoryStudents(
    filters,
    (page - 1) * DIRECTORY_PAGE_SIZE,
    Math.min(DIRECTORY_CHUNK_SIZE, pageTotal),
  );

  const pageHref = (p: number) => {
    const next = new URLSearchParams();
    if (params.q) next.set("q", params.q);
    if (params.track) next.set("track", params.track);
    if (params.batch) next.set("batch", params.batch);
    if (p > 1) next.set("page", String(p));
    const qs = next.toString();
    return qs ? `/directory?${qs}` : "/directory";
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="font-serif text-3xl font-semibold tracking-tight">
        Directory
      </h1>
      <p className="mt-2 text-muted-foreground">
        {total} {total === 1 ? "student" : "students"}
      </p>

      <div className="mt-6">
        <Suspense>
          <DirectoryFilters />
        </Suspense>
      </div>

      <div className="mt-6">
        {total === 0 ? (
          <p className="py-16 text-center text-muted-foreground">
            No students match these filters.
          </p>
        ) : (
          <StudentGrid
            key={`${page}|${params.q ?? ""}|${params.track ?? ""}|${params.batch ?? ""}`}
            initial={initial}
            pageTotal={pageTotal}
            page={page}
            filters={filters}
          />
        )}
      </div>

      {totalPages > 1 ? (
        <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
          <p>
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild={page > 1} disabled={page <= 1}>
              {page > 1 ? <Link href={pageHref(page - 1)}>Previous</Link> : "Previous"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              asChild={page < totalPages}
              disabled={page >= totalPages}
            >
              {page < totalPages ? <Link href={pageHref(page + 1)}>Next</Link> : "Next"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
