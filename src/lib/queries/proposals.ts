import { ProposalStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const voteUserSelect = {
  email: true,
  student: { select: { name: true } },
} as const;

export async function listAdminProposals() {
  return prisma.proposal.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { votes: true } },
    },
  });
}

export async function getAdminProposal(id: string) {
  return prisma.proposal.findUnique({
    where: { id },
    include: {
      fields: { orderBy: { sortOrder: "asc" } },
      _count: { select: { votes: true } },
    },
  });
}

export async function getAdminProposalStats(id: string) {
  return prisma.proposal.findUnique({
    where: { id },
    include: {
      fields: { orderBy: { sortOrder: "asc" } },
      votes: {
        orderBy: { createdAt: "desc" },
        include: { user: { select: voteUserSelect } },
      },
    },
  });
}

export async function listMemberProposals() {
  return prisma.proposal.findMany({
    where: {
      status: { in: [ProposalStatus.PUBLISHED, ProposalStatus.CLOSED] },
    },
    orderBy: { publishedAt: "desc" },
  });
}

export async function getMemberProposalBySlug(slug: string) {
  return prisma.proposal.findFirst({
    where: {
      slug,
      status: { in: [ProposalStatus.PUBLISHED, ProposalStatus.CLOSED] },
    },
    include: {
      fields: { orderBy: { sortOrder: "asc" } },
      votes: {
        orderBy: { createdAt: "desc" },
        include: { user: { select: voteUserSelect } },
      },
    },
  });
}
