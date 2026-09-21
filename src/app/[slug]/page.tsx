import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";

import { SOCIAL_ICONS } from "@/components/profile/brand-icons";
import { ProfileHero } from "@/components/profile/profile-hero";
import { Button } from "@/components/ui/button";
import { ensureUser, isEmailAllowlisted } from "@/lib/auth";
import { TRACK_LABEL } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { SOCIAL_META, socialDisplay, validateSlug } from "@/lib/profile";

type Props = {
  params: Promise<{ slug: string }>;
};

/** Public only for listed students who are still on the allowlist. */
async function loadPublicStudent(slug: string) {
  if (validateSlug(slug)) return null;
  const student = await prisma.student.findUnique({ where: { slug } });
  if (!student || !student.isListed || !student.email) return null;
  if (!(await isEmailAllowlisted(student.email))) return null;
  return student;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const student = await loadPublicStudent(slug);
  if (!student) return { title: "Profile not found" };

  const subtitle = `BSc ${TRACK_LABEL[student.track]}${student.batch ? ` · Class of ${student.batch}` : ""} · IIMB UG`;
  const description = student.bio?.trim() || subtitle;
  return {
    title: student.name,
    description,
    openGraph: {
      title: student.name,
      description,
      type: "profile",
      images: student.avatarUrl ? [student.avatarUrl] : undefined,
    },
  };
}

export default async function StudentProfilePage({ params }: Props) {
  const { slug } = await params;
  const student = await loadPublicStudent(slug);
  if (!student) notFound();

  const session = await ensureUser();
  const isOwner = session?.email === student.email;

  const links = (
    [
      ["instagram", student.instagramUrl],
      ["linkedin", student.linkedinUrl],
      ["github", student.githubUrl],
    ] as const
  ).filter((l): l is readonly [typeof l[0], string] => Boolean(l[1]));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <ProfileHero
        name={student.name}
        track={student.track}
        batch={student.batch}
        bannerUrl={student.bannerUrl}
        avatarUrl={student.avatarUrl}
        handle={`@${student.slug}`}
        actions={
          isOwner ? (
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link href="/me">
                <Pencil className="size-3.5" aria-hidden />
                Edit profile
              </Link>
            </Button>
          ) : null
        }
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <h2 className="text-base font-semibold tracking-tight">About</h2>
          {student.bio?.trim() ? (
            <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-foreground/90">
              {student.bio}
            </p>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              {isOwner
                ? "You haven't written a bio yet."
                : `${student.name.split(" ")[0]} hasn't added a bio yet.`}
            </p>
          )}
        </section>

        {links.length > 0 ? (
          <aside className="h-fit rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <h2 className="text-base font-semibold tracking-tight">Find me on</h2>
            <ul className="mt-3 space-y-1">
              {links.map(([kind, url]) => {
                const Icon = SOCIAL_ICONS[kind];
                return (
                  <li key={kind}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer me"
                      className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                    >
                      <span className="flex size-8 items-center justify-center rounded-full bg-muted text-foreground">
                        <Icon className="size-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block font-medium">
                          {SOCIAL_META[kind].label}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {socialDisplay(url)}
                        </span>
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
