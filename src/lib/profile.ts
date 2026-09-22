export const NAME_MAX_LENGTH = 80;
export const BIO_MAX_LENGTH = 280;
export const SLUG_MIN_LENGTH = 3;
export const SLUG_MAX_LENGTH = 40;
export const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
export const ROLL_NUMBER_MAX_LENGTH = 32;

export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
export const BANNER_MAX_BYTES = 8 * 1024 * 1024;
export const PROFILE_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type ProfileImageKind = "avatar" | "banner";

export const PROFILE_IMAGE_SPECS = {
  avatar: { maxBytes: AVATAR_MAX_BYTES, aspect: 1, outWidth: 512, outHeight: 512 },
  banner: { maxBytes: BANNER_MAX_BYTES, aspect: 3, outWidth: 1500, outHeight: 500 },
} as const;

/** Top-level routes (and other words) a profile slug must never shadow. */
export const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "blogs",
  "directory",
  "faq",
  "gallery",
  "me",
  "not-allowlisted",
  "not-found",
  "proposals",
  "sign-in",
  "sign-up",
  "settings",
  "profile",
  "profiles",
  "students",
  "student",
  "static",
  "public",
  "login",
  "logout",
  "about",
  "help",
  "support",
  "iimb",
  "iimb-ug",
  "sitemap",
  "robots",
]);

export function validateSlug(slug: string): string | null {
  if (slug.length < SLUG_MIN_LENGTH || slug.length > SLUG_MAX_LENGTH) {
    return `Username must be ${SLUG_MIN_LENGTH}–${SLUG_MAX_LENGTH} characters.`;
  }
  if (!SLUG_RE.test(slug)) {
    return "Use lowercase letters, numbers and hyphens only.";
  }
  if (RESERVED_SLUGS.has(slug)) return "That username is reserved.";
  return null;
}

/** Live-typing cleanup for the username field. */
export function sanitizeSlugInput(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .slice(0, SLUG_MAX_LENGTH);
}

export type SocialKind = "instagram" | "linkedin" | "github";

export const SOCIAL_META: Record<
  SocialKind,
  { label: string; host: string; placeholder: string; handlePath: string }
> = {
  instagram: {
    label: "Instagram",
    host: "instagram.com",
    placeholder: "@handle or profile link",
    handlePath: "",
  },
  linkedin: {
    label: "LinkedIn",
    host: "linkedin.com",
    placeholder: "linkedin.com/in/your-name",
    handlePath: "in/",
  },
  github: {
    label: "GitHub",
    host: "github.com",
    placeholder: "@username or profile link",
    handlePath: "",
  },
};

/**
 * Accepts a handle or a URL and returns a canonical https URL on the expected
 * host. Empty input -> null. Anything else -> undefined (invalid).
 */
export function normalizeSocial(
  kind: SocialKind,
  raw: string,
): string | null | undefined {
  const input = raw.trim();
  if (!input) return null;
  const { host, handlePath } = SOCIAL_META[kind];

  const handle = input.replace(/^@/, "");
  if (/^[A-Za-z0-9._-]{1,60}$/.test(handle)) {
    return `https://${kind === "linkedin" ? "www." : ""}${host}/${handlePath}${handle}`;
  }

  try {
    const url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
    const hostname = url.hostname.toLowerCase();
    if (hostname !== host && !hostname.endsWith(`.${host}`)) return undefined;
    const path = url.pathname.replace(/\/+$/, "");
    if (!path) return undefined;
    return `https://${hostname}${path}`;
  } catch {
    return undefined;
  }
}

/** Short display form: "@handle" / "in/name". */
export function socialDisplay(url: string): string {
  try {
    const { pathname } = new URL(url);
    return pathname.replace(/^\/+|\/+$/g, "");
  } catch {
    return url;
  }
}

/** Written-test year options: this year through four years out. */
export function testYearOptions(now = new Date()): number[] {
  const start = now.getFullYear();
  return Array.from({ length: 5 }, (_, i) => start + i);
}

/** Client-safe username suggestion from a display name ("" when nothing usable). */
export function slugFromName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX_LENGTH)
    .replace(/-+$/, "");
}
