import Image from "next/image";
import Link from "next/link";
import { Globe } from "lucide-react";

import {
  GithubIcon,
  InstagramIcon,
  LinkedinIcon,
} from "@/components/profile/brand-icons";
import { TRACK_LABEL } from "@/lib/constants";
import type { DirectoryStudent } from "@/lib/queries/directory";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117Z" />
    </svg>
  );
}

export function StudentCard({ student }: { student: DirectoryStudent }) {
  const socials = [
    { label: "LinkedIn", href: student.linkedinUrl, Icon: LinkedinIcon },
    { label: "GitHub", href: student.githubUrl, Icon: GithubIcon },
    { label: "Instagram", href: student.instagramUrl, Icon: InstagramIcon },
    { label: "X", href: student.twitterUrl, Icon: XIcon },
    { label: "Website", href: student.websiteUrl, Icon: Globe },
  ].filter((s): s is typeof s & { href: string } => Boolean(s.href));

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-colors hover:border-primary/40">
      <Link
        href={`/directory/${student.slug}`}
        className="flex flex-col items-center no-underline"
      >
        <div className="relative h-16 w-full bg-linear-to-br from-primary via-primary/80 to-primary/50">
          {student.bannerUrl ? (
            <Image
              src={student.bannerUrl}
              alt=""
              fill
              sizes="(min-width: 1024px) 240px, (min-width: 640px) 33vw, 50vw"
              className="object-cover"
            />
          ) : null}
        </div>
        <div className="relative -mt-8 size-16 overflow-hidden rounded-full border-4 border-card bg-muted">
          {student.avatarUrl ? (
            <Image
              src={student.avatarUrl}
              alt={`${student.name}'s profile picture`}
              fill
              sizes="64px"
              className="object-cover"
            />
          ) : (
            <span className="flex size-full items-center justify-center bg-primary/10 text-lg font-semibold text-primary">
              {initials(student.name)}
            </span>
          )}
        </div>
        <div className="mt-2 px-3 text-center">
          <h2 className="line-clamp-1 text-sm font-semibold text-foreground">
            {student.name}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {TRACK_LABEL[student.track]}
            {student.batch ? ` · ${student.batch}` : ""}
          </p>
        </div>
      </Link>
      <div className="mt-3 flex min-h-8 items-center justify-center gap-1.5 px-3 pb-3">
        {socials.map(({ label, href, Icon }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${student.name} on ${label}`}
            className="flex size-8 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <Icon className="size-4" />
          </a>
        ))}
      </div>
    </article>
  );
}
