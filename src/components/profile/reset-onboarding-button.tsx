"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { resetOwnOnboarding } from "@/lib/actions/onboarding";

/** Super-admin-only: lets the developer re-test onboarding without deleting their Clerk account. */
export function ResetOnboardingButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [resetting, startResetting] = useTransition();

  function reset() {
    startResetting(async () => {
      const res = await resetOwnOnboarding();
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setOpen(false);
      router.push("/onboarding");
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <RotateCcw className="size-3.5" aria-hidden />
          Reset onboarding
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset onboarding?</DialogTitle>
          <DialogDescription>
            Clears your onboarding answers and any pending or rejected
            application, then sends you back to /onboarding. A prior approval
            (your Student/directory entry) is left untouched — this is for
            re-testing the onboarding flow, not undoing an approval.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={resetting}>
              Cancel
            </Button>
          </DialogClose>
          <Button disabled={resetting} onClick={reset}>
            {resetting ? "Resetting…" : "Reset"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
