"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  modsOnly?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/admin/access", label: "Access", modsOnly: true },
  { href: "/admin/directory", label: "Directory", modsOnly: true },
  { href: "/admin/proposals", label: "Proposals", modsOnly: true },
  { href: "/admin/gallery", label: "Gallery" },
  { href: "/admin", label: "Home" },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLinks({
  isMod,
  onNavigate,
}: {
  isMod: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => !item.modsOnly || isMod);

  return (
    <nav className="flex flex-col gap-1" aria-label="Studio">
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function StudioSidebar({ isMod }: { isMod: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <aside className="hidden w-52 shrink-0 border-r border-border/80 pr-4 md:block">
        <p className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Studio
        </p>
        <NavLinks isMod={isMod} />
      </aside>

      <div className="mb-4 md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Menu className="size-4" />
              Studio menu
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64">
            <SheetHeader>
              <SheetTitle>Studio</SheetTitle>
            </SheetHeader>
            <div className="mt-4 px-2">
              <NavLinks isMod={isMod} onNavigate={() => setOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
