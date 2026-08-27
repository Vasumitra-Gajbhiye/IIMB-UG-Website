import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Proposals",
};

export default function AdminProposalsPage() {
  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold tracking-tight">
        Proposals
      </h1>
      <p className="mt-2 text-muted-foreground">
        Placeholder — admin create/edit for proposals arrives in Phase 2.5.
      </p>
    </div>
  );
}
