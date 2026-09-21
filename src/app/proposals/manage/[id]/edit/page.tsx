import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProposalEditor } from "@/components/admin/proposal-editor";
import { requireProposalManager } from "@/lib/auth";
import { getAdminProposal } from "@/lib/queries/proposals";

type Props = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = { title: "Edit proposal" };

export default async function ManageEditProposalPage({ params }: Props) {
  const { id } = await params;
  await requireProposalManager(id);
  const proposal = await getAdminProposal(id);
  if (!proposal) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <ProposalEditor
        basePath="/proposals/manage"
        proposal={{
          id: proposal.id,
          title: proposal.title,
          content: proposal.content,
          status: proposal.status,
          formSavedAt: proposal.formSavedAt?.toISOString() ?? null,
        }}
      />
    </div>
  );
}
