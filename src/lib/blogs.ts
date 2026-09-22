import { PROFILE_IMAGE_MIME_TYPES } from "@/lib/profile";

export const BLOG_PAGE_SIZE = 10;
export const BLOG_TITLE_MAX = 150;
export const BLOG_EXCERPT_MAX = 200;
export const BLOG_COMMENT_MAX = 2000;
export const BLOG_IMAGE_MAX_BYTES = 8 * 1024 * 1024;
export const BLOG_IMAGE_MIME_TYPES = [...PROFILE_IMAGE_MIME_TYPES, "image/gif"] as const;

/** 16:9 cover, cropped client-side before upload. */
export const BLOG_COVER_SPEC = {
  maxBytes: BLOG_IMAGE_MAX_BYTES,
  aspect: 16 / 9,
  outWidth: 1600,
  outHeight: 900,
} as const;

/** Words a blog slug must never take (they are static routes under /blogs). */
export const RESERVED_BLOG_SLUGS = new Set(["mine"]);

export type BlogCursor = { publishedAt: string; id: string };

export function formatBlogDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

/** "just now", "5m", "3h", "2d", else a date. */
export function formatRelative(date: Date | string): string {
  const then = new Date(date).getTime();
  const seconds = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatBlogDate(date);
}

/** True when a BlockNote document has any text or media in it. */
export function hasBlogContent(content: unknown): boolean {
  if (!Array.isArray(content)) return false;
  return content.some(function visit(block: unknown): boolean {
    if (!block || typeof block !== "object") return false;
    const b = block as { type?: string; content?: unknown; children?: unknown };
    if (b.type && ["image", "video", "audio", "file", "table"].includes(b.type)) {
      return true;
    }
    if (Array.isArray(b.content)) {
      const text = b.content.some(
        (c) =>
          c &&
          typeof c === "object" &&
          typeof (c as { text?: unknown }).text === "string" &&
          (c as { text: string }).text.trim() !== "",
      );
      if (text) return true;
    }
    return Array.isArray(b.children) && b.children.some(visit);
  });
}

/** Every string URL in a BlockNote document's block props (images, files…). */
export function collectBlockUrls(content: unknown): string[] {
  const urls: string[] = [];
  const visit = (block: unknown) => {
    if (!block || typeof block !== "object") return;
    const b = block as { props?: Record<string, unknown>; children?: unknown };
    const url = b.props?.url;
    if (typeof url === "string" && url) urls.push(url);
    if (Array.isArray(b.children)) b.children.forEach(visit);
  };
  if (Array.isArray(content)) content.forEach(visit);
  return urls;
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}
