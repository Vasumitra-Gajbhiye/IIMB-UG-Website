"use client";

import { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function ShareProposalButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState("");

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Could not copy the link.");
    }
  }

  return (
    <Dialog
      onOpenChange={(open) => {
        if (open) {
          setUrl(`${window.location.origin}/proposals/${slug}`);
          setCopied(false);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Share proposal">
          <Share2 />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Share proposal</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-2">
          <Input value={url} readOnly aria-label="Proposal link" />
          <Button type="button" onClick={copy} className="shrink-0">
            {copied ? <Check /> : <Copy />}
            {copied ? "Copied" : "Copy link"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
