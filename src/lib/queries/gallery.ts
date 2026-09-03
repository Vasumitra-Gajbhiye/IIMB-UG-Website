import { prisma } from "@/lib/prisma";

const authorSelect = {
  student: { select: { name: true, slug: true, isListed: true } },
} as const;

const itemOrder = { orderBy: { sortOrder: "asc" as const } };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function listPublicGalleryItems() {
  return prisma.galleryItem.findMany({
    orderBy: [{ takenAt: "desc" }, { sortOrder: "asc" }],
    include: {
      post: {
        select: {
          author: { select: authorSelect },
        },
      },
      album: {
        select: {
          author: { select: authorSelect },
        },
      },
    },
  });
}

export async function listPublicGalleryAlbums() {
  return prisma.galleryAlbum.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: authorSelect },
      dateSpans: { orderBy: { startOn: "asc" } },
      items: itemOrder,
    },
  });
}

export async function getPublicGalleryAlbum(id: string) {
  if (!UUID_RE.test(id)) return null;
  return prisma.galleryAlbum.findUnique({
    where: { id },
    include: {
      author: { select: authorSelect },
      dateSpans: { orderBy: { startOn: "asc" } },
      items: itemOrder,
    },
  });
}

export async function listAdminGalleryPosts(options: {
  authorId: string;
  isMod: boolean;
}) {
  return prisma.galleryPost.findMany({
    where: options.isMod ? undefined : { authorId: options.authorId },
    orderBy: { createdAt: "desc" },
    include: {
      items: itemOrder,
      author: { select: authorSelect },
    },
  });
}

export async function listAdminGalleryAlbums(options: {
  authorId: string;
  isMod: boolean;
}) {
  return prisma.galleryAlbum.findMany({
    where: options.isMod ? undefined : { authorId: options.authorId },
    orderBy: { createdAt: "desc" },
    include: {
      items: itemOrder,
      author: { select: authorSelect },
    },
  });
}
