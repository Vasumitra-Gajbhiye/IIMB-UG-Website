import type { Metadata } from "next";

import { ProposalCard } from "@/components/proposals/proposal-card";
import { listMemberProposals } from "@/lib/queries/proposals";

export const metadata: Metadata = {
  title: "Proposals",
};

export default async function ProposalsPage() {
  const proposals = await listMemberProposals();

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="font-serif text-3xl font-semibold tracking-tight">
        Proposals
      </h1>
      <p className="mt-2 text-muted-foreground">
        Batch proposals. Vote once; results sit at the bottom of each page.
      </p>

      {proposals.length === 0 ? (
        <p className="mt-10 text-sm text-muted-foreground">No proposals yet.</p>
      ) : (
        <div className="mt-8 space-y-4">
          {proposals.map((proposal) => (
            <ProposalCard key={proposal.id} proposal={proposal} />
          ))}
        </div>
      )}
    </div>
  );
}
