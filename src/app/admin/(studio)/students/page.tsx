import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Students",
};

export default function AdminStudentsPage() {
  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold tracking-tight">
        Students
      </h1>
      <p className="mt-2 text-muted-foreground">
        Placeholder — roster CRUD arrives in Phase 6.
      </p>
    </div>
  );
}
