"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
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
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const initial: ProposalActionState = { ok: false };

export function ProposalRowMenu({
  id,
  status,
  formLocked,
}: {
  id: string;
  status: ProposalStatus;
  formLocked: boolean;
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
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="Proposal actions">
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/admin/proposals/${id}/edit`}>Edit blog</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/admin/proposals/${id}/form`}>
              {formLocked ? "View form" : "Vote form"}
            </Link>
          </DropdownMenuItem>
          {status !== ProposalStatus.DRAFT ? (
            <DropdownMenuItem asChild>
              <Link href={`/admin/proposals/${id}`}>Stats</Link>
            </DropdownMenuItem>
          ) : null}
          {status === ProposalStatus.DRAFT ? (
            <DropdownMenuItem
              disabled={!formLocked}
              onSelect={(event) => {
                event.preventDefault();
                const data = new FormData();
                data.set("id", id);
                publishAction(data);
              }}
            >
              Publish
            </DropdownMenuItem>
          ) : null}
          {status === ProposalStatus.PUBLISHED ? (
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                const data = new FormData();
                data.set("id", id);
                closeAction(data);
              }}
            >
              Close voting
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={(event) => {
              event.preventDefault();
              setDeleteOpen(true);
            }}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
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
                Delete
              </Button>
            </form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
