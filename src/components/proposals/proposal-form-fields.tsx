"use client";

import { ProposalFieldType } from "@/generated/prisma/enums";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import type { ProposalFieldDTO, VoteAnswers } from "@/lib/proposals";

type Props = {
  fields: ProposalFieldDTO[];
  answers: VoteAnswers;
  onChange: (fieldId: string, value: string | string[]) => void;
  disabled?: boolean;
};

function textValue(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

function selectedOptions(value: string | string[] | undefined): string[] {
  return Array.isArray(value) ? value : [];
}

export function ProposalFormFields({
  fields,
  answers,
  onChange,
  disabled = false,
}: Props) {
  return (
    <div className="space-y-6">
      {fields.map((field) => {
        const value = answers[field.id];
        return (
        <div key={field.id} className="space-y-2">
          <Label className="text-sm font-medium">{field.label}</Label>
          {field.type === ProposalFieldType.TEXT ? (
            <Textarea
              value={textValue(value)}
              onChange={(event) => onChange(field.id, event.target.value)}
              disabled={disabled}
              rows={3}
              placeholder="Your answer"
            />
          ) : null}
          {field.type === ProposalFieldType.SINGLE_SELECT ? (
            <RadioGroup
              value={textValue(value)}
              onValueChange={(next) => onChange(field.id, next)}
              disabled={disabled}
              className="gap-2"
            >
              {field.options.map((option) => {
                const optionId = `${field.id}-${option}`;
                return (
                  <div key={option} className="flex items-center gap-2">
                    <RadioGroupItem value={option} id={optionId} />
                    <Label htmlFor={optionId} className="font-normal">
                      {option}
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          ) : null}
          {field.type === ProposalFieldType.MULTI_SELECT ? (
            <div className="space-y-2">
              {field.options.map((option) => {
                const selected = selectedOptions(value);
                const optionId = `${field.id}-${option}`;
                return (
                  <div key={option} className="flex items-center gap-2">
                    <Checkbox
                      id={optionId}
                      checked={selected.includes(option)}
                      disabled={disabled}
                      onCheckedChange={(checked) => {
                        const next = checked
                          ? [...selected, option]
                          : selected.filter((item) => item !== option);
                        onChange(field.id, next);
                      }}
                    />
                    <Label htmlFor={optionId} className="font-normal">
                      {option}
                    </Label>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
        );
      })}
    </div>
  );
}
