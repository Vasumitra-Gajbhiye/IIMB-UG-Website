import type { Metadata } from "next";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

import { ensureUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "My profile",
};

export default async function MePage() {
  const session = await ensureUser();

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight">
            My profile
          </h1>
          <p className="mt-2 text-muted-foreground">
            Placeholder — edit your student card and resources from here later
            (after allowlist linking).
          </p>
          {session ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Signed in as{" "}
              <span className="font-medium text-foreground">{session.email}</span>
              {session.isAllowlisted ? (
                <span className="ml-2 rounded-md bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                  {session.isMod ? "Mod" : "Allowlisted"}
                </span>
              ) : null}
            </p>
          ) : null}
        </div>
        <UserButton />
      </div>
      <p className="mt-6 text-sm text-muted-foreground">
        Need the studio?{" "}
        <Link
          href="/admin"
          className="text-primary underline-offset-4 hover:underline"
        >
          Open /admin
        </Link>
        .
      </p>
    </div>
  );
}
