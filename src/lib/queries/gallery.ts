import { prisma } from "@/lib/prisma";

const authorSelect = {
  student: { select: { name: true, slug: true, isListed: true } },
} as const;

export async function listPublicGalleryItems() {
  return prisma.galleryItem.findMany({
    orderBy: [{ takenAt: "desc" }, { sortOrder: "asc" }],
    include: {
      post: {
        select: {
          author: { select: authorSelect },
        },
      },
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
      items: { orderBy: { sortOrder: "asc" } },
      author: { select: authorSelect },
    },
  });
}
