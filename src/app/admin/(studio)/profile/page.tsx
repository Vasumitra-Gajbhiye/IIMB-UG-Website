import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My profile",
};

export default function AdminProfilePage() {
  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold tracking-tight">
        My profile
      </h1>
      <p className="mt-2 text-muted-foreground">
        Placeholder — profile editor arrives in Phase 6.
      </p>
    </div>
  );
}
