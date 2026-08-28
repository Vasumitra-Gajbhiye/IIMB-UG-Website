import { ProposalStatus } from "@/generated/prisma/enums";

import { Badge } from "@/components/ui/badge";
import { PROPOSAL_STATUS_LABEL } from "@/lib/proposals";

const VARIANT: Record<
  ProposalStatus,
  "secondary" | "default" | "outline"
> = {
  DRAFT: "secondary",
  PUBLISHED: "default",
  CLOSED: "outline",
};

export function ProposalStatusBadge({ status }: { status: ProposalStatus }) {
  return (
    <Badge variant={VARIANT[status]}>{PROPOSAL_STATUS_LABEL[status]}</Badge>
  );
}
