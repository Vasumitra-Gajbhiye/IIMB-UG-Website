import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProposalFormBuilder } from "@/components/admin/proposal-form-builder";
import { requireProposalManager } from "@/lib/auth";
import { getAdminProposal } from "@/lib/queries/proposals";

type Props = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = { title: "Vote form" };

export default async function ManageProposalFormPage({ params }: Props) {
  const { id } = await params;
  await requireProposalManager(id);
  const proposal = await getAdminProposal(id);
  if (!proposal) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <ProposalFormBuilder
        basePath="/proposals/manage"
        proposal={{
          id: proposal.id,
          title: proposal.title,
          status: proposal.status,
          formSavedAt: proposal.formSavedAt?.toISOString() ?? null,
          fields: proposal.fields,
        }}
      />
    </div>
  );
}
