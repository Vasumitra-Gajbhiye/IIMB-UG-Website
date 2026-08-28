"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useFormStatus } from "react-dom";

import { ProposalFieldType, ProposalStatus } from "@/generated/prisma/enums";
import { saveProposalForm, type ProposalActionState } from "@/lib/actions/proposals";
import { ProposalActions } from "@/components/admin/proposal-actions";
import { ProposalFormFields } from "@/components/proposals/proposal-form-fields";
import { ProposalStatusBadge } from "@/components/proposals/proposal-status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProposalFieldDTO, VoteAnswers } from "@/lib/proposals";

const initial: ProposalActionState = { ok: false };

type DraftField = {
  id: string;
  label: string;
  type: ProposalFieldType;
  options: string[];
};

function SaveFormButton({ locked }: { locked: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={locked || pending}>
      {pending ? "Saving…" : locked ? "Form locked" : "Save vote form"}
    </Button>
  );
}

function newField(type: ProposalFieldType): DraftField {
  return {
    id: crypto.randomUUID(),
    label: "",
    type,
    options: type === ProposalFieldType.TEXT ? [] : ["", ""],
  };
}

const TYPE_LABEL: Record<ProposalFieldType, string> = {
  TEXT: "Text",
  SINGLE_SELECT: "Single choice",
  MULTI_SELECT: "Multiple choice",
};

export function ProposalFormBuilder({
  proposal,
}: {
  proposal: {
    id: string;
    title: string;
    status: ProposalStatus;
    formSavedAt: string | null;
    fields: ProposalFieldDTO[];
  };
}) {
  const lockedInitially = Boolean(proposal.formSavedAt);
  const [fields, setFields] = useState<DraftField[]>(() =>
    proposal.fields.map((field) => ({
      id: field.id,
      label: field.label,
      type: field.type,
      options: field.options,
    })),
  );
  const [previewAnswers, setPreviewAnswers] = useState<VoteAnswers>({});
  const [state, action] = useActionState(saveProposalForm, initial);
  const locked = lockedInitially || state.ok;

  const previewFields = useMemo<ProposalFieldDTO[]>(
    () =>
      fields.map((field, index) => ({
        id: field.id,
        label: field.label || "Untitled question",
        type: field.type,
        options: field.options.filter(Boolean),
        sortOrder: index,
      })),
    [fields],
  );

  function updateField(id: string, patch: Partial<DraftField>) {
    setFields((current) =>
      current.map((field) => (field.id === id ? { ...field, ...patch } : field)),
    );
  }

  function moveField(index: number, direction: -1 | 1) {
    setFields((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  return (
    <div className="space-y-6">
      <div className="sticky top-14 z-20 -mx-1 flex flex-wrap items-center gap-2 border-b border-border bg-background/95 py-3 backdrop-blur">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/admin/proposals/${proposal.id}/edit`}>← Blog</Link>
        </Button>
        <ProposalStatusBadge status={proposal.status} />
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <form
            action={(formData) => {
              formData.set("id", proposal.id);
              formData.set(
                "fields",
                JSON.stringify(
                  fields.map((field) => ({
                    ...field,
                    options: field.options
                      .map((option) => option.trim())
                      .filter(Boolean),
                  })),
                ),
              );
              action(formData);
            }}
          >
            <SaveFormButton locked={locked} />
          </form>
          <ProposalActions
            id={proposal.id}
            status={proposal.status}
            formLocked={locked}
            omit={["edit", "form"]}
          />
        </div>
      </div>

      <div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight">
          Vote form
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{proposal.title}</p>
      </div>

      {locked ? (
        <Alert>
          <AlertTitle>Form is locked</AlertTitle>
          <AlertDescription>
            Fields cannot change after the first save. You can still edit the
            blog and publish.
          </AlertDescription>
        </Alert>
      ) : (
        <p className="text-sm text-muted-foreground">
          Add the questions members will answer. Saving locks the form so
          ballots stay comparable.
        </p>
      )}

      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-4">
          {!locked ? (
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ProposalFieldType.TEXT,
                  ProposalFieldType.SINGLE_SELECT,
                  ProposalFieldType.MULTI_SELECT,
                ] as const
              ).map((type) => (
                <Button
                  key={type}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFields((current) => [...current, newField(type)])}
                >
                  <Plus className="size-3.5" />
                  {TYPE_LABEL[type]}
                </Button>
              ))}
            </div>
          ) : null}

          {fields.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
              No questions yet. Add a text or choice field.
            </p>
          ) : (
            <ul className="space-y-4">
              {fields.map((field, index) => (
                <li
                  key={field.id}
                  className="space-y-3 rounded-lg border border-border p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      {TYPE_LABEL[field.type]}
                    </span>
                    <div className="ml-auto flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        disabled={locked || index === 0}
                        onClick={() => moveField(index, -1)}
                        aria-label="Move up"
                      >
                        <ArrowUp className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        disabled={locked || index === fields.length - 1}
                        onClick={() => moveField(index, 1)}
                        aria-label="Move down"
                      >
                        <ArrowDown className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        disabled={locked}
                        onClick={() =>
                          setFields((current) =>
                            current.filter((item) => item.id !== field.id),
                          )
                        }
                        aria-label="Remove field"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`label-${field.id}`}>Question</Label>
                    <Input
                      id={`label-${field.id}`}
                      value={field.label}
                      disabled={locked}
                      onChange={(event) =>
                        updateField(field.id, { label: event.target.value })
                      }
                      placeholder="What should we do?"
                    />
                  </div>
                  {field.type !== ProposalFieldType.TEXT ? (
                    <div className="space-y-2">
                      <Label>Options</Label>
                      {field.options.map((option, optionIndex) => (
                        <div key={optionIndex} className="flex gap-2">
                          <Input
                            value={option}
                            disabled={locked}
                            onChange={(event) => {
                              const options = [...field.options];
                              options[optionIndex] = event.target.value;
                              updateField(field.id, { options });
                            }}
                            placeholder={`Option ${optionIndex + 1}`}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            disabled={locked || field.options.length <= 2}
                            onClick={() =>
                              updateField(field.id, {
                                options: field.options.filter(
                                  (_, i) => i !== optionIndex,
                                ),
                              })
                            }
                            aria-label="Remove option"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={locked}
                        onClick={() =>
                          updateField(field.id, {
                            options: [...field.options, ""],
                          })
                        }
                      >
                        Add option
                      </Button>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>

        <aside className="rounded-lg border border-border p-4 lg:sticky lg:top-28 lg:self-start">
          <p className="text-sm font-medium">Preview</p>
          <p className="mb-4 text-xs text-muted-foreground">
            How members will see the form.
          </p>
          {previewFields.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing to preview.</p>
          ) : (
            <ProposalFormFields
              fields={previewFields}
              answers={previewAnswers}
              onChange={(fieldId, value) =>
                setPreviewAnswers((current) => ({
                  ...current,
                  [fieldId]: value,
                }))
              }
              disabled={locked}
            />
          )}
        </aside>
      </div>
    </div>
  );
}
