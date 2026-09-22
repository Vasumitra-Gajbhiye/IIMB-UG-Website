"use client";

import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { PostStatus } from "@/generated/prisma/enums";
import {
  publishBlog,
  saveBlog,
  unpublishBlog,
  type BlogActionState,
} from "@/lib/actions/blogs";
import { checkBlogImage, uploadBlogImage } from "@/lib/blog-client";
import { BLOG_EXCERPT_MAX, BLOG_TITLE_MAX } from "@/lib/blogs";
import { BlockNoteEditor } from "@/components/blogs/blocknote-editor-dynamic";
import { BlogStatusBadge } from "@/components/blogs/blog-status-badge";
import { DeleteBlogDialog } from "@/components/blogs/delete-blog-dialog";
import { PendingLabel } from "@/components/blogs/pending-label";
import { ImageCropperDialog } from "@/components/profile/image-cropper-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** `version` is the edit counter that was last saved successfully. */
type EditorState = BlogActionState & { version: number };

const initialState: EditorState = { ok: false, version: 0 };

async function uploadInline(file: File): Promise<string> {
  try {
    return await uploadBlogImage(file);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    toast.error(message);
    throw error;
  }
}

export function BlogEditor({
  blog,
}: {
  blog: {
    id: string;
    slug: string;
    title: string;
    excerpt: string | null;
    coverImageUrl: string | null;
    content: unknown;
    status: PostStatus;
  };
}) {
  const published = blog.status === PostStatus.PUBLISHED;
  const getDocumentRef = useRef<() => unknown>(() => []);
  const saveFormRef = useRef<HTMLFormElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(blog.title === "Untitled" ? "" : blog.title);
  const [excerpt, setExcerpt] = useState(blog.excerpt ?? "");
  const [cover, setCover] = useState(blog.coverImageUrl);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [version, setVersion] = useState(0);
  const bump = useCallback(() => setVersion((v) => v + 1), []);

  const [intent, setIntent] = useState<"save" | "publish">("save");
  const [saveState, submit, pending] = useActionState(
    async (prev: EditorState, formData: FormData): Promise<EditorState> => {
      const run = formData.get("_intent") === "publish" ? publishBlog : saveBlog;
      const res = await run(prev, formData);
      return {
        ...res,
        version: res.savedAt ? Number(formData.get("_v")) : prev.version,
      };
    },
    initialState,
  );
  const saving = pending && intent === "save";
  const publishing = pending && intent === "publish";

  const dirty = version !== saveState.version;

  useEffect(() => {
    if (saveState.error) toast.error(saveState.error);
    else if (saveState.ok) toast.success(published ? "Changes are live." : "Draft saved.");
  }, [saveState, published]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        saveFormRef.current?.requestSubmit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function send(formData: FormData, next: "save" | "publish") {
    setIntent(next);
    formData.set("_intent", next);
    formData.set("id", blog.id);
    formData.set("title", title);
    formData.set("excerpt", excerpt);
    formData.set("coverImageUrl", cover ?? "");
    formData.set("content", JSON.stringify(getDocumentRef.current() ?? []));
    formData.set("_v", String(version));
    submit(formData);
  }

  function pickCover(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const problem = checkBlogImage(file);
    if (problem) {
      toast.error(problem);
      return;
    }
    setCropFile(file);
  }

  async function uploadCover(blob: Blob) {
    setCropFile(null);
    setUploadingCover(true);
    try {
      setCover(await uploadBlogImage(blob));
      bump();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploadingCover(false);
    }
  }

  const busy = pending || uploadingCover;

  return (
    <div className="space-y-6">
      <div className="sticky top-14 z-20 -mx-1 flex flex-wrap items-center gap-2 border-b border-border bg-background/95 px-1 py-3 backdrop-blur">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/blogs/mine">← My Blogs</Link>
        </Button>
        <BlogStatusBadge status={blog.status} />
        <span className="text-xs text-muted-foreground" aria-live="polite">
          {saving ? "Saving…" : dirty ? "Unsaved changes" : saveState.ok ? "All changes saved" : null}
        </span>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {published ? (
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/blogs/${blog.slug}`} target="_blank">
                View live
              </Link>
            </Button>
          ) : null}
          <DeleteBlogDialog id={blog.id} title={title || "Untitled"} redirectTo="/blogs/mine" />
          {published ? (
            <form action={unpublishBlog}>
              <input type="hidden" name="id" value={blog.id} />
              <Button variant="outline" size="sm" type="submit" disabled={busy}>
                <PendingLabel idle="Unpublish" pendingLabel="Unpublishing…" />
              </Button>
            </form>
          ) : null}
          <form
            ref={saveFormRef}
            action={(formData) => send(formData, "save")}
          >
            <Button
              variant={published ? "default" : "outline"}
              size="sm"
              type="submit"
              disabled={busy}
            >
              {saving ? "Saving…" : published ? "Save changes" : "Save draft"}
            </Button>
          </form>
          {published ? null : (
            <form
              action={(formData) => send(formData, "publish")}
            >
              <Button size="sm" type="submit" disabled={busy}>
                {publishing ? "Publishing…" : "Publish"}
              </Button>
            </form>
          )}
        </div>
      </div>

      <div>
        <input
          ref={coverInput}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={pickCover}
        />
        {cover ? (
          <div className="group relative aspect-video overflow-hidden rounded-xl border border-border bg-muted">
            <Image
              src={cover}
              alt="Blog thumbnail"
              fill
              sizes="(min-width: 896px) 896px, 100vw"
              className="object-cover"
            />
            <div className="absolute right-3 bottom-3 flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                disabled={uploadingCover}
                onClick={() => coverInput.current?.click()}
              >
                {uploadingCover ? "Uploading…" : "Change thumbnail"}
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => coverInput.current?.click()}
            disabled={uploadingCover}
            className="flex aspect-[32/9] w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/40 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
          >
            {uploadingCover ? (
              <Loader2 className="size-5 animate-spin" aria-hidden />
            ) : (
              <ImagePlus className="size-5" aria-hidden />
            )}
            {uploadingCover ? "Uploading…" : "Add a thumbnail (required, 16:9)"}
          </button>
        )}
      </div>

      <div className="space-y-3">
        <input
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
            bump();
          }}
          maxLength={BLOG_TITLE_MAX}
          placeholder="Untitled"
          aria-label="Blog title"
          className="w-full border-0 bg-transparent font-serif text-4xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground/50"
        />
        <div>
          <textarea
            value={excerpt}
            onChange={(event) => {
              setExcerpt(event.target.value.replace(/\n/g, " "));
              bump();
            }}
            maxLength={BLOG_EXCERPT_MAX}
            rows={2}
            placeholder="A short description readers see on the Blogs page…"
            aria-label="Short description"
            className="w-full resize-none rounded-lg border border-border bg-transparent px-3 py-2 text-base text-muted-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <p
            className={cn(
              "text-right text-xs text-muted-foreground",
              excerpt.length >= BLOG_EXCERPT_MAX && "text-destructive",
            )}
          >
            {excerpt.length}/{BLOG_EXCERPT_MAX}
          </p>
        </div>
      </div>

      <div className="min-h-[24rem]">
        <BlockNoteEditor
          initialContent={blog.content}
          uploadFile={uploadInline}
          onChange={bump}
          onReady={(getDocument) => {
            getDocumentRef.current = getDocument;
          }}
        />
      </div>

      <ImageCropperDialog
        kind="cover"
        file={cropFile}
        onCancel={() => setCropFile(null)}
        onConfirm={uploadCover}
      />
    </div>
  );
}
