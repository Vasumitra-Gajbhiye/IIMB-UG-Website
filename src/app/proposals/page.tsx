import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Proposals",
};

export default function ProposalsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="font-serif text-3xl font-semibold tracking-tight">
        Proposals
      </h1>
      <p className="mt-2 text-muted-foreground">
        Placeholder — batch proposals and voting arrive in Phase 2.5 (before
        Directory).
      </p>
    </div>
  );
}
