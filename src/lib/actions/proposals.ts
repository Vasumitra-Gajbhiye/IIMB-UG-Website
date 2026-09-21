"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  Prisma,
  ProposalFieldType,
  ProposalStatus,
} from "@/generated/prisma/client";
import { requireAllowlisted, requireProposalManager } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  effectiveStatus,
  parseIstDateTime,
  parseVoteAnswers,
  type VoteAnswers,
} from "@/lib/proposals";
import { uniqueProposalSlug } from "@/lib/slug";

export type ProposalActionState = {
  ok: boolean;
  error?: string;
};

function revalidateProposal(slug: string) {
  revalidatePath("/proposals");
  revalidatePath(`/proposals/${slug}`);
  revalidatePath("/admin/proposals");
}

function revalidateManage(id: string) {
  revalidatePath("/proposals");
  revalidatePath("/admin/proposals");
  revalidatePath(`/admin/proposals/${id}`);
  revalidatePath(`/proposals/manage/${id}`);
}

export async function createProposal() {
  const session = await requireAllowlisted({ redirectTo: "/not-allowlisted" });
  const slug = await uniqueProposalSlug("untitled");
  const proposal = await prisma.proposal.create({
    data: {
      title: "Untitled",
      slug,
      createdById: session.id,
    },
  });
  redirect(`/proposals/manage/${proposal.id}/edit`);
}

export async function saveProposalBlog(
  _prev: ProposalActionState,
  formData: FormData,
): Promise<ProposalActionState> {
  const parsed = z
    .object({
      id: z.string().uuid(),
      title: z.string().trim().min(1, "Title is required").max(200),
      content: z.string().min(1, "Missing editor content"),
    })
    .safeParse({
      id: formData.get("id"),
      title: formData.get("title"),
      content: formData.get("content"),
    });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  let content: unknown;
  try {
    content = JSON.parse(parsed.data.content);
    if (!Array.isArray(content)) throw new Error("not array");
  } catch {
    return { ok: false, error: "Invalid editor content." };
  }

  const { proposal: existing } = await requireProposalManager(parsed.data.id);
  if (!existing) return { ok: false, error: "Proposal not found." };

  const slug =
    existing.status === ProposalStatus.DRAFT
      ? await uniqueProposalSlug(parsed.data.title, existing.id)
      : existing.slug;

  await prisma.proposal.update({
    where: { id: existing.id },
    data: {
      title: parsed.data.title,
      content: content as Prisma.InputJsonValue,
      slug,
    },
  });

  revalidateManage(existing.id);
  revalidatePath(`/admin/proposals/${existing.id}/edit`);
  if (existing.status !== ProposalStatus.DRAFT) {
    revalidateProposal(slug);
  }
  return { ok: true };
}

const fieldSchema = z.object({
  id: z.string().uuid(),
  label: z.string().trim().min(1, "Each field needs a label").max(200),
  type: z.enum(["TEXT", "SINGLE_SELECT", "MULTI_SELECT"]),
  options: z.array(z.string().trim().min(1).max(200)),
});

export async function saveProposalForm(
  _prev: ProposalActionState,
  formData: FormData,
): Promise<ProposalActionState> {
  const idParsed = z.string().uuid().safeParse(formData.get("id"));
  if (!idParsed.success) return { ok: false, error: "Invalid proposal." };
  await requireProposalManager(idParsed.data);

  let fieldsRaw: unknown;
  try {
    fieldsRaw = JSON.parse(String(formData.get("fields") ?? "[]"));
  } catch {
    return { ok: false, error: "Invalid form fields." };
  }

  const parsed = z.array(fieldSchema).min(1, "Add at least one field.").safeParse(
    fieldsRaw,
  );
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid fields",
    };
  }

  for (const field of parsed.data) {
    if (field.type !== ProposalFieldType.TEXT && field.options.length < 2) {
      return {
        ok: false,
        error: `“${field.label || "A choice field"}” needs at least two options.`,
      };
    }
  }

  const proposal = await prisma.proposal.findUnique({
    where: { id: idParsed.data },
    include: { fields: true },
  });
  if (!proposal) return { ok: false, error: "Proposal not found." };
  if (proposal.formSavedAt) {
    return { ok: false, error: "The vote form is locked." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.proposalField.deleteMany({ where: { proposalId: proposal.id } });
    await tx.proposalField.createMany({
      data: parsed.data.map((field, index) => ({
        id: field.id,
        proposalId: proposal.id,
        label: field.label,
        type: field.type,
        options:
          field.type === ProposalFieldType.TEXT ? [] : field.options,
        sortOrder: index,
      })),
    });
    await tx.proposal.update({
      where: { id: proposal.id },
      data: { formSavedAt: new Date() },
    });
  });

  revalidateManage(proposal.id);
  revalidatePath(`/admin/proposals/${proposal.id}/form`);
  return { ok: true };
}

