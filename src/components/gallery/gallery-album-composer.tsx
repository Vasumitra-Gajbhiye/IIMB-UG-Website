"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Plus, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createGalleryAlbum,
  presignGalleryUploads,
  type AlbumDateSpanInput,
  type GalleryItemInput,
} from "@/lib/actions/gallery";
import {
  ALBUM_NAME_MAX_LENGTH,
  CAPTION_MAX_LENGTH,
  MAX_ALBUM_DATE_SPANS,
  MAX_FILES_PER_POST,
  checkFile,
  dateInputToTakenAt,
  formatBytes,
  isDateInput,
} from "@/lib/gallery";
import { prepareFile, uploadToR2, type StagedMedia } from "@/lib/gallery-client";
import { cn } from "@/lib/utils";

type SpanDraft = {
  id: string;
  mode: "single" | "range";
  startOn: string;
  endOn: string;
};

function emptySpan(mode: SpanDraft["mode"]): SpanDraft {
  return { id: crypto.randomUUID(), mode, startOn: "", endOn: "" };
}

function spanIsValid(span: SpanDraft): boolean {
  if (!isDateInput(span.startOn)) return false;
  if (span.mode === "single") return true;
  return isDateInput(span.endOn) && span.endOn >= span.startOn;
}

function toSpanInput(span: SpanDraft): AlbumDateSpanInput {
  return {
    startOn: span.startOn,
    endOn: span.mode === "single" ? span.startOn : span.endOn,
  };
}

export function GalleryAlbumComposer({
  onPosted,
}: {
  onPosted?: () => void;
} = {}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [spans, setSpans] = useState<SpanDraft[]>([emptySpan("single")]);
  const [items, setItems] = useState<StagedMedia[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [posting, setPosting] = useState(false);

  const addFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const incoming = Array.from(fileList);
      if (incoming.length === 0) return;

      const remaining = MAX_FILES_PER_POST - items.length;
      const nextErrors: string[] = [];
      const accepted: File[] = [];

      if (remaining <= 0) {
        const message = `You can add at most ${MAX_FILES_PER_POST} files per album.`;
        setErrors((prev) => [message, ...prev].slice(0, 20));
        toast.error(message);
        return;
      }

      for (const file of incoming) {
        if (accepted.length >= remaining) {
          nextErrors.push(
            `${file.name}: skipped — this album already has ${MAX_FILES_PER_POST} files.`,
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
    },
    [items.length],
  );

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

  function updateSpan(id: string, patch: Partial<SpanDraft>) {
    setSpans((current) =>
      current.map((span) => (span.id === id ? { ...span, ...patch } : span)),
    );
  }

  const canSubmit =
    name.trim().length > 0 &&
    spans.length > 0 &&
    spans.every(spanIsValid) &&
    items.length > 0 &&
    items.every((item) => isDateInput(item.userDate)) &&
    !posting;

  async function handlePost() {
    if (!canSubmit) {
      if (!name.trim()) toast.error("Album name is required.");
      else if (!spans.every(spanIsValid)) toast.error("Each album date must be filled in.");
      else if (items.some((item) => !isDateInput(item.userDate))) {
        toast.error("Every file needs a date.");
      }
      return;
    }

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
            takenAt: dateInputToTakenAt(item.userDate).toISOString(),
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

    const created = await createGalleryAlbum({
      name,
      spans: spans.map(toSpanInput),
      items: uploaded,
    });
    if (!created.ok) {
      toast.error(created.error ?? "Could not create the album.");
      setPosting(false);
      return;
    }

    if (failed.length) {
      toast.error(
        `${failed.length} file${failed.length === 1 ? "" : "s"} failed. The rest are in the album.`,
      );
    } else {
      toast.success("Album created.");
    }

    for (const item of items) URL.revokeObjectURL(item.previewUrl);
    setItems([]);
    setErrors([]);
    setName("");
    setSpans([emptySpan("single")]);
    setPosting(false);
    router.refresh();
    onPosted?.();
  }

  const accept =
    "image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,video/mp4,video/webm,video/quicktime,.heic,.heif,.mov";

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Label htmlFor="album-name">Album name</Label>
        <Input
          id="album-name"
          value={name}
          maxLength={ALBUM_NAME_MAX_LENGTH}
          placeholder="e.g. Orientation week"
          disabled={posting}
          onChange={(event) => setName(event.target.value)}
        />
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium">Album dates</p>
          <p className="mt-1 text-xs text-muted-foreground">
            The album card appears on each of these days. Use a single date, a
            range, or several of either.
          </p>
        </div>
        <ul className="space-y-3">
          {spans.map((span, index) => (
            <li
              key={span.id}
              className="space-y-3 rounded-xl border border-border p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant={span.mode === "single" ? "default" : "outline"}
                    disabled={posting}
                    onClick={() =>
                      updateSpan(span.id, { mode: "single", endOn: "" })
                    }
                  >
                    Single date
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={span.mode === "range" ? "default" : "outline"}
                    disabled={posting}
                    onClick={() => updateSpan(span.id, { mode: "range" })}
                  >
                    Range
                  </Button>
                </div>
                {spans.length > 1 ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={posting}
                    onClick={() =>
                      setSpans((current) =>
                        current.filter((row) => row.id !== span.id),
                      )
                    }
                  >
                    Remove
                  </Button>
                ) : null}
              </div>
              {span.mode === "single" ? (
                <div className="space-y-1.5">
                  <Label htmlFor={`span-date-${span.id}`}>Date</Label>
                  <Input
                    id={`span-date-${span.id}`}
                    type="date"
                    value={span.startOn}
                    disabled={posting}
                    onChange={(event) =>
                      updateSpan(span.id, { startOn: event.target.value })
                    }
                  />
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor={`span-start-${span.id}`}>From</Label>
                    <Input
                      id={`span-start-${span.id}`}
                      type="date"
                      value={span.startOn}
                      disabled={posting}
                      onChange={(event) =>
                        updateSpan(span.id, { startOn: event.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`span-end-${span.id}`}>To</Label>
                    <Input
                      id={`span-end-${span.id}`}
                      type="date"
                      value={span.endOn}
                      min={span.startOn || undefined}
                      disabled={posting}
                      onChange={(event) =>
                        updateSpan(span.id, { endOn: event.target.value })
                      }
                    />
                  </div>
                </div>
              )}
              <p className="sr-only">Date entry {index + 1}</p>
            </li>
          ))}
        </ul>
        {spans.length < MAX_ALBUM_DATE_SPANS ? (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={posting}
              onClick={() =>
                setSpans((current) => [...current, emptySpan("single")])
              }
            >
              <Plus />
              Add another date
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={posting}
              onClick={() =>
                setSpans((current) => [...current, emptySpan("range")])
              }
            >
              <Plus />
              Add a range
            </Button>
          </div>
        ) : null}
      </div>

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
                  <Label htmlFor={`album-caption-${item.id}`}>Caption</Label>
                  <Textarea
                    id={`album-caption-${item.id}`}
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
                  <Label htmlFor={`album-file-date-${item.id}`}>Date</Label>
                  <Input
                    id={`album-file-date-${item.id}`}
                    type="date"
                    required
                    value={item.userDate}
                    disabled={posting}
                    onChange={(event) =>
                      updateItem(item.id, { userDate: event.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Required. Used when someone filters the gallery to photos
                    only.
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
          disabled={!canSubmit}
        >
          {posting ? <Loader2 className="animate-spin" /> : null}
          {posting ? "Creating…" : "Create album"}
        </Button>
      </div>
    </div>
  );
}
