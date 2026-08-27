import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Forbidden",
};

export default function AdminForbiddenPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
      <h1 className="font-serif text-3xl font-semibold tracking-tight">
        Not allowlisted
      </h1>
      <p className="mt-3 text-muted-foreground">
        You are signed in, but your email is not on the Studio allowlist. Ask a
        mod to add you on the Access page if you should have access.
      </p>
      <p className="mt-6 text-sm">
        <Link
          href="/"
          className="text-primary underline-offset-4 hover:underline"
        >
          Back to home
        </Link>
        {" · "}
        <Link
          href="/me"
          className="text-primary underline-offset-4 hover:underline"
        >
          My profile
        </Link>
      </p>
    </div>
  );
}
