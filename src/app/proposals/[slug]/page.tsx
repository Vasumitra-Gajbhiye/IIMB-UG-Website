import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Proposal",
};

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function ProposalDetailPage({ params }: Props) {
  const { slug } = await params;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="font-serif text-3xl font-semibold tracking-tight">
        Proposal
      </h1>
      <p className="mt-2 text-muted-foreground">
        Placeholder for <code className="text-sm">{slug}</code> — body, vote
        form, and results list arrive in Phase 2.5.
      </p>
    </div>
  );
}