export async function publishProposal(
  _prev: ProposalActionState,
  formData: FormData,
): Promise<ProposalActionState> {
  const idParsed = z.string().uuid().safeParse(formData.get("id"));
  if (!idParsed.success) return { ok: false, error: "Invalid proposal." };
  const { session } = await requireProposalManager(idParsed.data);

  const proposal = await prisma.proposal.findUnique({
    where: { id: idParsed.data },
    include: { fields: true },
  });
  if (!proposal) return { ok: false, error: "Proposal not found." };

  const closesAtRaw = String(formData.get("closesAt") ?? "").trim();
  let closesAt: Date | null = null;
  if (closesAtRaw) {
    closesAt = parseIstDateTime(closesAtRaw);
    if (!closesAt) return { ok: false, error: "Invalid close date." };
    if (closesAt.getTime() <= Date.now()) {
      return { ok: false, error: "Close date must be in the future." };
    }
  }
  if (proposal.status !== ProposalStatus.DRAFT) {
    return { ok: false, error: "Only drafts can be published." };
  }
  if (!proposal.formSavedAt || proposal.fields.length === 0) {
    return { ok: false, error: "Save the vote form before publishing." };
  }
  if (!proposal.title.trim()) {
    return { ok: false, error: "Add a title before publishing." };
  }

  const slug = await uniqueProposalSlug(proposal.title, proposal.id);

  await prisma.proposal.update({
    where: { id: proposal.id },
    data: {
      status: ProposalStatus.PUBLISHED,
      publishedAt: new Date(),
      closesAt,
      slug,
    },
  });

  revalidateProposal(slug);
  revalidateManage(proposal.id);
  redirect(
    session.isMod
      ? `/admin/proposals/${proposal.id}`
      : `/proposals/manage/${proposal.id}`,
  );
}

export async function closeProposal(
  _prev: ProposalActionState,
  formData: FormData,
): Promise<ProposalActionState> {
  const idParsed = z.string().uuid().safeParse(formData.get("id"));
  if (!idParsed.success) return { ok: false, error: "Invalid proposal." };
  await requireProposalManager(idParsed.data);

  const proposal = await prisma.proposal.findUnique({
    where: { id: idParsed.data },
  });
  if (!proposal) return { ok: false, error: "Proposal not found." };
  if (proposal.status !== ProposalStatus.PUBLISHED) {
    return { ok: false, error: "Only live proposals can be closed." };
  }

  await prisma.proposal.update({
    where: { id: proposal.id },
    data: {
      status: ProposalStatus.CLOSED,
      closedAt: new Date(),
    },
  });

  revalidateProposal(proposal.slug);
  revalidateManage(proposal.id);
  return { ok: true };
}

export async function deleteProposal(formData: FormData) {
  const idParsed = z.string().uuid().safeParse(formData.get("id"));
  if (!idParsed.success) return;
  const { session } = await requireProposalManager(idParsed.data);

  const proposal = await prisma.proposal.findUnique({
    where: { id: idParsed.data },
    select: { id: true, slug: true },
  });
  if (!proposal) return;

  await prisma.proposal.delete({ where: { id: proposal.id } });
  revalidateProposal(proposal.slug);
  redirect(session.isMod ? "/admin/proposals" : "/proposals");
}

function validateAnswers(
  fields: {
    id: string;
    label: string;
    type: ProposalFieldType;
    options: string[];
  }[],
  answers: VoteAnswers,
): string | null {
  for (const field of fields) {
    const value = answers[field.id];
    if (field.type === ProposalFieldType.TEXT) {
      if (typeof value !== "string" || !value.trim()) {
        return `Please fill in “${field.label}”.`;
      }
    } else if (field.type === ProposalFieldType.SINGLE_SELECT) {
      if (typeof value !== "string" || !field.options.includes(value)) {
        return `Please choose an option for “${field.label}”.`;
      }
    } else if (
      !Array.isArray(value) ||
      value.length === 0 ||
      value.some((option) => !field.options.includes(option))
    ) {
      return `Please choose at least one option for “${field.label}”.`;
    }
  }
  return null;
}

export async function submitVote(
  _prev: ProposalActionState,
  formData: FormData,
): Promise<ProposalActionState> {
  const session = await requireAllowlisted({ redirectTo: "/not-allowlisted" });

  const parsed = z
    .object({
      proposalId: z.string().uuid(),
      answers: z.string(),
      anonymous: z.enum(["true", "false"]).default("false"),
    })
    .safeParse({
      proposalId: formData.get("proposalId"),
      answers: formData.get("answers"),
      anonymous: formData.get("anonymous") || "false",
    });

  if (!parsed.success) {
    return { ok: false, error: "Invalid vote." };
  }

  let answers: VoteAnswers;
  try {
    answers = parseVoteAnswers(JSON.parse(parsed.data.answers));
  } catch {
    return { ok: false, error: "Invalid answers." };
  }

  const proposal = await prisma.proposal.findUnique({
    where: { id: parsed.data.proposalId },
    include: { fields: { orderBy: { sortOrder: "asc" } } },
  });
  if (!proposal || effectiveStatus(proposal) !== ProposalStatus.PUBLISHED) {
    return { ok: false, error: "This proposal is not open for voting." };
  }

  const error = validateAnswers(proposal.fields, answers);
  if (error) return { ok: false, error };

  const stored: VoteAnswers = {};
  for (const field of proposal.fields) {
    const value = answers[field.id];
    if (typeof value === "string") stored[field.id] = value.trim();
    else stored[field.id] = value;
  }

  try {
    await prisma.proposalVote.create({
      data: {
        proposalId: proposal.id,
        userId: session.id,
        anonymous: parsed.data.anonymous === "true",
        answers: stored as Prisma.InputJsonValue,
      },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return { ok: false, error: "You already voted on this proposal." };
    }
    return { ok: false, error: "Could not save your vote." };
  }

  revalidateProposal(proposal.slug);
  return { ok: true };
}
