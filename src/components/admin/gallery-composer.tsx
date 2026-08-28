"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createGalleryPost,
  presignGalleryUploads,
  type GalleryItemInput,
} from "@/lib/actions/gallery";
import {
  CAPTION_MAX_LENGTH,
  MAX_FILES_PER_POST,
  checkFile,
  formatBytes,
  resolveTakenAt,
} from "@/lib/gallery";
import { prepareFile, uploadToR2, type StagedMedia } from "@/lib/gallery-client";
import { cn } from "@/lib/utils";

export function GalleryComposer() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<StagedMedia[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [posting, setPosting] = useState(false);

  const addFiles = useCallback(async (fileList: FileList | File[]) => {
    const incoming = Array.from(fileList);
    if (incoming.length === 0) return;

    const remaining = MAX_FILES_PER_POST - items.length;
    const nextErrors: string[] = [];
    const accepted: File[] = [];

    if (remaining <= 0) {
      const message = `You can add at most ${MAX_FILES_PER_POST} files per post.`;
      setErrors((prev) => [message, ...prev].slice(0, 20));
      toast.error(message);
      return;
    }

    for (const file of incoming) {
      if (accepted.length >= remaining) {
        nextErrors.push(
          `${file.name}: skipped — this post already has ${MAX_FILES_PER_POST} files.`,
        );
        continue;
      }
      const check = checkFile(file);
      if (!check.ok) {
        nextErrors.push(check.error);
        continue;
      }
      accepted.push(file);
    }

    if (nextErrors.length) {
      setErrors((prev) => [...nextErrors, ...prev].slice(0, 20));
      for (const message of nextErrors.slice(0, 5)) toast.error(message);
    }

    if (accepted.length === 0) return;

    const prepared = await Promise.all(
      accepted.map(async (file) => {
        const result = await prepareFile(file);
        if (!result.ok) return { ok: false as const, error: result.error };
        const id = crypto.randomUUID();
        const previewUrl = URL.createObjectURL(result.media.file);
        return {
          ok: true as const,
          media: { id, previewUrl, ...result.media } satisfies StagedMedia,
        };
      }),
    );

    const ready: StagedMedia[] = [];
    const prepareErrors: string[] = [];
    for (const result of prepared) {
      if (result.ok) ready.push(result.media);
      else prepareErrors.push(result.error);
    }

    if (prepareErrors.length) {
      setErrors((prev) => [...prepareErrors, ...prev].slice(0, 20));
      for (const message of prepareErrors) toast.error(message);
    }

    if (ready.length) {
      setItems((current) => {
        const room = MAX_FILES_PER_POST - current.length;
        const toAdd = ready.slice(0, Math.max(0, room));
        const skipped = ready.slice(toAdd.length);
        for (const extra of skipped) URL.revokeObjectURL(extra.previewUrl);
        return [...current, ...toAdd];
      });
    }
  }, [items.length]);

  function removeItem(id: string) {
    setItems((current) => {
      const target = current.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return current.filter((item) => item.id !== id);
    });
  }

  function updateItem(id: string, patch: Partial<StagedMedia>) {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  async function handlePost() {
    if (items.length === 0 || posting) return;
    setPosting(true);

    const presign = await presignGalleryUploads(
      items.map((item) => ({
        contentType: item.contentType,
        sizeBytes: item.file.size,
      })),
    );

    if (!presign.ok) {
      toast.error(presign.error);
      setPosting(false);
      return;
    }

    const uploaded: GalleryItemInput[] = [];
    const failed: string[] = [];

    await Promise.all(
      items.map(async (item, index) => {
        const signed = presign.uploads[index];
        if (!signed) {
          failed.push(`${item.file.name}: could not prepare upload.`);
          updateItem(item.id, { status: "error", error: "Missing upload URL." });
          return;
        }
        updateItem(item.id, { status: "uploading", progress: 0, error: undefined });
        try {
          await uploadToR2(
            signed.uploadUrl,
            item.file,
            item.contentType,
            (percent) => updateItem(item.id, { progress: percent }),
          );
          updateItem(item.id, { status: "uploaded", progress: 100 });
          uploaded.push({
            key: signed.key,
            url: signed.publicUrl,
            contentType: item.contentType,
            sizeBytes: item.file.size,
            width: item.width,
            height: item.height,
            caption: item.caption.trim() || null,
            takenAt: resolveTakenAt({
              userDate: item.userDate,
              metadataDate: item.detectedDate,
              lastModified: item.file.lastModified,
            }).toISOString(),
            sortOrder: index,
            kind: item.kind,
          });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Upload failed.";
          failed.push(`${item.file.name}: ${message}`);
          updateItem(item.id, { status: "error", error: message });
        }
      }),
    );

    if (uploaded.length === 0) {
      toast.error("Nothing uploaded. Fix the errors and try again.");
      setPosting(false);
      return;
    }

    const created = await createGalleryPost(uploaded);
    if (!created.ok) {
      toast.error(created.error ?? "Could not publish.");
      setPosting(false);
      return;
    }

    if (failed.length) {
      toast.error(
        `${failed.length} file${failed.length === 1 ? "" : "s"} failed. The rest are live.`,
      );
    } else {
      toast.success(
        uploaded.length === 1
          ? "Posted to the gallery."
          : `${uploaded.length} files posted to the gallery.`,
      );
    }

    for (const item of items) URL.revokeObjectURL(item.previewUrl);
    router.push("/gallery");
    router.refresh();
  }

  const accept =
    "image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,video/mp4,video/webm,video/quicktime,.heic,.heif,.mov";

  return (
    <div className="space-y-6">
      <div
        onDragEnter={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          if (event.currentTarget.contains(event.relatedTarget as Node)) return;
          setDragOver(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          void addFiles(event.dataTransfer.files);
        }}
        className={cn(
          "flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          dragOver
            ? "border-primary bg-primary/5"
            : "border-border bg-muted/30",
          posting && "pointer-events-none opacity-60",
        )}
      >
        <ImagePlus className="size-8 text-muted-foreground" />
        <p className="mt-3 text-sm font-medium">
          Drag and drop photos or videos here
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Images up to 25 MB. Videos up to 200 MB. Max {MAX_FILES_PER_POST}{" "}
          files.
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-4"
          onClick={() => inputRef.current?.click()}
          disabled={posting}
        >
          <Upload />
          Select from computer
        </Button>
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          accept={accept}
          multiple
          disabled={posting}
          onChange={(event) => {
            if (event.target.files) void addFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </div>

      {errors.length > 0 ? (
        <ul className="space-y-1 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {errors.map((error, index) => (
            <li key={`${error}-${index}`}>{error}</li>
          ))}
        </ul>
      ) : null}

      {items.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="overflow-hidden rounded-xl border border-border bg-card"
            >
              <div className="relative aspect-video bg-muted">
                {item.kind === "IMAGE" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.previewUrl}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  <video
                    src={item.previewUrl}
                    className="size-full object-cover"
                    muted
                    playsInline
                    controls
                    preload="metadata"
                  />
                )}
                {item.status === "uploading" ? (
                  <div className="absolute inset-x-0 bottom-0 h-1.5 bg-black/20">
                    <div
                      className="h-full bg-primary transition-[width]"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                ) : null}
                <Button
                  type="button"
                  size="icon-sm"
                  variant="secondary"
                  className="absolute top-2 right-2"
                  aria-label={`Remove ${item.file.name}`}
                  disabled={posting}
                  onClick={() => removeItem(item.id)}
                >
                  <X />
                </Button>
              </div>
              <div className="space-y-3 p-3">
                <p className="truncate text-xs text-muted-foreground">
                  {item.file.name} · {formatBytes(item.file.size)}
                  {item.kind === "VIDEO" ? " · video" : ""}
                </p>
                {item.status === "error" && item.error ? (
                  <p className="text-xs text-destructive">{item.error}</p>
                ) : null}
                <div className="space-y-1.5">
                  <Label htmlFor={`caption-${item.id}`}>Caption</Label>
                  <Textarea
                    id={`caption-${item.id}`}
                    value={item.caption}
                    maxLength={CAPTION_MAX_LENGTH}
                    placeholder="Optional"
                    disabled={posting}
                    onChange={(event) =>
                      updateItem(item.id, { caption: event.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`date-${item.id}`}>Date</Label>
                  <Input
                    id={`date-${item.id}`}
                    type="date"
                    value={item.userDate}
                    disabled={posting}
                    onChange={(event) =>
                      updateItem(item.id, { userDate: event.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    {item.userDate
                      ? "Using the date you entered."
                      : item.detectedLabel
                        ? `If empty, we’ll use ${item.detectedLabel} from the file.`
                        : "If empty, we’ll use today’s date."}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex justify-end">
        <Button
          type="button"
          onClick={() => void handlePost()}
          disabled={items.length === 0 || posting}
        >
          {posting ? <Loader2 className="animate-spin" /> : null}
          {posting ? "Posting…" : "Post"}
        </Button>
      </div>
    </div>
  );
}
