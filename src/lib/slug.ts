import { prisma } from "@/lib/prisma";
import { RESERVED_SLUGS, SLUG_MAX_LENGTH } from "@/lib/profile";

export function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return base || "proposal";
}

export async function uniqueProposalSlug(
  title: string,
  excludeId?: string,
): Promise<string> {
  const base = slugify(title);
  let slug = base;
  let n = 2;

  while (true) {
    const existing = await prisma.proposal.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!existing || existing.id === excludeId) return slug;
    slug = `${base}-${n}`;
    n += 1;
  }
}

/** Public profile slug from a name; avoids reserved words and collisions. */
export async function uniqueStudentSlug(
  name: string,
  excludeId?: string,
): Promise<string> {
  let base = slugify(name).slice(0, SLUG_MAX_LENGTH - 4);
  if (base.length < 3 || RESERVED_SLUGS.has(base)) base = `${base}-student`.replace(/^-/, "");
  let slug = base;
  let n = 2;

  while (true) {
    const existing = await prisma.student.findUnique({
      where: { slug },
      select: { id: true },
    });
    if ((!existing || existing.id === excludeId) && !RESERVED_SLUGS.has(slug)) {
      return slug;
    }
    slug = `${base}-${n}`;
    n += 1;
  }
}
