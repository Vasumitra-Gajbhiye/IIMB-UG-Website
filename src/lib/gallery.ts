export const IMAGE_MAX_BYTES = 25 * 1024 * 1024;
export const VIDEO_MAX_BYTES = 200 * 1024 * 1024;
export const MAX_FILES_PER_POST = 40;
export const CAPTION_MAX_LENGTH = 500;
export const ALBUM_NAME_MAX_LENGTH = 80;
export const MAX_ALBUM_DATE_SPANS = 20;
export const GALLERY_TZ = "Asia/Kolkata";
export const DATE_INPUT_RE = /^\d{4}-\d{2}-\d{2}$/;

export const IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
] as const;

export const VIDEO_MIME_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
] as const;

const IMAGE_MIME = new Set<string>(IMAGE_MIME_TYPES);
const VIDEO_MIME = new Set<string>(VIDEO_MIME_TYPES);

const EXT_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  heic: "image/heic",
  heif: "image/heif",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
};

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/heic": "heic",
  "image/heif": "heif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

export type GalleryKind = "IMAGE" | "VIDEO";

export type FileCheck =
  | { ok: true; kind: GalleryKind; contentType: string }
  | { ok: false; error: string };

function extensionOf(name: string): string | null {
  const ext = name.split(".").pop()?.toLowerCase();
  return ext || null;
}

export function mimeFromFilename(name: string): string | null {
  const ext = extensionOf(name);
  return ext ? (EXT_TO_MIME[ext] ?? null) : null;
}

export function resolveContentType(file: {
  name: string;
  type: string;
}): string | null {
  const type = file.type.trim().toLowerCase();
  if (type && (IMAGE_MIME.has(type) || VIDEO_MIME.has(type))) return type;
  return mimeFromFilename(file.name);
}

export function extFromMime(contentType: string): string | null {
  return MIME_TO_EXT[contentType.toLowerCase()] ?? null;
}

export function isHeicMime(contentType: string): boolean {
  const type = contentType.toLowerCase();
  return type === "image/heic" || type === "image/heif";
}

export function checkFile(file: {
  name: string;
  type: string;
  size: number;
}): FileCheck {
  const contentType = resolveContentType(file);
  if (!contentType) {
    return {
      ok: false,
      error: `${file.name}: unsupported file type. Use JPEG, PNG, WebP, GIF, HEIC, MP4, WebM, or MOV.`,
    };
  }

  if (IMAGE_MIME.has(contentType)) {
    if (file.size > IMAGE_MAX_BYTES) {
      return {
        ok: false,
        error: `${file.name}: images must be ${formatBytes(IMAGE_MAX_BYTES)} or smaller.`,
      };
    }
    return { ok: true, kind: "IMAGE", contentType };
  }

  if (VIDEO_MIME.has(contentType)) {
    if (file.size > VIDEO_MAX_BYTES) {
      return {
        ok: false,
        error: `${file.name}: videos must be ${formatBytes(VIDEO_MAX_BYTES)} or smaller.`,
      };
    }
    return { ok: true, kind: "VIDEO", contentType };
  }

  return {
    ok: false,
    error: `${file.name}: unsupported file type.`,
  };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  const mb = bytes / (1024 * 1024);
  return `${mb >= 10 ? Math.round(mb) : mb.toFixed(1)} MB`;
}

/** Date-only input (yyyy-mm-dd) as noon IST so grouping stays on that calendar day. */
export function dateInputToTakenAt(yyyyMmDd: string): Date {
  return new Date(`${yyyyMmDd}T12:00:00+05:30`);
}

export function takenAtToDateInput(date: Date): string {
  return date.toLocaleDateString("en-CA", { timeZone: GALLERY_TZ });
}

export function galleryDayKey(date: Date): string {
  return date.toLocaleDateString("en-CA", { timeZone: GALLERY_TZ });
}

export function formatGalleryDay(date: Date): string {
  return date.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: GALLERY_TZ,
  });
}

export function formatGalleryDate(date: Date): string {
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: GALLERY_TZ,
  });
}

export function isDateInput(value: string): boolean {
  return DATE_INPUT_RE.test(value.trim());
}

export function resolveTakenAt(options: {
  userDate?: string | null;
  metadataDate?: Date | null;
  lastModified?: number | null;
}): Date {
  const user = options.userDate?.trim();
  if (user && isDateInput(user)) {
    return dateInputToTakenAt(user);
  }
  if (options.metadataDate && !Number.isNaN(options.metadataDate.getTime())) {
    return options.metadataDate;
  }
  if (options.lastModified && Number.isFinite(options.lastModified)) {
    return new Date(options.lastModified);
  }
  return new Date();
}

function addCalendarDay(yyyyMmDd: string): string {
  const next = new Date(
    dateInputToTakenAt(yyyyMmDd).getTime() + 24 * 60 * 60 * 1000,
  );
  return galleryDayKey(next);
}

export function expandAlbumDayKeys(
  spans: { startOn: Date | string; endOn: Date | string }[],
): string[] {
  const keys = new Set<string>();
  for (const span of spans) {
    const startKey = galleryDayKey(new Date(span.startOn));
    const endKey = galleryDayKey(new Date(span.endOn));
    if (endKey < startKey) continue;
    let current = startKey;
    let guard = 0;
    while (current <= endKey && guard < 3660) {
      keys.add(current);
      current = addCalendarDay(current);
      guard += 1;
    }
  }
  return [...keys].sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
}

export function formatAlbumSpan(
  startOn: Date | string,
  endOn: Date | string,
): string {
  const start = new Date(startOn);
  const end = new Date(endOn);
  if (galleryDayKey(start) === galleryDayKey(end)) {
    return formatGalleryDate(start);
  }
  return `${formatGalleryDate(start)} – ${formatGalleryDate(end)}`;
}

export function pickAlbumCover<T extends { kind: GalleryKind }>(
  items: T[],
): T | null {
  return items.find((item) => item.kind === "IMAGE") ?? items[0] ?? null;
}

export function listedAuthor(
  student:
    | { name: string; slug: string; isListed: boolean }
    | null
    | undefined,
): { authorName: string | null; authorSlug: string | null } {
  if (!student?.isListed) return { authorName: null, authorSlug: null };
  return { authorName: student.name, authorSlug: student.slug };
}
