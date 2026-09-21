import type { Metadata } from "next";

import { NewProposalButton } from "@/components/admin/new-proposal-button";
import { ProposalCard } from "@/components/proposals/proposal-card";
import { requireAllowlisted } from "@/lib/auth";
import { listMemberProposals } from "@/lib/queries/proposals";

export const metadata: Metadata = {
  title: "Proposals",
};

export default async function ProposalsPage() {
  const session = await requireAllowlisted({ redirectTo: "/not-allowlisted" });
  const proposals = await listMemberProposals(session.id);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight">
            Proposals
          </h1>
          <p className="mt-2 text-muted-foreground">
            Batch proposals. Vote once; results sit at the bottom of each page.
          </p>
        </div>
        <NewProposalButton />
      </div>

      {proposals.length === 0 ? (
        <p className="mt-10 text-sm text-muted-foreground">No proposals yet.</p>
      ) : (
        <div className="mt-8 space-y-4">
          {proposals.map((proposal) => (
            <ProposalCard
              key={proposal.id}
              proposal={proposal}
              canManage={session.isMod || proposal.createdById === session.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
