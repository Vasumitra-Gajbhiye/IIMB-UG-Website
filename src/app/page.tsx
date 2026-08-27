import Link from "next/link";

import { Button } from "@/components/ui/button";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/constants";

export default function HomePage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-16 sm:px-6">
      <div className="space-y-3">
        <h1 className="font-serif text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          {SITE_NAME}
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">{SITE_TAGLINE}</p>
        <p className="max-w-xl text-sm text-muted-foreground">
          Placeholder home — landing content arrives in Phase 5.
        </p>
      </div>
      <div>
        <Button asChild>
          <Link href="/directory">Browse directory</Link>
        </Button>
      </div>
    </div>
  );
}
