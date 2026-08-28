"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";

import { ProposalStatus } from "@/generated/prisma/enums";
import {
  closeProposal,
  deleteProposal,
  publishProposal,
  type ProposalActionState,
} from "@/lib/actions/proposals";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const initial: ProposalActionState = { ok: false };

function PendingLabel({
  idle,
  pendingLabel,
}: {
  idle: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();
  return <>{pending ? pendingLabel : idle}</>;
}

export function ProposalActions({
  id,
  status,
  formLocked,
  omit = [],
}: {
  id: string;
  status: ProposalStatus;
  formLocked: boolean;
  omit?: Array<"edit" | "form">;
}) {
  const [publishState, publishAction] = useActionState(publishProposal, initial);
  const [closeState, closeAction] = useActionState(closeProposal, initial);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    if (publishState.error) toast.error(publishState.error);
  }, [publishState]);

  useEffect(() => {
    if (closeState.error) toast.error(closeState.error);
    if (closeState.ok) toast.success("Voting closed.");
  }, [closeState]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {omit.includes("edit") ? null : (
        <Button variant="outline" size="sm" asChild>
          <Link href={`/admin/proposals/${id}/edit`}>Edit blog</Link>
        </Button>
      )}
      {omit.includes("form") ? null : (
        <Button variant="outline" size="sm" asChild>
          <Link href={`/admin/proposals/${id}/form`}>
            {formLocked ? "View form" : "Vote form"}
          </Link>
        </Button>
      )}

      {status === ProposalStatus.DRAFT ? (
        <form action={publishAction}>
          <input type="hidden" name="id" value={id} />
          <Button size="sm" type="submit" disabled={!formLocked}>
            <PendingLabel idle="Publish" pendingLabel="Publishing…" />
          </Button>
        </form>
      ) : null}

      {status === ProposalStatus.PUBLISHED ? (
        <form action={closeAction}>
          <input type="hidden" name="id" value={id} />
          <Button variant="outline" size="sm" type="submit">
            <PendingLabel idle="Close voting" pendingLabel="Closing…" />
          </Button>
        </form>
      ) : null}

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogTrigger asChild>
          <Button variant="destructive" size="sm">
            Delete
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this proposal?</DialogTitle>
            <DialogDescription>
              The blog, vote form, and all ballots will be removed. This cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <form action={deleteProposal}>
              <input type="hidden" name="id" value={id} />
              <Button variant="destructive" type="submit">
                <PendingLabel idle="Delete" pendingLabel="Deleting…" />
              </Button>
            </form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
