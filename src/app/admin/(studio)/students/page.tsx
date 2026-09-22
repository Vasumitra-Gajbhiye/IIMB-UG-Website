import type { Metadata } from "next";

import { ApplicationsManager } from "@/components/admin/applications-manager";
import { requireMod } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Students",
};

export default async function AdminStudentsPage() {
  await requireMod();

  const applications = await prisma.studentApplication.findMany({
    where: { status: "PENDING" },
    include: { user: { select: { email: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold tracking-tight">
        Students
      </h1>
      <p className="mt-2 text-muted-foreground">
        Review admitted-student applications submitted during onboarding.
      </p>
      <div className="mt-8">
        <ApplicationsManager
          rows={applications.map((app) => ({
            id: app.id,
            name: app.name,
            rollNumber: app.rollNumber,
            batch: app.batch,
            track: app.track,
            email: app.user.email,
            createdAt: app.createdAt.toISOString(),
          }))}
        />
      </div>
    </div>
  );
}
