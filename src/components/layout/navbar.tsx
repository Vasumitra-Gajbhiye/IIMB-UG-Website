import Image from "next/image";
import Link from "next/link";

import { AuthNav } from "@/components/layout/auth-nav";
import { MobileNav } from "@/components/layout/mobile-nav";
import { NavLinks } from "@/components/layout/nav-links";
import { ensureUser } from "@/lib/auth";
import { LOGO_SRC, SITE_NAME } from "@/lib/constants";

export async function Navbar() {
  const session = await ensureUser();
  const showProposals = Boolean(session?.isAllowlisted);
  const showAdmin = Boolean(session?.isMod);

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-foreground no-underline"
        >
          <Image
            src={LOGO_SRC}
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 object-contain"
            priority
          />
          <span className="text-sm font-semibold tracking-tight sm:text-base">
            {SITE_NAME}
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
            <NavLinks showProposals={showProposals} showAdmin={showAdmin} />
          </nav>
          <AuthNav />
          <div className="md:hidden">
            <MobileNav showProposals={showProposals} showAdmin={showAdmin} />
          </div>
        </div>
      </div>
    </header>
  );
}
