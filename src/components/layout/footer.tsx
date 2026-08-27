import Image from "next/image";
import Link from "next/link";

import { LOGO_SRC, OFFICIAL_UG_URL, SITE_NAME } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-start gap-3">
          <Image
            src={LOGO_SRC}
            alt=""
            width={24}
            height={24}
            className="mt-0.5 h-6 w-6 object-contain"
          />
          <div className="space-y-1 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">{SITE_NAME}</p>
            <p>
              A student-run project for the inaugural undergraduate batch. This
              is not an official IIM Bangalore admissions site.
            </p>
            <p>
              Official programme information:{" "}
              <Link
                href={OFFICIAL_UG_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline-offset-4 hover:underline"
              >
                ug.iimb.ac.in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
