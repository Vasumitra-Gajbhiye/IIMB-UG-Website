"use client";

import { useActionState, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";

import {
  addAllowedEmail,
  removeAllowedEmail,
  updateAllowedEmailRoles,
  type AccessActionState,
} from "@/lib/actions/access";
import { Badge } from "@/components/ui/badge";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const initial: AccessActionState = { ok: false };

function SubmitButton({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "destructive" | "outline";
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} size="sm" disabled={pending}>
      {pending ? "…" : children}
    </Button>
  );
}

const selectClassName =
  "flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type Row = {
  id: string;
  email: string;
  role: "SUPER_ADMIN" | "STUDENT";
  locked: boolean;
};

type RoleValue = Row["role"];

export function AccessManager({ rows }: { rows: Row[] }) {
  const [addState, addAction] = useActionState(addAllowedEmail, initial);
  const [edits, setEdits] = useState<Record<string, RoleValue>>({});
  const [saveError, setSaveError] = useState<string>();
  const [saving, startSaving] = useTransition();

  const changes = rows
    .filter((r) => !r.locked && edits[r.id] && edits[r.id] !== r.role)
    .map((r) => ({ id: r.id, role: edits[r.id] }));

  function save() {
    startSaving(async () => {
      const res = await updateAllowedEmailRoles(changes);
      if (res.ok) {
        setEdits({});
        setSaveError(undefined);
      } else {
        setSaveError(res.error);
      }
    });
  }

  return (
    <div className="space-y-8">
      <form
        action={addAction}
        className="space-y-4 rounded-lg border border-border p-4"
      >
        <p className="text-sm font-medium">Add email</p>
        <div className="grid gap-4 sm:grid-cols-[1fr_10rem_auto] sm:items-end">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder="name@example.com"
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              name="role"
              defaultValue="STUDENT"
              className={selectClassName}
            >
              <option value="STUDENT">Student</option>
              <option value="SUPER_ADMIN">Mod</option>
            </select>
          </div>
          <SubmitButton>Add</SubmitButton>
        </div>
        {addState.error ? (
          <p className="text-sm text-destructive">{addState.error}</p>
        ) : null}
        {addState.ok ? (
          <p className="text-sm text-muted-foreground">Saved.</p>
        ) : null}
      </form>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-muted-foreground">
                  No allowlisted emails yet.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <AccessRow
                  key={row.id}
                  row={row}
                  role={edits[row.id] ?? row.role}
                  onRoleChange={(role) =>
                    setEdits((prev) => ({ ...prev, [row.id]: role }))
                  }
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {changes.length > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-center gap-3 border-t border-border bg-background/95 p-3 backdrop-blur">
          <span className="text-sm text-muted-foreground">
            {changes.length} unsaved {changes.length === 1 ? "change" : "changes"}
          </span>
          {saveError ? (
            <span className="text-sm text-destructive">{saveError}</span>
          ) : null}
          <Button
            variant="outline"
            size="sm"
            disabled={saving}
            onClick={() => {
              setEdits({});
              setSaveError(undefined);
            }}
          >
            Discard
          </Button>
          <Button size="sm" disabled={saving} onClick={save}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function AccessRow({
  row,
  role,
  onRoleChange,
}: {
  row: Row;
  role: RoleValue;
  onRoleChange: (role: RoleValue) => void;
}) {
  const [open, setOpen] = useState(false);
  const [removeError, setRemoveError] = useState<string>();
  const [removing, startRemoving] = useTransition();

  function remove() {
    startRemoving(async () => {
      const formData = new FormData();
      formData.set("id", row.id);
      const res = await removeAllowedEmail(initial, formData);
      if (res.ok) {
        setOpen(false);
      } else {
        setRemoveError(res.error);
      }
    });
  }

  return (
    <TableRow>
      <TableCell className="font-medium">
        {row.email}
        {row.locked ? (
          <Badge variant="secondary" className="ml-2">
            Locked
          </Badge>
        ) : null}
      </TableCell>
      <TableCell>
        {row.locked ? (
          <span className="text-sm">Mod</span>
        ) : (
          <select
            value={role}
            onChange={(e) => onRoleChange(e.target.value as RoleValue)}
            className={`${selectClassName} w-28`}
            aria-label={`Role for ${row.email}`}
          >
            <option value="STUDENT">Student</option>
            <option value="SUPER_ADMIN">Mod</option>
          </select>
        )}
      </TableCell>
      <TableCell className="text-right">
        {row.locked ? (
          <span className="text-xs text-muted-foreground">—</span>
        ) : (
          <Dialog
            open={open}
            onOpenChange={(next) => {
              setOpen(next);
              if (!next) setRemoveError(undefined);
            }}
          >
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm">
                Remove
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Remove access?</DialogTitle>
                <DialogDescription>
                  {row.email} will lose access to the Studio. This can&apos;t
                  be undone, but you can add them again later.
                </DialogDescription>
              </DialogHeader>
              {removeError ? (
                <p className="text-sm text-destructive">{removeError}</p>
              ) : null}
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" disabled={removing}>
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  variant="destructive"
                  disabled={removing}
                  onClick={remove}
                >
                  {removing ? "Removing…" : "Remove"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </TableCell>
    </TableRow>
  );
}
