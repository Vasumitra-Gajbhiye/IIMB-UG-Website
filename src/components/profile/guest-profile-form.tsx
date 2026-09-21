"use client";

import { useState, useTransition } from "react";
import { Check, Lock } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveGuestProfile } from "@/lib/actions/profile";
import { NAME_MAX_LENGTH } from "@/lib/profile";

type Props = {
  initialName: string;
  initialTestYear: number | null;
  testYears: number[];
  email: string;
};

const selectClassName =
  "flex h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive dark:bg-input/30";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export function GuestProfileForm({
  initialName,
  initialTestYear,
  testYears,
  email,
}: Props) {
  const [saved, setSaved] = useState({ name: initialName, testYear: initialTestYear });
  const [name, setName] = useState(initialName);
  const [testYear, setTestYear] = useState<number | null>(initialTestYear);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, startSaving] = useTransition();

  const dirty = name !== saved.name || testYear !== saved.testYear;

  function save(e: React.FormEvent) {
    e.preventDefault();
    startSaving(async () => {
      const res = await saveGuestProfile({ name, testYear: testYear as number });
      if (!res.ok) {
        setErrors(res.field ? { [res.field]: res.error } : {});
        toast.error(res.error);
        return;
      }
      setSaved({ name: name.trim(), testYear });
      setName(name.trim());
      setErrors({});
      toast.success("Profile saved");
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="h-24 bg-linear-to-br from-primary via-primary/80 to-primary/50 sm:h-32" />
        <div className="px-5 pb-6 sm:px-8">
          <div className="-mt-10 flex size-20 items-center justify-center rounded-full border-4 border-card bg-primary/10 text-2xl font-semibold text-primary sm:-mt-12 sm:size-24 sm:text-3xl">
            {initials(name)}
          </div>
          <h1 className="mt-4 font-serif text-2xl font-semibold tracking-tight sm:text-3xl">
            {name.trim() || "Your name"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {testYear ? `Written test ${testYear}` : "Aspirant · IIMB UG"}
          </p>
        </div>
      </section>

      <form
        onSubmit={save}
        className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"
      >
        <h2 className="text-base font-semibold tracking-tight">Your details</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Tell us who you are and when you&apos;ll appear for the written test.
        </p>

        <div className="mt-5 grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="guest-name">Full name</Label>
            <Input
              id="guest-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setErrors((x) => ({ ...x, name: "" }));
              }}
              maxLength={NAME_MAX_LENGTH}
              placeholder="e.g. Aarav Sharma"
              autoComplete="name"
              aria-invalid={Boolean(errors.name)}
            />
            {errors.name ? <p className="text-xs text-destructive">{errors.name}</p> : null}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="guest-year">Written test year</Label>
            <select
              id="guest-year"
              value={testYear ?? ""}
              onChange={(e) => {
                setTestYear(e.target.value ? Number(e.target.value) : null);
                setErrors((x) => ({ ...x, testYear: "" }));
              }}
              className={selectClassName}
              aria-invalid={Boolean(errors.testYear)}
            >
              <option value="" disabled>
                Select year…
              </option>
              {testYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            {errors.testYear ? (
              <p className="text-xs text-destructive">{errors.testYear}</p>
            ) : null}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="size-3.5" aria-hidden />
            Private — only students get a public profile.
          </p>
          <Button type="submit" disabled={saving || !dirty}>
            {saving ? (
              "Saving…"
            ) : !dirty && saved.testYear ? (
              <>
                <Check className="size-4" aria-hidden /> Saved
              </>
            ) : (
              "Save"
            )}
          </Button>
        </div>
      </form>

      <p className="text-center text-xs text-muted-foreground">Signed in as {email}</p>
    </div>
  );
}
