import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Writing",
};

export default function BlogsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="font-serif text-3xl font-semibold tracking-tight">
        Writing
      </h1>
      <p className="mt-2 text-muted-foreground">
        Placeholder — published posts arrive in Phase 4.
      </p>
    </div>
  );
}
