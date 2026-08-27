"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  addAllowedEmail,
  removeAllowedEmail,
  updateAllowedEmailRole,
  type AccessActionState,
} from "@/lib/actions/access";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  createdAt: string;
  locked: boolean;
};

export function AccessManager({ rows }: { rows: Row[] }) {
  const [addState, addAction] = useActionState(addAllowedEmail, initial);

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
              <TableHead>Added</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground">
                  No allowlisted emails yet.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => <AccessRow key={row.id} row={row} />)
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function AccessRow({ row }: { row: Row }) {
  const [roleState, roleAction] = useActionState(
    updateAllowedEmailRole,
    initial,
  );
  const [removeState, removeAction] = useActionState(
    removeAllowedEmail,
    initial,
  );

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
          <form action={roleAction} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="id" value={row.id} />
            <select
              name="role"
              defaultValue={row.role}
              className={`${selectClassName} w-28`}
              aria-label={`Role for ${row.email}`}
            >
              <option value="STUDENT">Student</option>
              <option value="SUPER_ADMIN">Mod</option>
            </select>
            <SubmitButton variant="outline">Save</SubmitButton>
            {roleState.error ? (
              <span className="text-xs text-destructive">{roleState.error}</span>
            ) : null}
          </form>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {new Date(row.createdAt).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </TableCell>
      <TableCell className="text-right">
        {row.locked ? (
          <span className="text-xs text-muted-foreground">—</span>
        ) : (
          <form action={removeAction}>
            <input type="hidden" name="id" value={row.id} />
            <SubmitButton variant="destructive">Remove</SubmitButton>
            {removeState.error ? (
              <p className="mt-1 text-xs text-destructive">{removeState.error}</p>
            ) : null}
          </form>
        )}
      </TableCell>
    </TableRow>
  );
}
