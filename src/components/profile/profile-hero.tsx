import Image from "next/image";
import { Camera, GraduationCap, ImagePlus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TRACK_LABEL } from "@/lib/constants";

type Track = keyof typeof TRACK_LABEL;

type Props = {
  name: string;
  track: Track | "";
  batch: number | null;
  bannerUrl: string | null;
  avatarUrl: string | null;
  /** Shown under the name, e.g. "@aarav-sharma". */
  handle?: string;
  isMod?: boolean;
  /** Enables the camera buttons (editor mode). */
  onEditBanner?: () => void;
  onEditAvatar?: () => void;
  busy?: { banner?: boolean; avatar?: boolean };
  actions?: React.ReactNode;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export function ProfileHero({
  name,
  track,
  batch,
  bannerUrl,
  avatarUrl,
  handle,
  isMod,
  onEditBanner,
  onEditAvatar,
  busy,
  actions,
}: Props) {
  const editable = Boolean(onEditBanner || onEditAvatar);

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="group/banner relative aspect-[3/1] min-h-28 w-full bg-linear-to-br from-primary via-primary/80 to-primary/50">
        {bannerUrl ? (
          <Image
            src={bannerUrl}
            alt=""
            fill
            priority
            sizes="(min-width: 1024px) 1024px, 100vw"
            className="object-cover"
          />
        ) : (
          <div
            aria-hidden
            className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_20%,white,transparent_40%),radial-gradient(circle_at_80%_80%,white,transparent_35%)]"
          />
        )}
        {onEditBanner ? (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={onEditBanner}
            disabled={busy?.banner}
            className="absolute right-3 top-3 gap-1.5 shadow-sm"
          >
            <ImagePlus className="size-4" aria-hidden />
            {busy?.banner ? "Uploading…" : bannerUrl ? "Change banner" : "Add banner"}
          </Button>
        ) : null}
      </div>

      <div className="px-5 pb-6 sm:px-8">
        <div className="-mt-12 flex items-end justify-between gap-4 sm:-mt-16">
          <div className="relative">
            <div className="relative size-24 overflow-hidden rounded-full border-4 border-card bg-muted shadow-sm sm:size-32">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={name ? `${name}'s profile picture` : "Profile picture"}
                  fill
                  sizes="128px"
                  className="object-cover"
                />
              ) : (
                <span className="flex size-full items-center justify-center bg-primary/10 text-3xl font-semibold text-primary sm:text-4xl">
                  {initials(name)}
                </span>
              )}
            </div>
            {onEditAvatar ? (
              <button
                type="button"
                onClick={onEditAvatar}
                disabled={busy?.avatar}
                aria-label={avatarUrl ? "Change profile picture" : "Add profile picture"}
                className="absolute bottom-1 right-1 flex size-8 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm transition hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-60"
              >
                <Camera className="size-4" aria-hidden />
              </button>
            ) : null}
          </div>
          {actions ? <div className="flex items-center gap-2 pb-1">{actions}</div> : null}
        </div>

        <div className="mt-4">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-serif text-2xl font-semibold tracking-tight sm:text-3xl">
              {name.trim() || (editable ? "Your name" : "Unnamed")}
            </h1>
            {isMod ? <Badge variant="secondary">Mod</Badge> : null}
          </div>
          {handle ? (
            <p className="mt-0.5 text-sm text-muted-foreground">{handle}</p>
          ) : null}
          <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-foreground/80">
            <GraduationCap className="size-4 text-primary" aria-hidden />
            {track || batch ? (
              <span>
                {track ? `BSc ${TRACK_LABEL[track]}` : null}
                {track && batch ? " · " : null}
                {batch ? `Class of ${batch}` : null}
              </span>
            ) : (
              <span className="text-muted-foreground">
                Add your course and batch
              </span>
            )}
            <span className="text-muted-foreground">· IIMB UG</span>
          </p>
        </div>
      </div>
    </section>
  );
}
