"use client";

import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";

import { resolveInitialContent } from "@/lib/blocknote";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/shadcn/style.css";

export function BlockNoteViewer({ content }: { content: unknown }) {
  const editor = useCreateBlockNote({
    initialContent: resolveInitialContent(content),
  });

  return (
    <div className="bn-editor">
      <BlockNoteView editor={editor} theme="light" editable={false} />
    </div>
  );
}
