import type { Metadata } from "next";

import { FaqList } from "@/components/faq/faq-list";
import { ensureUser } from "@/lib/auth";
import { getFaqsGrouped } from "@/lib/queries/faqs";

export const metadata: Metadata = {
  title: "FAQ",
};

export default async function FaqPage() {
  const [categories, session] = await Promise.all([getFaqsGrouped(), ensureUser()]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="font-serif text-3xl font-semibold tracking-tight">FAQ</h1>
      <FaqList
        categories={categories}
        canPost={session?.isAllowlisted ?? false}
        isMod={session?.isMod ?? false}
        signedIn={session !== null}
        currentUserId={session?.id ?? null}
      />
    </div>
  );
}
