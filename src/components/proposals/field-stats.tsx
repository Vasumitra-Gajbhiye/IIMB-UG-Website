import { ProposalFieldType } from "@/generated/prisma/enums";

import {
  formatAnswerValue,
  parseVoteAnswers,
  voterLabel,
  type ProposalFieldDTO,
} from "@/lib/proposals";
import type { VoteListItem } from "@/components/proposals/vote-list";

export function FieldStats({
  fields,
  votes,
}: {
  fields: ProposalFieldDTO[];
  votes: VoteListItem[];
}) {
  if (fields.length === 0) return null;

  return (
    <div className="space-y-6">
      {fields.map((field) => {
        const responses = votes.map((vote) => ({
          vote,
          value: parseVoteAnswers(vote.answers)[field.id],
        }));

        if (field.type === ProposalFieldType.TEXT) {
          return (
            <section key={field.id}>
              <h3 className="font-medium">{field.label}</h3>
              {responses.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">No answers.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {responses.map(({ vote, value }) => (
                    <li key={vote.id} className="text-sm">
                      <span className="text-muted-foreground">
                        {voterLabel(vote, true)}:{" "}
                      </span>
                      <span className="whitespace-pre-wrap">
                        {formatAnswerValue(value)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        }

        const counts = new Map<string, number>();
        for (const option of field.options) counts.set(option, 0);
        for (const { value } of responses) {
          const picked = Array.isArray(value) ? value : value ? [value] : [];
          for (const option of picked) {
            counts.set(option, (counts.get(option) ?? 0) + 1);
          }
        }

        return (
          <section key={field.id}>
            <h3 className="font-medium">{field.label}</h3>
            <ul className="mt-2 space-y-1">
              {field.options.map((option) => (
                <li
                  key={option}
                  className="flex items-center justify-between gap-4 text-sm"
                >
                  <span>{option}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {counts.get(option) ?? 0}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
