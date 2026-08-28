import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireMod } from "@/lib/auth";
import { getAdminProposal } from "@/lib/queries/proposals";
import { ProposalEditor } from "@/components/admin/proposal-editor";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const proposal = await getAdminProposal(id);
  return { title: proposal ? `Edit · ${proposal.title}` : "Edit proposal" };
}

export default async function EditProposalPage({ params }: Props) {
  await requireMod();
  const { id } = await params;
  const proposal = await getAdminProposal(id);
  if (!proposal) notFound();

  return (
    <ProposalEditor
      proposal={{
        id: proposal.id,
        title: proposal.title,
        content: proposal.content,
        status: proposal.status,
        formSavedAt: proposal.formSavedAt?.toISOString() ?? null,
      }}
    />
  );
}
