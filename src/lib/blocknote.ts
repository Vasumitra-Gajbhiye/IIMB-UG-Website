import type { PartialBlock } from "@blocknote/core";

export function resolveInitialContent(
  content: unknown,
): PartialBlock[] | undefined {
  if (!Array.isArray(content) || content.length === 0) return undefined;
  return content as PartialBlock[];
}
