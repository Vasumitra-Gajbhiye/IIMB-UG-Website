"use client";

import Link from "next/link";
import { useMemo, useRef, useState, useTransition } from "react";
import { Check, Copy, ExternalLink, Lock, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { SOCIAL_ICONS } from "@/components/profile/brand-icons";
import { ImageCropperDialog } from "@/components/profile/image-cropper-dialog";
import { ProfileHero } from "@/components/profile/profile-hero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  presignProfileImage,
  saveStudentProfile,
} from "@/lib/actions/profile";
import { BATCH_YEARS, TRACK_LABEL } from "@/lib/constants";
import {
  BIO_MAX_LENGTH,
  NAME_MAX_LENGTH,
  PROFILE_IMAGE_MIME_TYPES,
  PROFILE_IMAGE_SPECS,
  SLUG_MAX_LENGTH,
  SOCIAL_META,
  sanitizeSlugInput,
  slugFromName,
  type ProfileImageKind,
  type SocialKind,
} from "@/lib/profile";
import { cn } from "@/lib/utils";

type Track = keyof typeof TRACK_LABEL;

export type StudentProfileValues = {
  name: string;
  track: Track | "";
  batch: number | null;
  slug: string;
  bio: string;
  instagram: string;
  linkedin: string;
  github: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
};

type Props = {
  initial: StudentProfileValues;
  /** True once a Student row exists (so the public page is live). */
  hasProfile: boolean;
  email: string;
  isMod: boolean;
  siteHost: string;
};

const selectClassName =
  "flex h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive dark:bg-input/30";

const SOCIALS: SocialKind[] = ["instagram", "linkedin", "github"];

