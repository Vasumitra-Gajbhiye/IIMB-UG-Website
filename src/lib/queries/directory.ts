import { Track } from "@/generated/prisma/client";
import type { Prisma } from "@/generated/prisma/client";
import { BATCH_YEARS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export const DIRECTORY_PAGE_SIZE = 80;
export const DIRECTORY_CHUNK_SIZE = 20;

export type DirectoryFilters = {
  q?: string;
  track?: string;
  batch?: string;
};

export type DirectoryStudent = {
  id: string;
  slug: string;
  name: string;
  track: Track;
  batch: number | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  instagramUrl: string | null;
  twitterUrl: string | null;
  websiteUrl: string | null;
};

const select = {
  id: true,
  slug: true,
  name: true,
  track: true,
  batch: true,
  avatarUrl: true,
  bannerUrl: true,
  linkedinUrl: true,
  githubUrl: true,
  instagramUrl: true,
  twitterUrl: true,
  websiteUrl: true,
} satisfies Prisma.StudentSelect;

/** Students with access (allowlisted) who haven't hidden their profile. */
async function buildWhere(
  filters: DirectoryFilters,
): Promise<Prisma.StudentWhereInput> {
  const allowed = await prisma.allowedEmail.findMany({
    select: { email: true },
  });

  const where: Prisma.StudentWhereInput = {
    isListed: true,
    email: { in: allowed.map((a) => a.email) },
  };

  const q = filters.q?.trim();
  if (q) where.name = { contains: q, mode: "insensitive" };

  if (filters.track === Track.DATA_SCIENCE || filters.track === Track.ECONOMICS) {
    where.track = filters.track;
  }

  const batch = Number.parseInt(filters.batch ?? "", 10);
  if (BATCH_YEARS.includes(batch)) where.batch = batch;

  return where;
}

/** Total matches plus one 80-student page. */
export async function countDirectoryStudents(filters: DirectoryFilters) {
  return prisma.student.count({ where: await buildWhere(filters) });
}

/** A slice of the filtered list; offset/limit are relative to the whole result. */
export async function listDirectoryStudents(
  filters: DirectoryFilters,
  offset: number,
  limit: number,
): Promise<DirectoryStudent[]> {
  return prisma.student.findMany({
    where: await buildWhere(filters),
    orderBy: [{ name: "asc" }, { id: "asc" }],
    skip: offset,
    take: limit,
    select,
  });
}
