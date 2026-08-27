import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ",
};

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="font-serif text-3xl font-semibold tracking-tight">FAQ</h1>
      <p className="mt-2 text-muted-foreground">
        Placeholder — accordion arrives in Phase 5.
      </p>
    </div>
  );
}
