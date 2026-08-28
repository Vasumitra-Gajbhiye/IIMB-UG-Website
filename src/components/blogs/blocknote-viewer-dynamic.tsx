"use client";

import dynamic from "next/dynamic";

function ViewerFallback() {
  return (
    <div
      className="min-h-[12rem] animate-pulse rounded-lg bg-muted"
      aria-hidden
    />
  );
}

export const BlockNoteViewer = dynamic(
  () => import("./blocknote-viewer").then((mod) => mod.BlockNoteViewer),
  { ssr: false, loading: ViewerFallback },
);
