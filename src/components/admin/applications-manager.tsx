"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { approveApplication, rejectApplication } from "@/lib/actions/applications";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TRACK_LABEL } from "@/lib/constants";

type Track = keyof typeof TRACK_LABEL;

export type PendingApplication = {
  id: string;
  name: string;
  rollNumber: string;
  batch: number;
  track: Track;
  email: string;
  createdAt: string;
};

export function ApplicationsManager({ rows }: { rows: PendingApplication[] }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-border p-6 text-center text-sm text-muted-foreground">
        No pending applications.
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Roll number</TableHead>
            <TableHead>Batch</TableHead>
            <TableHead>Course</TableHead>
            <TableHead>Email</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <ApplicationRow key={row.id} row={row} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ApplicationRow({ row }: { row: PendingApplication }) {
  const [approving, startApproving] = useTransition();
  const [rejecting, startRejecting] = useTransition();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string>();

  function approve() {
    startApproving(async () => {
      const res = await approveApplication(row.id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`${row.name} approved`);
    });
  }

  function reject() {
    startRejecting(async () => {
      const res = await rejectApplication({ applicationId: row.id, reason });
      if (!res.ok) {
        setError(res.error);
        toast.error(res.error);
        return;
      }
      setRejectOpen(false);
      toast.success(`${row.name} rejected`);
    });
  }

  return (
    <TableRow>
      <TableCell className="font-medium">{row.name}</TableCell>
      <TableCell>{row.rollNumber}</TableCell>
      <TableCell>Class of {row.batch}</TableCell>
      <TableCell>BSc {TRACK_LABEL[row.track]}</TableCell>
      <TableCell className="text-muted-foreground">{row.email}</TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Dialog
            open={rejectOpen}
            onOpenChange={(next) => {
              setRejectOpen(next);
              if (!next) setError(undefined);
            }}
          >
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                Reject
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reject {row.name}&apos;s application?</DialogTitle>
                <DialogDescription>
                  Optionally tell them why — this shows on their profile page
                  so they can fix and resubmit.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-1.5">
                <Label htmlFor="reject-reason">Reason (optional)</Label>
                <Textarea
                  id="reject-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  maxLength={500}
                />
              </div>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" disabled={rejecting}>
                    Cancel
                  </Button>
                </DialogClose>
                <Button variant="destructive" disabled={rejecting} onClick={reject}>
                  {rejecting ? "Rejecting…" : "Reject"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button size="sm" disabled={approving} onClick={approve}>
            {approving ? "Approving…" : "Approve"}
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
