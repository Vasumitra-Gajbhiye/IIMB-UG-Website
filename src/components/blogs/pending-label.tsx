"use client";

import { useFormStatus } from "react-dom";

/** Button label that swaps while its parent form is submitting. */
export function PendingLabel({
  idle,
  pendingLabel,
}: {
  idle: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();
  return <>{pending ? pendingLabel : idle}</>;
}
