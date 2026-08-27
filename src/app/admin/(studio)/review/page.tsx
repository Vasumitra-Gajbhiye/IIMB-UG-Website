import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Review",
};

export default function AdminReviewPage() {
  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold tracking-tight">
        Review
      </h1>
      <p className="mt-2 text-muted-foreground">
        Placeholder — review queue arrives in Phase 6.
      </p>
    </div>
  );
}
