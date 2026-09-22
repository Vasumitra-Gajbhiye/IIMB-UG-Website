import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BlogEditor } from "@/components/blogs/blog-editor";
import { requireAllowlisted } from "@/lib/auth";
import { getEditableBlog } from "@/lib/queries/blogs";

type Props = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = { title: "Edit blog" };

export default async function EditBlogPage({ params }: Props) {
  const { id } = await params;
  const session = await requireAllowlisted({ redirectTo: "/not-allowlisted" });
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const blog = await getEditableBlog(id, session);
  if (!blog) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <BlogEditor
        key={blog.id}
        blog={{
          id: blog.id,
          slug: blog.slug,
          title: blog.title,
          excerpt: blog.excerpt,
          coverImageUrl: blog.coverImageUrl,
          content: blog.content,
          status: blog.status,
        }}
      />
    </div>
  );
}
