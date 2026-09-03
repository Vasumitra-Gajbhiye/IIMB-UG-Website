import Image from "next/image";

import { FieldStats } from "@/components/proposals/field-stats";
import { VoteSummaryStats } from "@/components/proposals/vote-summary-stats";
import type { VoteListItem } from "@/components/proposals/vote-list";
import { LOGO_SRC, SITE_NAME } from "@/lib/constants";
import { formatDate, type ProposalFieldDTO } from "@/lib/proposals";

export function ProposalPrintHeader({ generatedAt }: { generatedAt: Date }) {
  return (
    <header className="mb-8 hidden items-center justify-between gap-4 print:flex">
      <div className="flex items-center gap-2.5">
        <Image
          src={LOGO_SRC}
          alt=""
          width={32}
          height={32}
          className="h-8 w-8 object-contain"
          priority
        />
        <span className="text-sm font-semibold tracking-tight">{SITE_NAME}</span>
      </div>
      <p className="text-sm text-muted-foreground">{formatDate(generatedAt)}</p>
    </header>
  );
}

export function ProposalPrintSummary({
  fields,
  votes,
  allowlistedCount,
}: {
  fields: ProposalFieldDTO[];
  votes: VoteListItem[];
  allowlistedCount: number;
}) {
  const namedCount = votes.filter((vote) => !vote.anonymous).length;
  const anonymousCount = votes.length - namedCount;

  return (
    <section className="mt-10 hidden break-before-page print:block">
      <h2 className="font-serif text-2xl font-semibold tracking-tight">
        Voting summary
      </h2>
      <div className="mt-6">
        <VoteSummaryStats
          voteCount={votes.length}
          namedCount={namedCount}
          anonymousCount={anonymousCount}
          allowlistedCount={allowlistedCount}
        />
      </div>
      <div className="mt-8">
        <h3 className="font-serif text-xl font-semibold tracking-tight">
          By question
        </h3>
        <div className="mt-4">
          <FieldStats fields={fields} votes={votes} mcqOnly />
        </div>
      </div>
    </section>
  );
}
