import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { ProposalStatus } from "@/generated/prisma/client";

import { ProposalStatsView } from "@/components/proposals/proposal-stats-view";
import { requireMod } from "@/lib/auth";
import { getAdminProposalStats } from "@/lib/queries/proposals";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const proposal = await getAdminProposalStats(id);
  return { title: proposal ? `Stats · ${proposal.title}` : "Proposal stats" };
}

export default async function ProposalStatsPage({ params }: Props) {
  await requireMod();
  const { id } = await params;
  const proposal = await getAdminProposalStats(id);
  if (!proposal) notFound();

  if (proposal.status === ProposalStatus.DRAFT) {
    redirect(`/admin/proposals/${proposal.id}/edit`);
  }

  return (
    <ProposalStatsView
      proposal={proposal}
      basePath="/admin/proposals"
      backHref="/admin/proposals"
    />
  );
}
