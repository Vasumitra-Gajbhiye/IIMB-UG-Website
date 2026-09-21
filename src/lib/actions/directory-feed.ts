"use server";

import {
  DIRECTORY_CHUNK_SIZE,
  DIRECTORY_PAGE_SIZE,
  listDirectoryStudents,
  type DirectoryFilters,
  type DirectoryStudent,
} from "@/lib/queries/directory";

/** Public: loads the next chunk of a directory page as the user scrolls. */
export async function loadDirectoryChunk(
  filters: DirectoryFilters,
  page: number,
  loaded: number,
): Promise<DirectoryStudent[]> {
  const safePage = Number.isInteger(page) && page > 0 ? page : 1;
  const safeLoaded = Number.isInteger(loaded) && loaded >= 0 ? loaded : 0;
  const remaining = DIRECTORY_PAGE_SIZE - safeLoaded;
  if (remaining <= 0) return [];

  return listDirectoryStudents(
    {
      q: String(filters.q ?? "").slice(0, 100),
      track: String(filters.track ?? ""),
      batch: String(filters.batch ?? ""),
    },
    (safePage - 1) * DIRECTORY_PAGE_SIZE + safeLoaded,
    Math.min(DIRECTORY_CHUNK_SIZE, remaining),
  );
}
