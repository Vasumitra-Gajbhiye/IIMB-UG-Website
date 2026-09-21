import { ProposalStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const voteUserSelect = {
  email: true,
  student: { select: { name: true } },
} as const;

const authorSelect = {
  select: {
    email: true,
    name: true,
    student: { select: { name: true } },
  },
} as const;

/** Persist CLOSED for published proposals whose close date has passed. */
async function closeExpiredProposals() {
  const expired = await prisma.proposal.findMany({
    where: { status: ProposalStatus.PUBLISHED, closesAt: { lte: new Date() } },
    select: { id: true, closesAt: true },
  });
  await Promise.all(
    expired.map((proposal) =>
      prisma.proposal.updateMany({
        where: { id: proposal.id, status: ProposalStatus.PUBLISHED },
        data: { status: ProposalStatus.CLOSED, closedAt: proposal.closesAt },
      }),
    ),
  );
}

export async function listAdminProposals() {
  await closeExpiredProposals();
  return prisma.proposal.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { votes: true } },
    },
  });
}

export async function getAdminProposal(id: string) {
  await closeExpiredProposals();
  return prisma.proposal.findUnique({
    where: { id },
    include: {
      fields: { orderBy: { sortOrder: "asc" } },
      _count: { select: { votes: true } },
    },
  });
}

export async function getAdminProposalStats(id: string) {
  await closeExpiredProposals();
  return prisma.proposal.findUnique({
    where: { id },
    include: {
      createdBy: authorSelect,
      fields: { orderBy: { sortOrder: "asc" } },
      votes: {
        orderBy: { createdAt: "desc" },
        include: { user: { select: voteUserSelect } },
      },
    },
  });
}

export async function listMemberProposals(userId: string) {
  await closeExpiredProposals();
  return prisma.proposal.findMany({
    where: {
      OR: [
        { status: { in: [ProposalStatus.PUBLISHED, ProposalStatus.CLOSED] } },
        { status: ProposalStatus.DRAFT, createdById: userId },
      ],
    },
    orderBy: [{ publishedAt: { sort: "desc", nulls: "first" } }],
    include: { createdBy: authorSelect },
  });
}

export async function getMemberProposalBySlug(slug: string) {
  await closeExpiredProposals();
  return prisma.proposal.findFirst({
    where: {
      slug,
      status: { in: [ProposalStatus.PUBLISHED, ProposalStatus.CLOSED] },
    },
    include: {
      createdBy: authorSelect,
      fields: { orderBy: { sortOrder: "asc" } },
      votes: {
        orderBy: { createdAt: "desc" },
        include: { user: { select: voteUserSelect } },
      },
    },
  });
}
