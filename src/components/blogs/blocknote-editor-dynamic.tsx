"use client";

import dynamic from "next/dynamic";

function EditorFallback() {
  return (
    <div
      className="min-h-[20rem] animate-pulse rounded-lg bg-muted"
      aria-hidden
    />
  );
}

export const BlockNoteEditor = dynamic(
  () => import("./blocknote-editor").then((mod) => mod.BlockNoteEditor),
  { ssr: false, loading: EditorFallback },
);
