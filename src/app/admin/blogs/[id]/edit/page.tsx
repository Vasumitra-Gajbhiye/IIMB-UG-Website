import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit post",
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminBlogEditPage({ params }: Props) {
  const { id } = await params;

  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold tracking-tight">
        Edit post
      </h1>
      <p className="mt-2 text-muted-foreground">
        Placeholder for <code className="text-sm">{id}</code> — BlockNote
        editor arrives in Phase 6.
      </p>
    </div>
  );
}
