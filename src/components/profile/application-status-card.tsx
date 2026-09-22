"use client";

import { useState, useTransition } from "react";
import { Clock, Lock } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitStudentApplication } from "@/lib/actions/onboarding";
import { BATCH_YEARS, TRACK_LABEL } from "@/lib/constants";
import { NAME_MAX_LENGTH, ROLL_NUMBER_MAX_LENGTH } from "@/lib/profile";

type Track = keyof typeof TRACK_LABEL;

type Application = {
  status: "PENDING" | "REJECTED";
  name: string;
  rollNumber: string;
  batch: number;
  track: Track;
  rejectReason: string | null;
};

const selectClassName =
  "flex h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive dark:bg-input/30";

export function ApplicationStatusCard({
  application,
  email,
}: {
  application: Application;
  email: string;
}) {
  if (application.status === "PENDING") {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Clock className="size-6" aria-hidden />
          </div>
          <h1 className="mt-4 font-serif text-xl font-semibold tracking-tight">
            Your profile is under review
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We&apos;re verifying {application.name}&apos;s admission details
            ({application.rollNumber}, Class of {application.batch}, BSc{" "}
            {TRACK_LABEL[application.track]}). This usually doesn&apos;t take
            long — check back soon.
          </p>
        </section>
        <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
          <Lock className="size-3.5" aria-hidden />
          Signed in as {email}
        </p>
      </div>
    );
  }

  return <ResubmitForm application={application} email={email} />;
}

function ResubmitForm({
  application,
  email,
}: {
  application: Application;
  email: string;
}) {
  const [name, setName] = useState(application.name);
  const [rollNumber, setRollNumber] = useState(application.rollNumber);
  const [batch, setBatch] = useState<number | null>(application.batch);
  const [track, setTrack] = useState<Track | "">(application.track);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, startSaving] = useTransition();

  function resubmit(e: React.FormEvent) {
    e.preventDefault();
    startSaving(async () => {
      const res = await submitStudentApplication({
        name,
        rollNumber,
        batch: batch as number,
        track: track as Track,
      });
      if (!res.ok) {
        setErrors(res.field ? { [res.field]: res.error } : {});
        toast.error(res.error);
        return;
      }
      toast.success("Resubmitted for review");
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <section className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-destructive">
          Your application wasn&apos;t approved
        </h2>
        {application.rejectReason ? (
          <p className="mt-1 text-sm text-muted-foreground">{application.rejectReason}</p>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">
            No reason was given. Double-check your details below and resubmit.
          </p>
        )}
      </section>

      <form
        onSubmit={resubmit}
        className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"
      >
        <h2 className="text-base font-semibold tracking-tight">Your details</h2>
        <div className="mt-5 grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="resubmit-name">Full name</Label>
            <Input
              id="resubmit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={NAME_MAX_LENGTH}
              aria-invalid={Boolean(errors.name)}
            />
            {errors.name ? <p className="text-xs text-destructive">{errors.name}</p> : null}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="resubmit-roll">Roll number</Label>
            <Input
              id="resubmit-roll"
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
              maxLength={ROLL_NUMBER_MAX_LENGTH}
              aria-invalid={Boolean(errors.rollNumber)}
            />
            {errors.rollNumber ? (
              <p className="text-xs text-destructive">{errors.rollNumber}</p>
            ) : null}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="resubmit-batch">Batch</Label>
            <select
              id="resubmit-batch"
              value={batch ?? ""}
              onChange={(e) => setBatch(e.target.value ? Number(e.target.value) : null)}
              className={selectClassName}
              aria-invalid={Boolean(errors.batch)}
            >
              <option value="" disabled>
                Select batch…
              </option>
              {BATCH_YEARS.map((y) => (
                <option key={y} value={y}>
                  Class of {y}
                </option>
              ))}
            </select>
            {errors.batch ? <p className="text-xs text-destructive">{errors.batch}</p> : null}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="resubmit-track">Course</Label>
            <select
              id="resubmit-track"
              value={track}
              onChange={(e) => setTrack(e.target.value as Track)}
              className={selectClassName}
              aria-invalid={Boolean(errors.track)}
            >
              <option value="" disabled>
                Select course…
              </option>
              {(Object.keys(TRACK_LABEL) as Track[]).map((t) => (
                <option key={t} value={t}>
                  BSc {TRACK_LABEL[t]}
                </option>
              ))}
            </select>
            {errors.track ? <p className="text-xs text-destructive">{errors.track}</p> : null}
          </div>
        </div>
        <div className="mt-6 flex items-center justify-between gap-3">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="size-3.5" aria-hidden />
            Signed in as {email}
          </p>
          <Button type="submit" disabled={saving}>
            {saving ? "Resubmitting…" : "Resubmit for review"}
          </Button>
        </div>
      </form>
    </div>
  );
}
