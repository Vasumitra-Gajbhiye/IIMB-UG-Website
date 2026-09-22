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
  onChange?: () => void;
  /** Upload a pasted/dropped/selected file and resolve to its public URL. */
  uploadFile?: (file: File) => Promise<string>;
};

export function BlockNoteEditor({
  initialContent,
  onReady,
  onChange,
  uploadFile,
}: Props) {
  const editor = useCreateBlockNote({
    initialContent: resolveInitialContent(initialContent),
    uploadFile,
  });

  useEffect(() => {
    onReady?.(() => editor.document);
  }, [editor, onReady]);

  return (
    <div className="bn-app">
      <BlockNoteView editor={editor} theme="light" onChange={onChange} />
    </div>
  );
}
