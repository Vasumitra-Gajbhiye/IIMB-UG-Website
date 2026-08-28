import exifr from "exifr";

import {
  checkFile,
  formatGalleryDate,
  isHeicMime,
  type GalleryKind,
} from "@/lib/gallery";

export type StagedMedia = {
  id: string;
  file: File;
  kind: GalleryKind;
  contentType: string;
  previewUrl: string;
  caption: string;
  userDate: string;
  detectedDate: Date | null;
  detectedLabel: string | null;
  width: number | null;
  height: number | null;
  progress: number;
  status: "ready" | "uploading" | "uploaded" | "error";
  error?: string;
};

export async function prepareFile(
  file: File,
): Promise<{ ok: true; media: Omit<StagedMedia, "id" | "previewUrl"> } | { ok: false; error: string }> {
  const initial = checkFile(file);
  if (!initial.ok) return initial;

  let working = file;
  let contentType = initial.contentType;
  const kind = initial.kind;

  if (kind === "IMAGE" && isHeicMime(contentType)) {
    try {
      working = await convertHeicToJpeg(file);
      contentType = "image/jpeg";
    } catch {
      return {
        ok: false,
        error: `${file.name}: could not convert HEIC. Try exporting as JPEG.`,
      };
    }
    const after = checkFile(working);
    if (!after.ok) return after;
  }

  const detectedDate = await readTakenAt(working, file);
  const dimensions = await readDimensions(working, kind);

  return {
    ok: true,
    media: {
      file: working,
      kind,
      contentType,
      caption: "",
      userDate: "",
      detectedDate,
      detectedLabel: detectedDate ? formatGalleryDate(detectedDate) : null,
      width: dimensions.width,
      height: dimensions.height,
      progress: 0,
      status: "ready",
    },
  };
}

async function convertHeicToJpeg(file: File): Promise<File> {
  const { heicTo } = await import("heic-to");
  const blob = await heicTo({
    blob: file,
    type: "image/jpeg",
    quality: 0.9,
  });
  const name = file.name.replace(/\.hei[cf]$/i, ".jpg");
  return new File([blob], name.endsWith(".jpg") ? name : `${file.name}.jpg`, {
    type: "image/jpeg",
    lastModified: file.lastModified,
  });
}

async function readTakenAt(working: File, original: File): Promise<Date | null> {
  try {
    const exif = await exifr.parse(original, {
      pick: ["DateTimeOriginal", "CreateDate"],
    });
    const raw = exif?.DateTimeOriginal ?? exif?.CreateDate;
    if (raw instanceof Date && !Number.isNaN(raw.getTime())) return raw;
  } catch {
    // no EXIF
  }
  if (original.lastModified) return new Date(original.lastModified);
  if (working.lastModified) return new Date(working.lastModified);
  return null;
}

async function readDimensions(
  file: File,
  kind: GalleryKind,
): Promise<{ width: number | null; height: number | null }> {
  if (kind === "IMAGE") {
    try {
      const bitmap = await createImageBitmap(file);
      const width = bitmap.width;
      const height = bitmap.height;
      bitmap.close();
      return { width, height };
    } catch {
      return { width: null, height: null };
    }
  }

  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.onloadedmetadata = () => {
      const width = video.videoWidth || null;
      const height = video.videoHeight || null;
      URL.revokeObjectURL(url);
      resolve({ width, height });
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ width: null, height: null });
    };
    video.src = url;
  });
}

export function uploadToR2(
  uploadUrl: string,
  file: File,
  contentType: string,
  onProgress: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve();
      } else {
        reject(new Error(`Upload failed (${xhr.status})`));
      }
    };
    xhr.onerror = () => reject(new Error("Network error while uploading"));
    xhr.send(file);
  });
}
