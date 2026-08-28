"use client";

import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
import { useEffect } from "react";

import { resolveInitialContent } from "@/lib/blocknote";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/shadcn/style.css";

type Props = {
  initialContent?: unknown;
  onReady?: (getDocument: () => unknown) => void;
};

export function BlockNoteEditor({ initialContent, onReady }: Props) {
  const editor = useCreateBlockNote({
    initialContent: resolveInitialContent(initialContent),
  });

  useEffect(() => {
    onReady?.(() => editor.document);
  }, [editor, onReady]);

  return (
    <div className="bn-editor">
      <BlockNoteView editor={editor} theme="light" />
    </div>
  );
}
