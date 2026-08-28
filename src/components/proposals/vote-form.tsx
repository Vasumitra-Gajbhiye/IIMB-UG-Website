"use client";

import { useActionState, useState } from "react";

import { submitVote, type ProposalActionState } from "@/lib/actions/proposals";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ProposalFormFields } from "@/components/proposals/proposal-form-fields";
import type { ProposalFieldDTO, VoteAnswers } from "@/lib/proposals";

const initial: ProposalActionState = { ok: false };

export function VoteForm({
  proposalId,
  fields,
}: {
  proposalId: string;
  fields: ProposalFieldDTO[];
}) {
  const [answers, setAnswers] = useState<VoteAnswers>({});
  const [anonymous, setAnonymous] = useState(false);
  const [state, action, pending] = useActionState(submitVote, initial);

  return (
    <form
      className="space-y-6"
      action={(formData) => {
        formData.set("proposalId", proposalId);
        formData.set("answers", JSON.stringify(answers));
        formData.set("anonymous", anonymous ? "true" : "false");
        action(formData);
      }}
    >
      <ProposalFormFields
        fields={fields}
        answers={answers}
        onChange={(fieldId, value) =>
          setAnswers((current) => ({ ...current, [fieldId]: value }))
        }
      />

      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Checkbox
            id="anonymous"
            checked={anonymous}
            onCheckedChange={(checked) => setAnonymous(checked === true)}
          />
          <Label htmlFor="anonymous" className="font-normal">
            Submit anonymously
          </Label>
        </div>
        <p className="text-xs text-muted-foreground">
          Other members will see “Anonymous”. Mods can still see who voted.
        </p>
      </div>

      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Submitting…" : "Submit vote"}
      </Button>
    </form>
  );
}
