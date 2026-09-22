import { prisma } from "@/lib/prisma";

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
  authorId: string | null;
  authorName: string | null;
};

export type FaqCategoryGroup = {
  id: string;
  name: string;
  isDefault: boolean;
  createdById: string | null;
  faqs: FaqItem[];
};

/** Categories in mod-defined display order, each with its FAQs in display order. */
export async function getFaqsGrouped(): Promise<FaqCategoryGroup[]> {
  const categories = await prisma.faqCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      faqs: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        include: {
          author: {
            select: { name: true, student: { select: { name: true } } },
          },
        },
      },
    },
  });

  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    isDefault: c.isDefault,
    createdById: c.createdById,
    faqs: c.faqs.map((f) => ({
      id: f.id,
      question: f.question,
      answer: f.answer,
      authorId: f.authorId,
      authorName: f.author?.student?.name ?? f.author?.name ?? null,
    })),
  }));
}
