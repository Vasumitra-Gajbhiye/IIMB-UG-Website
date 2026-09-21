import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProposalStatus } from "@/generated/prisma/client";

import { BlockNoteViewer } from "@/components/blogs/blocknote-viewer-dynamic";
import { PrintProposalButton } from "@/components/proposals/print-proposal-button";
import {
  ProposalPrintHeader,
  ProposalPrintSummary,
} from "@/components/proposals/proposal-print-document";
import { ShareProposalButton } from "@/components/proposals/share-proposal-button";
import { ProposalStatusBadge } from "@/components/proposals/proposal-status-badge";
import { VoteForm } from "@/components/proposals/vote-form";
import { VoteList } from "@/components/proposals/vote-list";
import { Separator } from "@/components/ui/separator";
import { requireAllowlisted } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  authorLabel,
  effectiveStatus,
  excerptFromContent,
  formatDate,
  formatDateTime,
} from "@/lib/proposals";
import { getMemberProposalBySlug } from "@/lib/queries/proposals";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const proposal = await getMemberProposalBySlug(slug);
  if (!proposal) return { title: "Proposal" };
  return {
    title: proposal.title,
    description: excerptFromContent(proposal.content) ?? undefined,
  };
}

export default async function ProposalDetailPage({ params }: Props) {
  const session = await requireAllowlisted({ redirectTo: "/not-allowlisted" });
  const { slug } = await params;
  const proposal = await getMemberProposalBySlug(slug);
  if (!proposal) notFound();

  const existingVote = proposal.votes.find((vote) => vote.userId === session.id);
  const status = effectiveStatus(proposal);
  const isOpen = status === ProposalStatus.PUBLISHED;
  const allowlistedCount = session.isMod
    ? await prisma.allowedEmail.count()
    : 0;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      {session.isMod ? (
        <ProposalPrintHeader generatedAt={new Date()} />
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <ProposalStatusBadge status={status} />
          {proposal.publishedAt ? (
            <p className="text-sm text-muted-foreground">
              {formatDate(proposal.publishedAt)}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-1 print:hidden">
          {session.isMod ? <PrintProposalButton /> : null}
          <ShareProposalButton slug={proposal.slug} />
        </div>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Created by {authorLabel(proposal.createdBy)}
        {isOpen && proposal.closesAt
          ? ` · Will close on ${formatDateTime(proposal.closesAt)}`
          : null}
      </p>
      <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight">
        {proposal.title}
      </h1>

      <div className="mt-8">
        <BlockNoteViewer content={proposal.content} />
      </div>

      {session.isMod ? (
        <ProposalPrintSummary
          fields={proposal.fields}
          votes={proposal.votes}
          allowlistedCount={allowlistedCount}
        />
      ) : null}

      <div className="print:hidden">
        <Separator className="my-10" />

        <section>
          <h2 className="font-serif text-2xl font-semibold tracking-tight">
            Vote
          </h2>
          {!isOpen ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Voting is closed.
            </p>
          ) : existingVote ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Your vote is in
              {existingVote.anonymous ? " (anonymous)" : ""}.
            </p>
          ) : (
            <div className="mt-4">
              <VoteForm proposalId={proposal.id} fields={proposal.fields} />
            </div>
          )}
        </section>

        <Separator className="my-10" />

        <section>
          <h2 className="font-serif text-2xl font-semibold tracking-tight">
            Votes
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Newest first. Anonymous ballots hide the name from members.
          </p>
          <div className="mt-4">
            <VoteList
              votes={proposal.votes}
              fields={proposal.fields}
              revealAnonymous={false}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
