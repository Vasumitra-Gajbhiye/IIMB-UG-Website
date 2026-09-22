import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { UserButton } from "@clerk/nextjs";

import { ApplicationStatusCard } from "@/components/profile/application-status-card";
import { GuestProfileForm } from "@/components/profile/guest-profile-form";
import { ResetOnboardingButton } from "@/components/profile/reset-onboarding-button";
import {
  StudentProfileEditor,
  type StudentProfileValues,
} from "@/components/profile/student-profile-editor";
import { ensureUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { testYearOptions } from "@/lib/profile";

export const metadata: Metadata = {
  title: "My profile",
};

function siteHost() {
  try {
    return new URL(
      process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
    ).host;
  } catch {
    return "localhost:3000";
  }
}

/** Only same-site paths, never `//host` or absolute URLs. */
function safeNext(value: string | string[] | undefined): string | null {
  const next = Array.isArray(value) ? value[0] : value;
  if (!next || !next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}

export default async function MePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const next = safeNext((await searchParams).next);
  const session = await ensureUser();
  if (!session) redirect("/sign-in");
  if (!session.onboardingCompleted) redirect("/onboarding");

  let body: React.ReactNode;
  let rollNumber: string | null = null;

  if (session.isAllowlisted) {
    const student = await prisma.student.findUnique({
      where: { email: session.email },
    });
    rollNumber = student?.rollNumber ?? null;
    const initial: StudentProfileValues = {
      name: student?.name ?? "",
      track: student?.track ?? "",
      batch: student?.batch ?? null,
      slug: student?.slug ?? "",
      bio: student?.bio ?? "",
      instagram: student?.instagramUrl ?? "",
      linkedin: student?.linkedinUrl ?? "",
      github: student?.githubUrl ?? "",
      avatarUrl: student?.avatarUrl ?? null,
      bannerUrl: student?.bannerUrl ?? null,
    };
    body = (
      <StudentProfileEditor
        initial={initial}
        hasProfile={Boolean(student)}
        email={session.email}
        isMod={session.isMod}
        siteHost={siteHost()}
        returnTo={next}
      />
    );
  } else {
    const application = await prisma.studentApplication.findUnique({
      where: { userId: session.id },
    });

    if (application && application.status !== "APPROVED") {
      body = (
        <ApplicationStatusCard
          application={{
            status: application.status,
            name: application.name,
            rollNumber: application.rollNumber,
            batch: application.batch,
            track: application.track,
            rejectReason: application.rejectReason,
          }}
          email={session.email}
        />
      );
    } else {
      const user = await prisma.user.findUnique({
        where: { id: session.id },
        select: { name: true, testYear: true },
      });
      const years = testYearOptions();
      body = (
        <GuestProfileForm
          initialName={user?.name ?? ""}
          initialTestYear={user?.testYear ?? null}
          testYears={
            user?.testYear && !years.includes(user.testYear)
              ? [user.testYear, ...years]
              : years
          }
          email={session.email}
        />
      );
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-medium text-muted-foreground">
            My profile
          </h2>
          {session.isMod ? (
            <Link
              href="/admin"
              className="text-sm text-primary underline-offset-4 hover:underline"
            >
              Open studio
            </Link>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          {session.isMod ? <ResetOnboardingButton /> : null}
          <UserButton />
        </div>
      </div>
      {rollNumber ? (
        <p className="mb-4 text-sm text-muted-foreground">
          Roll number: <span className="font-medium text-foreground">{rollNumber}</span>
        </p>
      ) : null}
      {body}
    </div>
  );
}
