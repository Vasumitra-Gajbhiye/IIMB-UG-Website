import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-start gap-4 px-4 py-16 sm:px-6">
      <h1 className="font-serif text-3xl font-semibold tracking-tight">
        Page not found
      </h1>
      <p className="text-muted-foreground">
        That URL is not on this site. Head back home or browse the directory.
      </p>
      <Button asChild>
        <Link href="/">Back home</Link>
      </Button>
    </div>
  );
}
