import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireMod } from "@/lib/auth";
import { getAdminProposal } from "@/lib/queries/proposals";
import { ProposalFormBuilder } from "@/components/admin/proposal-form-builder";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const proposal = await getAdminProposal(id);
  return { title: proposal ? `Form · ${proposal.title}` : "Vote form" };
}

export default async function ProposalFormPage({ params }: Props) {
  await requireMod();
  const { id } = await params;
  const proposal = await getAdminProposal(id);
  if (!proposal) notFound();

  return (
    <ProposalFormBuilder
      proposal={{
        id: proposal.id,
        title: proposal.title,
        status: proposal.status,
        formSavedAt: proposal.formSavedAt?.toISOString() ?? null,
        fields: proposal.fields,
      }}
    />
  );
}
