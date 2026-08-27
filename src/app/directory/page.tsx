import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Directory",
};

export default function DirectoryPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="font-serif text-3xl font-semibold tracking-tight">
        Directory
      </h1>
      <p className="mt-2 text-muted-foreground">
        Placeholder — student grid arrives in Phase 3.
      </p>
    </div>
  );
}
