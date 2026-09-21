import type { ProposalFieldType, ProposalStatus } from "@/generated/prisma/enums";

export const PROPOSAL_STATUS_LABEL: Record<ProposalStatus, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Active",
  CLOSED: "Closed",
};

export const PROPOSAL_TZ = "Asia/Kolkata";

/** A published proposal past its close date counts as closed. */
export function effectiveStatus(proposal: {
  status: ProposalStatus;
  closesAt: Date | null;
}): ProposalStatus {
  if (
    proposal.status === "PUBLISHED" &&
    proposal.closesAt &&
    proposal.closesAt.getTime() <= Date.now()
  ) {
    return "CLOSED";
  }
  return proposal.status;
}

/** Parse a `datetime-local` value (YYYY-MM-DDTHH:mm) as IST into a Date. */
export function parseIstDateTime(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const date = new Date(`${value}:00+05:30`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function authorLabel(author: {
  email: string;
  name: string | null;
  student: { name: string } | null;
}): string {
  return author.student?.name ?? author.name ?? author.email;
}

export type ProposalFieldDTO = {
  id: string;
  label: string;
  type: ProposalFieldType;
  options: string[];
  sortOrder: number;
};

export type VoteAnswers = Record<string, string | string[]>;

export function excerptFromContent(content: unknown, max = 160): string | null {
  const text = firstPlainText(content);
  if (!text) return null;
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}

function firstPlainText(content: unknown): string | null {
  if (!Array.isArray(content)) return null;
  for (const block of content) {
    if (!block || typeof block !== "object") continue;
    const node = block as { content?: unknown; children?: unknown };
    const inline = inlineToText(node.content).trim();
    if (inline) return inline;
    const nested = firstPlainText(node.children);
    if (nested) return nested;
  }
  return null;
}

function inlineToText(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .map((node) => {
      if (typeof node === "string") return node;
      if (node && typeof node === "object" && "text" in node) {
        return String((node as { text?: string }).text ?? "");
      }
      return "";
    })
    .join("");
}

export function parseVoteAnswers(raw: unknown): VoteAnswers {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: VoteAnswers = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === "string") out[key] = value;
    else if (Array.isArray(value) && value.every((v) => typeof v === "string")) {
      out[key] = value;
    }
  }
  return out;
}

export function formatAnswerValue(value: string | string[] | undefined): string {
  if (value == null) return "—";
  if (Array.isArray(value)) {
    const joined = value.filter(Boolean).join(", ");
    return joined || "—";
  }
  return value.trim() || "—";
}

export function voterLabel(
  vote: {
    anonymous: boolean;
    user: { email: string; student: { name: string } | null };
  },
  revealAnonymous: boolean,
): string {
  if (vote.anonymous && !revealAnonymous) return "Anonymous";
  return vote.user.student?.name ?? vote.user.email;
}

export function formatDateTime(iso: string | Date): string {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: PROPOSAL_TZ,
  });
}

export function formatDate(iso: string | Date): string {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
