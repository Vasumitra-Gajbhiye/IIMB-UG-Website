"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { ensureUser, type SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";

export type FaqActionState = {
  ok: boolean;
  error?: string;
  categoryId?: string;
};

const questionSchema = z.string().trim().min(5, "Question is too short").max(300);
const answerSchema = z.string().trim().min(2, "Answer is required").max(5000);
const categoryNameSchema = z
  .string()
  .trim()
  .min(2, "Category name is too short")
  .max(40, "Category name is too long");

const NOT_ALLOWED = "You need to be signed in as an approved student to do that.";

async function requirePoster(): Promise<SessionUser | null> {
  const session = await ensureUser();
  return session?.isAllowlisted ? session : null;
}

function refresh() {
  revalidatePath("/faq");
}

function firstError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid input";
}

async function nextSortOrder(categoryId: string): Promise<number> {
  const top = await prisma.faq.aggregate({
    where: { categoryId },
    _max: { sortOrder: true },
  });
  return (top._max.sortOrder ?? -1) + 1;
}

export async function createFaqCategory(name: string): Promise<FaqActionState> {
  const session = await requirePoster();
  if (!session) return { ok: false, error: NOT_ALLOWED };

  const parsed = categoryNameSchema.safeParse(name);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

  const clean = parsed.data;
  const duplicate = await prisma.faqCategory.findFirst({
    where: { name: { equals: clean, mode: "insensitive" } },
    select: { id: true },
  });
  if (duplicate) return { ok: false, error: "That category already exists." };

  const base = slugify(clean).slice(0, 40) || "category";
  let slug = base;
  for (let n = 2; await prisma.faqCategory.findUnique({ where: { slug } }); n++) {
    slug = `${base}-${n}`;
  }

  try {
    const created = await prisma.faqCategory.create({
      data: { name: clean, slug, createdById: session.id },
    });
    refresh();
    return { ok: true, categoryId: created.id };
  } catch {
    return { ok: false, error: "Could not create that category." };
  }
}

export async function createFaq(input: {
  question: string;
  answer: string;
  categoryId?: string;
}): Promise<FaqActionState> {
  const session = await requirePoster();
  if (!session) return { ok: false, error: NOT_ALLOWED };

  const parsed = z
    .object({
      question: questionSchema,
      answer: answerSchema,
      categoryId: z.string().uuid().optional(),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

  const category = parsed.data.categoryId
    ? await prisma.faqCategory.findUnique({ where: { id: parsed.data.categoryId } })
    : await prisma.faqCategory.findFirst({ where: { isDefault: true } });
  if (!category) return { ok: false, error: "Category not found." };

  try {
    await prisma.faq.create({
      data: {
        question: parsed.data.question,
        answer: parsed.data.answer,
        categoryId: category.id,
        authorId: session.id,
        sortOrder: await nextSortOrder(category.id),
      },
    });
  } catch {
    return { ok: false, error: "Could not save your FAQ." };
  }
  refresh();
  return { ok: true };
}

export async function updateFaq(input: {
  id: string;
  question: string;
  answer: string;
}): Promise<FaqActionState> {
  const session = await ensureUser();
  if (!session) return { ok: false, error: NOT_ALLOWED };

  const parsed = z
    .object({ id: z.string().uuid(), question: questionSchema, answer: answerSchema })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

  const faq = await prisma.faq.findUnique({
    where: { id: parsed.data.id },
    select: { authorId: true },
  });
  if (!faq) return { ok: false, error: "FAQ not found." };
  if (!session.isMod && faq.authorId !== session.id) {
    return { ok: false, error: "You can only edit your own FAQs." };
  }

  await prisma.faq.update({
    where: { id: parsed.data.id },
    data: { question: parsed.data.question, answer: parsed.data.answer },
  });
  refresh();
  return { ok: true };
}

export async function deleteFaq(id: string): Promise<FaqActionState> {
  const session = await ensureUser();
  if (!session) return { ok: false, error: NOT_ALLOWED };
  if (!z.string().uuid().safeParse(id).success) {
    return { ok: false, error: "Invalid FAQ." };
  }

  const faq = await prisma.faq.findUnique({
    where: { id },
    select: { authorId: true },
  });
  if (!faq) return { ok: false, error: "FAQ not found." };
  if (!session.isMod && faq.authorId !== session.id) {
    return { ok: false, error: "You can only delete your own FAQs." };
  }

  await prisma.faq.delete({ where: { id } });
  refresh();
  return { ok: true };
}

/**
 * Creators may delete their own empty categories; mods may delete any
 * non-default category (its FAQs move to General).
 */
export async function deleteFaqCategory(id: string): Promise<FaqActionState> {
  const session = await ensureUser();
  if (!session) return { ok: false, error: NOT_ALLOWED };
  if (!z.string().uuid().safeParse(id).success) {
    return { ok: false, error: "Invalid category." };
  }

  const category = await prisma.faqCategory.findUnique({
    where: { id },
    include: { _count: { select: { faqs: true } } },
  });
  if (!category) return { ok: false, error: "Category not found." };
  if (category.isDefault) {
    return { ok: false, error: "The General category can't be deleted." };
  }

  const isCreator = category.createdById === session.id;
  if (!session.isMod && !isCreator) {
    return { ok: false, error: "You can only delete categories you created." };
  }
  if (!session.isMod && category._count.faqs > 0) {
    return { ok: false, error: "Only a mod can delete a category that has FAQs." };
  }

  const general = await prisma.faqCategory.findFirst({ where: { isDefault: true } });
  if (!general) return { ok: false, error: "General category is missing." };

  await prisma.$transaction(async (tx) => {
    if (category._count.faqs > 0) {
      const start = await tx.faq.aggregate({
        where: { categoryId: general.id },
        _max: { sortOrder: true },
      });
      const moving = await tx.faq.findMany({
        where: { categoryId: id },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: { id: true },
      });
      let order = (start._max.sortOrder ?? -1) + 1;
      for (const { id: faqId } of moving) {
        await tx.faq.update({
          where: { id: faqId },
          data: { categoryId: general.id, sortOrder: order++ },
        });
      }
    }
    await tx.faqCategory.delete({ where: { id } });
  });
  refresh();
  return { ok: true };
}

export async function reorderFaqs(input: {
  categoryId: string;
  orderedIds: string[];
}): Promise<FaqActionState> {
  const session = await ensureUser();
  if (!session?.isMod) return { ok: false, error: "Only mods can reorder FAQs." };

  const parsed = z
    .object({
      categoryId: z.string().uuid(),
      orderedIds: z.array(z.string().uuid()).max(500),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

  const { categoryId, orderedIds } = parsed.data;
  const existing = await prisma.faq.findMany({
    where: { categoryId },
    select: { id: true },
  });
  const existingIds = new Set(existing.map((f) => f.id));
  if (
    orderedIds.length !== existingIds.size ||
    new Set(orderedIds).size !== orderedIds.length ||
    !orderedIds.every((id) => existingIds.has(id))
  ) {
    return { ok: false, error: "The list changed. Refresh and try again." };
  }

  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.faq.update({ where: { id }, data: { sortOrder: index } }),
    ),
  );
  refresh();
  return { ok: true };
}
