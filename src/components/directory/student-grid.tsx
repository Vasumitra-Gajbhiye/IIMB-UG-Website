"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { StudentCard } from "@/components/directory/student-card";
import { loadDirectoryChunk } from "@/lib/actions/directory-feed";
import type {
  DirectoryFilters,
  DirectoryStudent,
} from "@/lib/queries/directory";

type Props = {
  initial: DirectoryStudent[];
  /** How many students this page holds in total (max 80). */
  pageTotal: number;
  page: number;
  filters: DirectoryFilters;
};

/** Remount with a `key` when filters or page change to reset state. */
export function StudentGrid({ initial, pageTotal, page, filters }: Props) {
  const [students, setStudents] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);
  const busy = useRef(false);

  const done = students.length >= pageTotal;

  const loadMore = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    setFailed(false);
    try {
      const next = await loadDirectoryChunk(filters, page, students.length);
      setStudents((prev) => {
        const seen = new Set(prev.map((s) => s.id));
        return [...prev, ...next.filter((s) => !seen.has(s.id))];
      });
    } catch {
      setFailed(true);
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }, [filters, page, students.length]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || done || failed) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMore();
      },
      { rootMargin: "400px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [done, failed, loadMore]);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {students.map((s) => (
          <StudentCard key={s.id} student={s} />
        ))}
      </div>
      {!done ? (
        <div
          ref={sentinel}
          className="py-8 text-center text-sm text-muted-foreground"
        >
          {failed ? (
            <button
              type="button"
              onClick={() => void loadMore()}
              className="underline underline-offset-4"
            >
              Couldn&apos;t load more. Retry
            </button>
          ) : loading ? (
            "Loading…"
          ) : null}
        </div>
      ) : null}
    </>
  );
}