export function StudentProfileEditor({
  initial,
  hasProfile,
  email,
  isMod,
  siteHost,
}: Props) {
  const [saved, setSaved] = useState(initial);
  const [values, setValues] = useState(initial);
  const [live, setLive] = useState(hasProfile);
  const [slugTouched, setSlugTouched] = useState(hasProfile);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, startSaving] = useTransition();
  const [copied, setCopied] = useState(false);

  const [pending, setPending] = useState<{ kind: ProfileImageKind; file: File } | null>(null);
  const [uploading, setUploading] = useState<Partial<Record<ProfileImageKind, boolean>>>({});
  const avatarInput = useRef<HTMLInputElement>(null);
  const bannerInput = useRef<HTMLInputElement>(null);

  const dirty = useMemo(
    () => (Object.keys(saved) as (keyof StudentProfileValues)[]).some((k) => saved[k] !== values[k]),
    [saved, values],
  );

  function set<K extends keyof StudentProfileValues>(key: K, value: StudentProfileValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => (e[key] ? { ...e, [key]: "" } : e));
  }

  function setName(name: string) {
    setValues((v) => ({
      ...v,
      name,
      slug: slugTouched ? v.slug : slugFromName(name),
    }));
    setErrors((e) => ({ ...e, name: "" }));
  }

  function pickFile(kind: ProfileImageKind, file: File | undefined) {
    if (!file) return;
    const spec = PROFILE_IMAGE_SPECS[kind];
    if (!(PROFILE_IMAGE_MIME_TYPES as readonly string[]).includes(file.type)) {
      toast.error("Use a JPG, PNG or WebP image.");
      return;
    }
    if (file.size > spec.maxBytes) {
      toast.error(`Image must be under ${spec.maxBytes / 1024 / 1024} MB.`);
      return;
    }
    setPending({ kind, file });
  }

  async function uploadCropped(kind: ProfileImageKind, blob: Blob) {
    setPending(null);
    setUploading((u) => ({ ...u, [kind]: true }));
    try {
      const presigned = await presignProfileImage({
        kind,
        contentType: blob.type,
        sizeBytes: blob.size,
      });
      if (!presigned.ok) throw new Error(presigned.error);
      const res = await fetch(presigned.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": blob.type },
        body: blob,
      });
      if (!res.ok) throw new Error(`Upload failed (${res.status})`);
      set(kind === "avatar" ? "avatarUrl" : "bannerUrl", presigned.publicUrl);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading((u) => ({ ...u, [kind]: false }));
    }
  }

  function save() {
    startSaving(async () => {
      const res = await saveStudentProfile({
        name: values.name,
        track: values.track as Track,
        batch: values.batch as number,
        slug: values.slug,
        bio: values.bio,
        instagram: values.instagram,
        linkedin: values.linkedin,
        github: values.github,
        avatarUrl: values.avatarUrl,
        bannerUrl: values.bannerUrl,
      });
      if (!res.ok) {
        setErrors(res.field ? { [res.field]: res.error } : {});
        toast.error(res.error);
        return;
      }
      const next = { ...values, slug: res.slug ?? values.slug };
      setValues(next);
      setSaved(next);
      setSlugTouched(true);
      setLive(true);
      setErrors({});
      toast.success("Profile saved");
    });
  }

  function discard() {
    setValues(saved);
    setErrors({});
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/${saved.slug}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Could not copy the link.");
    }
  }

  const checklist = [
    { label: "Name", done: values.name.trim().length > 0 },
    { label: "Course & batch", done: Boolean(values.track && values.batch) },
    { label: "Profile picture", done: Boolean(values.avatarUrl) },
    { label: "Banner", done: Boolean(values.bannerUrl) },
    { label: "Bio", done: values.bio.trim().length > 0 },
    {
      label: "A social link",
      done: SOCIALS.some((s) => values[s].trim().length > 0),
    },
  ];
  const doneCount = checklist.filter((c) => c.done).length;
  const pct = Math.round((doneCount / checklist.length) * 100);

  return (
    <div className="space-y-6 pb-24">
      <ProfileHero
        name={values.name}
        track={values.track}
        batch={values.batch}
        bannerUrl={values.bannerUrl}
        avatarUrl={values.avatarUrl}
        handle={values.slug ? `@${values.slug}` : undefined}
        isMod={isMod}
        busy={uploading}
        onEditAvatar={() => avatarInput.current?.click()}
        onEditBanner={() => bannerInput.current?.click()}
        actions={
          live ? (
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link href={`/${saved.slug}`}>
                View public profile
                <ExternalLink className="size-3.5" aria-hidden />
              </Link>
            </Button>
          ) : null
        }
      />

      {(["avatar", "banner"] as const).map((kind) => (
        <input
          key={kind}
          ref={kind === "avatar" ? avatarInput : bannerInput}
          type="file"
          accept={PROFILE_IMAGE_MIME_TYPES.join(",")}
          className="sr-only"
          tabIndex={-1}
          aria-label={kind === "avatar" ? "Upload profile picture" : "Upload banner"}
          onChange={(e) => {
            pickFile(kind, e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      ))}

      <ImageCropperDialog
        kind={pending?.kind ?? "avatar"}
        file={pending?.file ?? null}
        onCancel={() => setPending(null)}
        onConfirm={(blob) => pending && uploadCropped(pending.kind, blob)}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          <Card title="About" description="This is what people see at the top of your public profile.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" error={errors.name} className="sm:col-span-2">
                <Input
                  value={values.name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={NAME_MAX_LENGTH}
                  placeholder="e.g. Aarav Sharma"
                  autoComplete="name"
                  aria-invalid={Boolean(errors.name)}
                />
              </Field>
              <Field label="Course" error={errors.track}>
                <select
                  value={values.track}
                  onChange={(e) => set("track", e.target.value as Track)}
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
              </Field>
              <Field label="Batch" error={errors.batch}>
                <select
                  value={values.batch ?? ""}
                  onChange={(e) =>
                    set("batch", e.target.value ? Number(e.target.value) : null)
                  }
                  className={selectClassName}
                  aria-invalid={Boolean(errors.batch)}
                >
                  <option value="" disabled>
                    Select year…
                  </option>
                  {BATCH_YEARS.map((y) => (
                    <option key={y} value={y}>
                      Class of {y}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                label="Bio"
                error={errors.bio}
                className="sm:col-span-2"
                hint={`${values.bio.length}/${BIO_MAX_LENGTH}`}
              >
                <Textarea
                  value={values.bio}
                  onChange={(e) => set("bio", e.target.value)}
                  maxLength={BIO_MAX_LENGTH}
                  rows={4}
                  placeholder="A line or two about you — interests, what you're building, what you're curious about."
                  aria-invalid={Boolean(errors.bio)}
                />
              </Field>
            </div>
          </Card>

          <Card title="Social links" description="Paste a link or just your handle. Shown as icons on your profile.">
            <div className="grid gap-4">
              {SOCIALS.map((kind) => {
                const Icon = SOCIAL_ICONS[kind];
                const meta = SOCIAL_META[kind];
                return (
                  <Field key={kind} label={meta.label} error={errors[kind]}>
                    <div className="relative">
                      <Icon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={values[kind]}
                        onChange={(e) => set(kind, e.target.value)}
                        placeholder={meta.placeholder}
                        className="pl-8"
                        inputMode="url"
                        autoCapitalize="none"
                        spellCheck={false}
                        aria-invalid={Boolean(errors[kind])}
                      />
                    </div>
                  </Field>
                );
              })}
            </div>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card title="Profile link" description="Your public address on this site.">
            <Field label="Username" error={errors.slug}>
              <div
                className={cn(
                  "flex h-9 items-center overflow-hidden rounded-lg border border-input text-sm focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30",
                  errors.slug && "border-destructive",
                )}
              >
                <span className="select-none whitespace-nowrap border-r border-input bg-muted px-2.5 py-2 text-muted-foreground">
                  {siteHost}/
                </span>
                <input
                  value={values.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    set("slug", sanitizeSlugInput(e.target.value));
                  }}
                  maxLength={SLUG_MAX_LENGTH}
                  placeholder="your-name"
                  spellCheck={false}
                  autoCapitalize="none"
                  aria-invalid={Boolean(errors.slug)}
                  className="min-w-0 flex-1 bg-transparent px-2.5 outline-none"
                />
              </div>
            </Field>
            {live ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={copyLink}
                className="mt-3 w-full gap-1.5"
              >
                {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
                {copied ? "Copied" : "Copy profile link"}
              </Button>
            ) : (
              <p className="mt-3 text-xs text-muted-foreground">
                Your profile goes live at this link when you save.
              </p>
            )}
          </Card>

          <Card title="Profile strength">
            <div className="flex items-center gap-3">
              <div
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Profile completeness"
                className="h-2 flex-1 overflow-hidden rounded-full bg-muted"
              >
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-sm font-medium tabular-nums">{pct}%</span>
            </div>
            <ul className="mt-4 space-y-2 text-sm">
              {checklist.map((c) => (
                <li
                  key={c.label}
                  className={cn(
                    "flex items-center gap-2",
                    c.done ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-4 items-center justify-center rounded-full border",
                      c.done
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border",
                    )}
                  >
                    {c.done ? <Check className="size-3" aria-hidden /> : null}
                  </span>
                  {c.label}
                </li>
              ))}
            </ul>
            {pct === 100 ? (
              <p className="mt-4 flex items-center gap-1.5 text-xs text-primary">
                <Sparkles className="size-3.5" aria-hidden /> All set — nice profile.
              </p>
            ) : null}
          </Card>

          <p className="flex items-start gap-2 px-1 text-xs text-muted-foreground">
            <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            <span>
              Your email ({email}) is never shown on your public profile.
            </span>
          </p>
        </aside>
      </div>

      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur transition-transform duration-200 supports-backdrop-filter:bg-background/85",
          dirty ? "translate-y-0" : "translate-y-full",
        )}
        aria-hidden={!dirty}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <p className="text-sm text-muted-foreground">You have unsaved changes</p>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={discard} disabled={saving} tabIndex={dirty ? 0 : -1}>
              Discard
            </Button>
            <Button
              type="button"
              onClick={save}
              disabled={saving || uploading.avatar || uploading.banner}
              tabIndex={dirty ? 0 : -1}
            >
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      {description ? (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      ) : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  error,
  hint,
  className,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <div className="flex items-baseline justify-between">
        <Label>{label}</Label>
        {hint ? <span className="text-xs tabular-nums text-muted-foreground">{hint}</span> : null}
      </div>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
