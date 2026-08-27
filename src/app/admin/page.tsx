import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Studio",
};

export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold tracking-tight">
        Dashboard
      </h1>
      <p className="mt-2 text-muted-foreground">
        Placeholder — allowlist gate and studio nav arrive in Phase 6.
      </p>
    </div>
  );
}
