import Link from "next/link";

import { ProposalStatus } from "@/generated/prisma/enums";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProposalStatusBadge } from "@/components/proposals/proposal-status-badge";
import { ShareProposalButton } from "@/components/proposals/share-proposal-button";
import {
  authorLabel,
  effectiveStatus,
  excerptFromContent,
  formatDateTime,
} from "@/lib/proposals";

export function ProposalCard({
  proposal,
  canManage = false,
}: {
  proposal: {
    id: string;
    slug: string;
    title: string;
    content: unknown;
    status: ProposalStatus;
    publishedAt: Date | null;
    closesAt: Date | null;
    closedAt: Date | null;
    createdBy: {
      email: string;
      name: string | null;
      student: { name: string } | null;
    };
  };
  canManage?: boolean;
}) {
  const excerpt = excerptFromContent(proposal.content);
  const status = effectiveStatus(proposal);
  const isDraft = status === ProposalStatus.DRAFT;
  const href = isDraft
    ? `/proposals/manage/${proposal.id}/edit`
    : `/proposals/${proposal.slug}`;

  const closeLine =
    status === ProposalStatus.PUBLISHED && proposal.closesAt
      ? `Will close on ${formatDateTime(proposal.closesAt)}`
      : status === ProposalStatus.CLOSED
        ? `Closed on ${formatDateTime(proposal.closedAt ?? proposal.closesAt ?? proposal.publishedAt ?? new Date())}`
        : null;

  return (
    <div className="relative">
      <Link href={href} className="block no-underline">
        <Card className="transition-colors hover:border-primary/40">
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2 pr-24">
              <CardTitle className="font-serif text-xl">
                {proposal.title}
              </CardTitle>
              <ProposalStatusBadge status={status} />
            </div>
            <CardDescription className="space-y-0.5">
              <span className="block">
                Created by {authorLabel(proposal.createdBy)}
              </span>
              {closeLine ? <span className="block">{closeLine}</span> : null}
            </CardDescription>
          </CardHeader>
          {excerpt ? (
            <CardContent>
              <p className="text-sm text-muted-foreground">{excerpt}</p>
            </CardContent>
          ) : null}
        </Card>
      </Link>
      {isDraft ? null : (
        <div className="absolute right-3 top-3 flex items-center gap-1">
          {canManage ? (
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/proposals/manage/${proposal.id}`}>Manage</Link>
            </Button>
          ) : null}
          <ShareProposalButton slug={proposal.slug} />
        </div>
      )}
    </div>
  );
}
