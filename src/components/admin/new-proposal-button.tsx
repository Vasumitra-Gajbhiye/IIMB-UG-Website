"use client";

import { useFormStatus } from "react-dom";

import { createProposal } from "@/lib/actions/proposals";
import { Button } from "@/components/ui/button";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Creating…" : "New proposal"}
    </Button>
  );
}

export function NewProposalButton() {
  return (
    <form action={createProposal}>
      <Submit />
    </form>
  );
}
