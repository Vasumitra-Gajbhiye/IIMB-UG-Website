import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My writing",
};

export default function AdminBlogsPage() {
  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold tracking-tight">
        My writing
      </h1>
      <p className="mt-2 text-muted-foreground">
        Placeholder — blog list arrives in Phase 6.
      </p>
    </div>
  );
}
