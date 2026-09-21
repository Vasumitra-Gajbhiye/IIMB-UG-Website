import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { ProposalStatus } from "@/generated/prisma/client";

import { ProposalStatsView } from "@/components/proposals/proposal-stats-view";
import { requireProposalManager } from "@/lib/auth";
import { getAdminProposalStats } from "@/lib/queries/proposals";

type Props = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = { title: "Proposal stats" };

export default async function ManageProposalStatsPage({ params }: Props) {
  const { id } = await params;
  await requireProposalManager(id);
  const proposal = await getAdminProposalStats(id);
  if (!proposal) notFound();

  if (proposal.status === ProposalStatus.DRAFT) {
    redirect(`/proposals/manage/${proposal.id}/edit`);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <ProposalStatsView
        proposal={proposal}
        basePath="/proposals/manage"
        backHref="/proposals"
      />
    </div>
  );
}
