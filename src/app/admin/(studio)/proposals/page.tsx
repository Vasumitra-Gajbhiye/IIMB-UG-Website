import type { Metadata } from "next";
import Link from "next/link";

import { ProposalStatus } from "@/generated/prisma/client";

import { NewProposalButton } from "@/components/admin/new-proposal-button";
import { ProposalRowMenu } from "@/components/admin/proposal-row-menu";
import { ProposalStatusBadge } from "@/components/proposals/proposal-status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireMod } from "@/lib/auth";
import { formatDate } from "@/lib/proposals";
import { listAdminProposals } from "@/lib/queries/proposals";

export const metadata: Metadata = {
  title: "Proposals",
};

function hrefFor(status: ProposalStatus, id: string) {
  return status === ProposalStatus.DRAFT
    ? `/admin/proposals/${id}/edit`
    : `/admin/proposals/${id}`;
}

export default async function AdminProposalsPage() {
  await requireMod();
  const proposals = await listAdminProposals();

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight">
            Proposals
          </h1>
          <p className="mt-2 text-muted-foreground">
            Write a blog, lock a vote form, then publish for the batch.
          </p>
        </div>
        <NewProposalButton />
      </div>

      <div className="mt-8 rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Votes</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {proposals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground">
                  No proposals yet. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              proposals.map((proposal) => (
                <TableRow key={proposal.id}>
                  <TableCell className="font-medium">
                    <Button variant="link" className="h-auto p-0" asChild>
                      <Link href={hrefFor(proposal.status, proposal.id)}>
                        {proposal.title}
                      </Link>
                    </Button>
                  </TableCell>
                  <TableCell>
                    <ProposalStatusBadge status={proposal.status} />
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {proposal._count.votes}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(proposal.updatedAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <ProposalRowMenu
                      id={proposal.id}
                      status={proposal.status}
                      formLocked={Boolean(proposal.formSavedAt)}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
