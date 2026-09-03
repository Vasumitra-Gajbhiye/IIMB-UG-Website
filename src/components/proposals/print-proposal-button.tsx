"use client";

import { Printer } from "lucide-react";

import { Button } from "@/components/ui/button";

export function PrintProposalButton() {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="print:hidden"
      onClick={() => window.print()}
    >
      <Printer data-icon="inline-start" />
      Print PDF
    </Button>
  );
}
