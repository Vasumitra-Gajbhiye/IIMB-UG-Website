"use client";

import { useState, useTransition } from "react";

import {
  updateDirectoryRows,
  type DirectoryChange,
} from "@/lib/actions/directory";
import { BATCH_YEARS, TRACK_LABEL } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const selectClassName =
  "flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type Track = keyof typeof TRACK_LABEL;

type Row = {
  email: string;
  isMod: boolean;
  name: string;
  track: Track | "";
  batch: number | null;
};

type Edit = Partial<Pick<Row, "name" | "track" | "batch">>;

export function DirectoryTable({ rows }: { rows: Row[] }) {
  const [edits, setEdits] = useState<Record<string, Edit>>({});
  const [error, setError] = useState<string>();
  const [saving, startSaving] = useTransition();

  const merged = (row: Row): Row => ({ ...row, ...edits[row.email] });

  const dirty = rows.filter((r) => {
    const m = merged(r);
    return m.name !== r.name || m.track !== r.track || m.batch !== r.batch;
  });

  function setField(email: string, patch: Edit) {
    setEdits((prev) => ({ ...prev, [email]: { ...prev[email], ...patch } }));
  }

  function save() {
    const changes: DirectoryChange[] = dirty.map((r) => {
      const m = merged(r);
      return {
        email: m.email,
        name: m.name,
        track: m.track as Track,
        batch: m.batch,
      };
    });
    startSaving(async () => {
      const res = await updateDirectoryRows(changes);
      if (res.ok) {
        setEdits({});
        setError(undefined);
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <>
      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Batch</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground">
                  No students or mods yet. Add them on the Access page.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const m = merged(row);
                return (
                  <TableRow key={row.email}>
                    <TableCell className="font-medium">
                      {row.email}
                      {row.isMod ? (
                        <Badge variant="secondary" className="ml-2">
                          Mod
                        </Badge>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <Input
                        value={m.name}
                        onChange={(e) =>
                          setField(row.email, { name: e.target.value })
                        }
                        placeholder="Full name"
                        aria-label={`Name for ${row.email}`}
                        className="h-8 min-w-40"
                      />
                    </TableCell>
                    <TableCell>
                      <select
                        value={m.track}
                        onChange={(e) =>
                          setField(row.email, { track: e.target.value as Track })
                        }
                        className={`${selectClassName} w-36`}
                        aria-label={`Course for ${row.email}`}
                      >
                        <option value="" disabled>
                          Select…
                        </option>
                        <option value="DATA_SCIENCE">BSc DS</option>
                        <option value="ECONOMICS">BSc Econ</option>
                      </select>
                    </TableCell>
                    <TableCell>
                      <select
                        value={m.batch ?? ""}
                        onChange={(e) =>
                          setField(row.email, {
                            batch: e.target.value ? Number(e.target.value) : null,
                          })
                        }
                        className={`${selectClassName} w-24`}
                        aria-label={`Batch for ${row.email}`}
                      >
                        <option value="">—</option>
                        {BATCH_YEARS.map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {dirty.length > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-center gap-3 border-t border-border bg-background/95 p-3 backdrop-blur">
          <span className="text-sm text-muted-foreground">
            {dirty.length} unsaved {dirty.length === 1 ? "change" : "changes"}
          </span>
          {error ? <span className="text-sm text-destructive">{error}</span> : null}
          <Button
            variant="outline"
            size="sm"
            disabled={saving}
            onClick={() => {
              setEdits({});
              setError(undefined);
            }}
          >
            Discard
          </Button>
          <Button size="sm" disabled={saving} onClick={save}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      ) : null}
    </>
  );
}
