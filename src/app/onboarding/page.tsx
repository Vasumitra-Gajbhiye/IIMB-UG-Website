import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { ensureUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Welcome",
};

export default async function OnboardingPage() {
  const session = await ensureUser();
  if (!session) redirect("/sign-in");
  if (session.onboardingCompleted) redirect("/me");

  const application = await prisma.studentApplication.findUnique({
    where: { userId: session.id },
    select: { name: true, rollNumber: true, batch: true, track: true },
  });

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-4 py-12 sm:px-6">
      <Suspense>
        <OnboardingWizard initialApplication={application} />
      </Suspense>
    </div>
  );
}
