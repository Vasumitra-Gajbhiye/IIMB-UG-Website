import {
  formatAnswerValue,
  formatDateTime,
  parseVoteAnswers,
  voterLabel,
  type ProposalFieldDTO,
} from "@/lib/proposals";

export type VoteListItem = {
  id: string;
  anonymous: boolean;
  createdAt: Date | string;
  answers: unknown;
  user: { email: string; student: { name: string } | null };
};

export function VoteList({
  votes,
  fields,
  revealAnonymous,
}: {
  votes: VoteListItem[];
  fields: ProposalFieldDTO[];
  revealAnonymous: boolean;
}) {
  if (votes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No votes yet.</p>
    );
  }

  return (
    <ol className="space-y-4">
      {votes.map((vote) => {
        const answers = parseVoteAnswers(vote.answers);
        return (
          <li
            key={vote.id}
            className="rounded-lg border border-border px-4 py-3"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-medium">
                {voterLabel(vote, revealAnonymous)}
                {revealAnonymous && vote.anonymous ? (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    Anonymous ballot
                  </span>
                ) : null}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDateTime(vote.createdAt)}
              </p>
            </div>
            <dl className="mt-3 space-y-2">
              {fields.map((field) => (
                <div key={field.id}>
                  <dt className="text-xs text-muted-foreground">{field.label}</dt>
                  <dd className="text-sm whitespace-pre-wrap">
                    {formatAnswerValue(answers[field.id])}
                  </dd>
                </div>
              ))}
            </dl>
          </li>
        );
      })}
    </ol>
  );
}
