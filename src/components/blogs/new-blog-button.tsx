"use client";

import { Plus } from "lucide-react";
import { useFormStatus } from "react-dom";

import { createBlog } from "@/lib/actions/blogs";
import { Button } from "@/components/ui/button";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      <Plus data-icon="inline-start" />
      {pending ? "Creating…" : "Add Blog"}
    </Button>
  );
}

export function NewBlogButton() {
  return (
    <form action={createBlog}>
      <Submit />
    </form>
  );
}
