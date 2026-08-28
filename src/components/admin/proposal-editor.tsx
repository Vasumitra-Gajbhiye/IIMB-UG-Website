"use client";

import { useActionState, useRef, useState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";

import { ProposalStatus } from "@/generated/prisma/enums";
import { saveProposalBlog, type ProposalActionState } from "@/lib/actions/proposals";
import { BlockNoteEditor } from "@/components/blogs/blocknote-editor-dynamic";
import { ProposalActions } from "@/components/admin/proposal-actions";
import { ProposalStatusBadge } from "@/components/proposals/proposal-status-badge";
import { Button } from "@/components/ui/button";

const initial: ProposalActionState = { ok: false };

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Save draft"}
    </Button>
  );
}

export function ProposalEditor({
  proposal,
}: {
  proposal: {
    id: string;
    title: string;
    content: unknown;
    status: ProposalStatus;
    formSavedAt: string | null;
  };
}) {
  const getDocumentRef = useRef<() => unknown>(() => []);
  const [title, setTitle] = useState(proposal.title);
  const [state, action] = useActionState(saveProposalBlog, initial);

  return (
    <div className="space-y-4">
      <div className="sticky top-14 z-20 -mx-1 flex flex-wrap items-center gap-2 border-b border-border bg-background/95 py-3 backdrop-blur">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/proposals">← Proposals</Link>
        </Button>
        <ProposalStatusBadge status={proposal.status} />
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <form
            action={(formData) => {
              formData.set("id", proposal.id);
              formData.set("title", title);
              formData.set(
                "content",
                JSON.stringify(getDocumentRef.current() ?? []),
              );
              action(formData);
            }}
          >
            <SaveButton />
          </form>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/proposals/${proposal.id}/form`}>
              Vote form →
            </Link>
          </Button>
          <ProposalActions
            id={proposal.id}
            status={proposal.status}
            formLocked={Boolean(proposal.formSavedAt)}
            omit={["edit", "form"]}
          />
        </div>
      </div>

      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      {state.ok ? (
        <p className="text-sm text-muted-foreground">Saved.</p>
      ) : null}

      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Untitled"
        aria-label="Proposal title"
        className="w-full border-0 bg-transparent font-serif text-4xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground/50"
      />

      <BlockNoteEditor
        initialContent={proposal.content}
        onReady={(getDocument) => {
          getDocumentRef.current = getDocument;
        }}
      />
    </div>
  );
}
