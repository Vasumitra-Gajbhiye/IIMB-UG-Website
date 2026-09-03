import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";

import { ProposalStatus } from "@/generated/prisma/client";

import { ProposalActions } from "@/components/admin/proposal-actions";
import { FieldStats } from "@/components/proposals/field-stats";
import { ProposalStatusBadge } from "@/components/proposals/proposal-status-badge";
import { VoteList } from "@/components/proposals/vote-list";
import { VoteSummaryStats } from "@/components/proposals/vote-summary-stats";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { requireMod } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/proposals";
import { getAdminProposalStats } from "@/lib/queries/proposals";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const proposal = await getAdminProposalStats(id);
  return { title: proposal ? `Stats · ${proposal.title}` : "Proposal stats" };
}

export default async function ProposalStatsPage({ params }: Props) {
  await requireMod();
  const { id } = await params;
  const proposal = await getAdminProposalStats(id);
  if (!proposal) notFound();

  if (proposal.status === ProposalStatus.DRAFT) {
    redirect(`/admin/proposals/${proposal.id}/edit`);
  }

  const allowlistedCount = await prisma.allowedEmail.count();
  const namedCount = proposal.votes.filter((vote) => !vote.anonymous).length;
  const anonymousCount = proposal.votes.length - namedCount;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" className="-ml-2 mb-2" asChild>
            <Link href="/admin/proposals">← Proposals</Link>
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-serif text-3xl font-semibold tracking-tight">
              {proposal.title}
            </h1>
            <ProposalStatusBadge status={proposal.status} />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {proposal.publishedAt
              ? `Published ${formatDate(proposal.publishedAt)}`
              : null}
            {proposal.closedAt
              ? ` · Closed ${formatDate(proposal.closedAt)}`
              : null}
          </p>
        </div>
        <ProposalActions
          id={proposal.id}
          status={proposal.status}
          formLocked={Boolean(proposal.formSavedAt)}
        />
      </div>

      <VoteSummaryStats
        voteCount={proposal.votes.length}
        namedCount={namedCount}
        anonymousCount={anonymousCount}
        allowlistedCount={allowlistedCount}
      />

      <section>
        <h2 className="font-serif text-2xl font-semibold tracking-tight">
          By question
        </h2>
        <div className="mt-4">
          <FieldStats fields={proposal.fields} votes={proposal.votes} />
        </div>
      </section>

      <Separator />

      <section>
        <h2 className="font-serif text-2xl font-semibold tracking-tight">
          Votes
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Newest first. Anonymous ballots still show the voter to mods.
        </p>
        <div className="mt-4">
          <VoteList
            votes={proposal.votes}
            fields={proposal.fields}
            revealAnonymous
          />
        </div>
      </section>
    </div>
  );
}
