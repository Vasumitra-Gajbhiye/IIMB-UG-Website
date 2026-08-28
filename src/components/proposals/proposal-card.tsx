import Link from "next/link";

import { ProposalStatus } from "@/generated/prisma/enums";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProposalStatusBadge } from "@/components/proposals/proposal-status-badge";
import { excerptFromContent, formatDate } from "@/lib/proposals";

export function ProposalCard({
  proposal,
}: {
  proposal: {
    slug: string;
    title: string;
    content: unknown;
    status: ProposalStatus;
    publishedAt: Date | null;
  };
}) {
  const excerpt = excerptFromContent(proposal.content);
  const date = proposal.publishedAt ? formatDate(proposal.publishedAt) : null;

  return (
    <Link href={`/proposals/${proposal.slug}`} className="block no-underline">
      <Card className="transition-colors hover:border-primary/40">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="font-serif text-xl">
              {proposal.title}
            </CardTitle>
            {proposal.status === ProposalStatus.CLOSED ? (
              <ProposalStatusBadge status={proposal.status} />
            ) : null}
          </div>
          {date ? <CardDescription>{date}</CardDescription> : null}
        </CardHeader>
        {excerpt ? (
          <CardContent>
            <p className="text-sm text-muted-foreground">{excerpt}</p>
          </CardContent>
        ) : null}
      </Card>
    </Link>
  );
}
