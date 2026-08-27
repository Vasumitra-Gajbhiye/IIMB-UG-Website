import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Post",
};

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="font-serif text-3xl font-semibold tracking-tight">Post</h1>
      <p className="mt-2 text-muted-foreground">
        Placeholder for <code className="text-sm">{slug}</code> — content
        arrives in Phase 4.
      </p>
    </div>
  );
}
