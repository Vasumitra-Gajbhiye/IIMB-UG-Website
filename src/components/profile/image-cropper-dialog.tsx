"use client";

import { useCallback, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  PROFILE_IMAGE_SPECS,
  type ProfileImageKind,
} from "@/lib/profile";
import { cn } from "@/lib/utils";

type Props = {
  kind: ProfileImageKind;
  file: File | null;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void;
};

const MAX_ZOOM = 3;

export function ImageCropperDialog({ kind, file, onCancel, onConfirm }: Props) {
  return (
    <Dialog open={Boolean(file)} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-xl">
        {file ? (
          <CropperBody
            key={`${file.name}-${file.lastModified}`}
            kind={kind}
            file={file}
            onCancel={onCancel}
            onConfirm={onConfirm}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function CropperBody({
  kind,
  file,
  onCancel,
  onConfirm,
}: Props & { file: File }) {
  const spec = PROFILE_IMAGE_SPECS[kind];
  const isAvatar = kind === "avatar";

  // Revoked once the <img> has decoded; the loaded bitmap stays drawable.
  const [src] = useState(() => URL.createObjectURL(file));
  const [natural, setNatural] = useState<{ w: number; h: number }>();
  const [box, setBox] = useState<{ w: number; h: number }>();
  const [zoom, setZoom] = useState(1);
  // Image-centre offset as a fraction of the viewport, so it survives resizes.
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [working, setWorking] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const observer = useRef<ResizeObserver | null>(null);

  const viewportRef = useCallback((el: HTMLDivElement | null) => {
    observer.current?.disconnect();
    if (!el) return;
    const measure = () => setBox({ w: el.clientWidth, h: el.clientHeight });
    measure();
    observer.current = new ResizeObserver(measure);
    observer.current.observe(el);
  }, []);

  // Scale at which the image exactly covers the viewport.
  const cover =
    natural && box ? Math.max(box.w / natural.w, box.h / natural.h) : 1;

  const clamp = useCallback(
    (x: number, y: number, z: number) => {
      if (!natural || !box) return { x, y };
      const maxX = Math.max(0, (natural.w * cover * z - box.w) / 2 / box.w);
      const maxY = Math.max(0, (natural.h * cover * z - box.h) / 2 / box.h);
      return {
        x: Math.min(maxX, Math.max(-maxX, x)),
        y: Math.min(maxY, Math.max(-maxY, y)),
      };
    },
    [natural, box, cover],
  );

  function changeZoom(next: number) {
    const z = Math.min(MAX_ZOOM, Math.max(1, next));
    setZoom(z);
    setOffset((o) => clamp(o.x, o.y, z));
  }

  function onPointerDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current || !box) return;
    const dx = (e.clientX - drag.current.x) / box.w;
    const dy = (e.clientY - drag.current.y) / box.h;
    setOffset(clamp(drag.current.ox + dx, drag.current.oy + dy, zoom));
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const step = 0.03;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [step, 0],
      ArrowRight: [-step, 0],
      ArrowUp: [0, step],
      ArrowDown: [0, -step],
    };
    const move = moves[e.key];
    if (!move) return;
    e.preventDefault();
    setOffset((o) => clamp(o.x + move[0], o.y + move[1], zoom));
  }

  function confirm() {
    const img = imgRef.current;
    if (!img || !natural || !box) return;
    setWorking(true);
    const scale = cover * zoom;
    const srcW = box.w / scale;
    const srcH = box.h / scale;
    const sx = natural.w / 2 - (offset.x * box.w) / scale - srcW / 2;
    const sy = natural.h / 2 - (offset.y * box.h) / scale - srcH / 2;

    const canvas = document.createElement("canvas");
    canvas.width = spec.outWidth;
    canvas.height = spec.outHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setWorking(false);
      return;
    }
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, sx, sy, srcW, srcH, 0, 0, spec.outWidth, spec.outHeight);
    canvas.toBlob(
      (blob) => {
        setWorking(false);
        if (blob) onConfirm(blob);
      },
      "image/webp",
      0.9,
    );
  }

  const displayW = natural ? natural.w * cover * zoom : 0;
  const displayH = natural ? natural.h * cover * zoom : 0;

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isAvatar ? "Adjust profile picture" : "Adjust banner"}</DialogTitle>
        <DialogDescription>
          Drag to reposition, use the slider to zoom.
        </DialogDescription>
      </DialogHeader>

      <div
        ref={viewportRef}
        tabIndex={0}
        role="application"
        aria-label="Image crop area. Use arrow keys to reposition."
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
        onKeyDown={onKeyDown}
        className={cn(
          "relative mx-auto w-full touch-none select-none overflow-hidden rounded-lg bg-muted outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          isAvatar ? "aspect-square max-w-72" : "aspect-3/1",
          "cursor-grab active:cursor-grabbing",
        )}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element -- local blob preview
          <img
            ref={imgRef}
            src={src}
            alt=""
            draggable={false}
            onLoad={(e) => {
              setNatural({
                w: e.currentTarget.naturalWidth,
                h: e.currentTarget.naturalHeight,
              });
              URL.revokeObjectURL(src);
            }}
            className="pointer-events-none absolute left-1/2 top-1/2 max-w-none"
            style={{
              width: displayW || undefined,
              height: displayH || undefined,
              transform: box
                ? `translate(calc(-50% + ${offset.x * box.w}px), calc(-50% + ${offset.y * box.h}px))`
                : undefined,
              visibility: natural && box ? "visible" : "hidden",
            }}
          />
        ) : null}
        {isAvatar ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full shadow-[0_0_0_999px_rgb(0_0_0/0.45)] ring-2 ring-white/80"
          />
        ) : (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-inset ring-white/50"
          />
        )}
      </div>

      <div className="flex items-center gap-3">
        <Minus className="size-4 text-muted-foreground" aria-hidden />
        <input
          type="range"
          min={1}
          max={MAX_ZOOM}
          step={0.01}
          value={zoom}
          onChange={(e) => changeZoom(Number(e.target.value))}
          aria-label="Zoom"
          className="h-1.5 flex-1 cursor-pointer accent-primary"
        />
        <Plus className="size-4 text-muted-foreground" aria-hidden />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={working}>
          Cancel
        </Button>
        <Button type="button" onClick={confirm} disabled={working || !natural || !box}>
          {working ? "Processing…" : "Apply"}
        </Button>
      </DialogFooter>
    </>
  );
}
