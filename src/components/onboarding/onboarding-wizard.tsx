"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  completeAspirantOnboarding,
  submitStudentApplication,
} from "@/lib/actions/onboarding";
import { BATCH_YEARS, TRACK_LABEL } from "@/lib/constants";
import { NAME_MAX_LENGTH, ROLL_NUMBER_MAX_LENGTH, testYearOptions } from "@/lib/profile";

type Track = keyof typeof TRACK_LABEL;

type Step =
  | "role"
  | "year"
  | "aspirant-name"
  | "student-name"
  | "roll"
  | "batch"
  | "course";

const STEPS = new Set<Step>([
  "role",
  "year",
  "aspirant-name",
  "student-name",
  "roll",
  "batch",
  "course",
]);

function isStep(value: string | null): value is Step {
  return value !== null && STEPS.has(value as Step);
}

type Props = {
  initialApplication: {
    name: string;
    rollNumber: string;
    batch: number;
    track: Track;
  } | null;
};

const selectClassName =
  "flex h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive dark:bg-input/30";

export function OnboardingWizard({ initialApplication }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const step = isStep(searchParams.get("step")) ? (searchParams.get("step") as Step) : "role";
  const [role, setRole] = useState<"ASPIRANT" | "ADMITTED_STUDENT" | null>(null);

  const [name, setName] = useState(initialApplication?.name ?? "");
  const [dontKnowYear, setDontKnowYear] = useState(false);
  const [testYear, setTestYear] = useState<number | null>(null);
  const [rollNumber, setRollNumber] = useState(initialApplication?.rollNumber ?? "");
  const [batch, setBatch] = useState<number | null>(initialApplication?.batch ?? null);
  const [track, setTrack] = useState<Track | "">(initialApplication?.track ?? "");

  const [error, setError] = useState<string>();
  const [submitting, startSubmitting] = useTransition();

  function go(next: Step) {
    setError(undefined);
    router.push(`/onboarding?step=${next}`, { scroll: false });
  }

  function submitAspirant() {
    startSubmitting(async () => {
      const res = await completeAspirantOnboarding({
        name,
        testYear: dontKnowYear ? null : testYear,
      });
      if (!res.ok) {
        setError(res.error);
        toast.error(res.error);
        return;
      }
      router.push("/me");
    });
  }

  function submitStudent() {
    startSubmitting(async () => {
      const res = await submitStudentApplication({
        name,
        rollNumber,
        batch: batch as number,
        track: track as Track,
      });
      if (!res.ok) {
        setError(res.error);
        toast.error(res.error);
        return;
      }
      router.push("/me");
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <div
        key={step}
        className="animate-in fade-in-0 slide-in-from-right-4 duration-300"
      >
        {step === "role" ? (
          <StepShell title="Welcome to IIMB UG" description="Let's set up your account — one question at a time.">
            <RadioGroup
              value={role ?? ""}
              onValueChange={(v) => setRole(v as "ASPIRANT" | "ADMITTED_STUDENT")}
              className="gap-3"
            >
              <RoleOption
                id="role-aspirant"
                value="ASPIRANT"
                title="I'm an aspirant"
                description="Planning to take the UG written test."
                checked={role === "ASPIRANT"}
              />
              <RoleOption
                id="role-student"
                value="ADMITTED_STUDENT"
                title="I'm an admitted student"
                description="I already have a seat in the programme."
                checked={role === "ADMITTED_STUDENT"}
              />
            </RadioGroup>
            <Continue
              disabled={!role}
              onClick={() => go(role === "ASPIRANT" ? "year" : "student-name")}
            />
          </StepShell>
        ) : null}

        {step === "year" ? (
          <StepShell title="Written test year" description="When do you plan to take the UG written test?">
            <div className="space-y-3">
              <select
                value={dontKnowYear ? "" : (testYear ?? "")}
                onChange={(e) => {
                  setDontKnowYear(false);
                  setTestYear(e.target.value ? Number(e.target.value) : null);
                }}
                className={selectClassName}
                disabled={dontKnowYear}
              >
                <option value="" disabled>
                  Select year…
                </option>
                {testYearOptions().map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={dontKnowYear}
                  onChange={(e) => {
                    setDontKnowYear(e.target.checked);
                    if (e.target.checked) setTestYear(null);
                  }}
                  className="size-4 rounded border-input"
                />
                I don&apos;t know yet
              </label>
            </div>
            <Continue
              disabled={!dontKnowYear && testYear === null}
              onClick={() => go("aspirant-name")}
            />
            <Back onClick={() => go("role")} />
          </StepShell>
        ) : null}

        {step === "aspirant-name" ? (
          <StepShell title="Your name" description="What should we call you?">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={NAME_MAX_LENGTH}
              placeholder="e.g. Aarav Sharma"
              autoComplete="name"
              autoFocus
            />
            {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
            <Continue
              disabled={!name.trim() || submitting}
              onClick={submitAspirant}
              label={submitting ? "Saving…" : "Finish"}
            />
            <Back onClick={() => go("year")} />
          </StepShell>
        ) : null}

        {step === "student-name" ? (
          <StepShell title="Your name" description="What's your full name?">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={NAME_MAX_LENGTH}
              placeholder="e.g. Aarav Sharma"
              autoComplete="name"
              autoFocus
            />
            <Continue disabled={!name.trim()} onClick={() => go("roll")} />
            <Back onClick={() => go("role")} />
          </StepShell>
        ) : null}

        {step === "roll" ? (
          <StepShell title="Roll number" description="Your IIMB UG roll number.">
            <Input
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
              maxLength={ROLL_NUMBER_MAX_LENGTH}
              placeholder="e.g. UG24001"
              autoFocus
            />
            <Continue disabled={!rollNumber.trim()} onClick={() => go("batch")} />
            <Back onClick={() => go("student-name")} />
          </StepShell>
        ) : null}

        {step === "batch" ? (
          <StepShell title="Batch" description="Which batch are you in?">
            <select
              value={batch ?? ""}
              onChange={(e) => setBatch(e.target.value ? Number(e.target.value) : null)}
              className={selectClassName}
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
            <Continue disabled={!batch} onClick={() => go("course")} />
            <Back onClick={() => go("roll")} />
          </StepShell>
        ) : null}

        {step === "course" ? (
          <StepShell title="Course" description="Which programme are you in?">
            <RadioGroup
              value={track}
              onValueChange={(v) => setTrack(v as Track)}
              className="gap-3"
            >
              {(Object.keys(TRACK_LABEL) as Track[]).map((t) => (
                <RoleOption
                  key={t}
                  id={`course-${t}`}
                  value={t}
                  title={`BSc ${TRACK_LABEL[t]}`}
                  checked={track === t}
                />
              ))}
            </RadioGroup>
            {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
            <Continue
              disabled={!track || submitting}
              onClick={submitStudent}
              label={submitting ? "Submitting…" : "Submit for review"}
            />
            <Back onClick={() => go("batch")} />
          </StepShell>
        ) : null}
      </div>
    </div>
  );
}

function StepShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold tracking-tight">{title}</h1>
      {description ? (
        <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
      ) : null}
      <div className="mt-6">{children}</div>
    </div>
  );
}

function RoleOption({
  id,
  value,
  title,
  description,
  checked,
}: {
  id: string;
  value: string;
  title: string;
  description?: string;
  checked: boolean;
}) {
  return (
    <Label
      htmlFor={id}
      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
        checked ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
      }`}
    >
      <RadioGroupItem id={id} value={value} className="mt-0.5" />
      <span>
        <span className="block text-sm font-medium">{title}</span>
        {description ? (
          <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
        ) : null}
      </span>
    </Label>
  );
}

function Continue({
  onClick,
  disabled,
  label = "Continue",
}: {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <Button type="button" onClick={onClick} disabled={disabled} className="mt-6 w-full">
      {label}
    </Button>
  );
}

function Back({ onClick }: { onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      className="mt-2 w-full text-muted-foreground"
    >
      Back
    </Button>
  );
}
