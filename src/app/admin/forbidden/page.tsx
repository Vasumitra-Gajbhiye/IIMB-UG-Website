import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forbidden",
};

export default function AdminForbiddenPage() {
  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold tracking-tight">
        Forbidden
      </h1>
      <p className="mt-2 text-muted-foreground">
        Placeholder — signed-in but not allowlisted screen arrives in Phase 6.
      </p>
    </div>
  );
}
