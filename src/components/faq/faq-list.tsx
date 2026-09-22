"use client";

import { Eye, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AddCategoryDialog } from "@/components/faq/add-category-dialog";
import { AddFaqDialog } from "@/components/faq/add-faq-dialog";
import { SortableFaqs } from "@/components/faq/sortable-faq-list";
import { deleteFaq, deleteFaqCategory, updateFaq } from "@/lib/actions/faq";
import type { FaqCategoryGroup, FaqItem } from "@/lib/queries/faqs";

type Props = {
  categories: FaqCategoryGroup[];
  canPost: boolean;
  isMod: boolean;
  signedIn: boolean;
  currentUserId: string | null;
};

function EditFaqDialog({
  faq,
  onClose,
}: {
  faq: FaqItem;
  onClose: () => void;
}) {
  const [question, setQuestion] = useState(faq.question);
  const [answer, setAnswer] = useState(faq.answer);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await updateFaq({ id: faq.id, question, answer });
      if (!res.ok) {
        setError(res.error ?? "Could not save changes.");
        return;
      }
      toast.success("FAQ updated");
      onClose();
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <form onSubmit={submit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Edit FAQ</DialogTitle>
            <DialogDescription>Update the question or its answer.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="edit-question">Question</Label>
            <Input
              id="edit-question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={300}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-answer">Answer</Label>
            <Textarea
              id="edit-answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={5}
              maxLength={5000}
              required
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ConfirmDeleteDialog({
  title,
  description,
  onConfirm,
  onClose,
}: {
  title: string;
  description: string;
  onConfirm: () => Promise<{ ok: boolean; error?: string }>;
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const res = await onConfirm();
                if (!res.ok) {
                  toast.error(res.error ?? "Something went wrong.");
                  return;
                }
                toast.success("Deleted");
                onClose();
              })
            }
          >
            {pending ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function FaqList({ categories, canPost, isMod, signedIn, currentUserId }: Props) {
  const [editMode, setEditMode] = useState(false);
  const [editing, setEditing] = useState<FaqItem | null>(null);
  const [deletingFaq, setDeletingFaq] = useState<FaqItem | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<FaqCategoryGroup | null>(null);

  const canEdit = editMode && canPost;
  const canManageFaq = (faq: FaqItem) =>
    canEdit && (isMod || (currentUserId !== null && faq.authorId === currentUserId));
  const canDeleteCategory = (c: FaqCategoryGroup) =>
    canEdit &&
    !c.isDefault &&
    (isMod || (currentUserId !== null && c.createdById === currentUserId && c.faqs.length === 0));

  return (
    <div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground">
          Questions from the batch, answered by the batch.
          {canEdit && isMod && " Drag the handles to reorder FAQs within a category."}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {canPost && canEdit && (
            <>
              <AddCategoryDialog />
              <AddFaqDialog categories={categories} />
            </>
          )}
          {canPost ? (
            <Button
              variant="outline"
              size="icon"
              aria-label={canEdit ? "Switch to read-only view" : "Switch to edit view"}
              aria-pressed={canEdit}
              onClick={() => setEditMode((v) => !v)}
            >
              {canEdit ? <Eye className="size-4" /> : <Pencil className="size-4" />}
            </Button>
          ) : signedIn ? (
            <p className="text-sm text-muted-foreground">
              Only approved students can add FAQs.
            </p>
          ) : (
            <Button asChild variant="outline">
              <Link href="/sign-in">Sign in to add an FAQ</Link>
            </Button>
          )}
        </div>
      </div>

      <div className="mt-8 space-y-10">
        {categories.map((category) => (
          <section key={category.id} aria-labelledby={`faq-cat-${category.id}`}>
            <div className="flex items-center justify-between gap-2 border-b pb-2">
              <h2
                id={`faq-cat-${category.id}`}
                className="font-serif text-xl font-semibold tracking-tight"
              >
                {category.name}
              </h2>
              {canDeleteCategory(category) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeletingCategory(category)}
                >
                  <Trash2 className="size-4" />
                  Delete category
                </Button>
              )}
            </div>

            {category.faqs.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">No FAQs here yet.</p>
            ) : (
              <Accordion type="multiple">
                <SortableFaqs
                  categoryId={category.id}
                  items={category.faqs}
                  canReorder={canEdit && isMod && category.faqs.length > 1}
                  renderItem={(faq) => (
                    <AccordionItem value={faq.id} className="border-b-0">
                      <AccordionTrigger className="text-base">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="whitespace-pre-line text-muted-foreground">
                          {faq.answer}
                        </p>
                        <div className="mt-3 flex items-center justify-between gap-2">
                          <span className="text-xs text-muted-foreground">
                            {faq.authorName ? `Added by ${faq.authorName}` : ""}
                          </span>
                          {canManageFaq(faq) && (
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditing(faq)}
                              >
                                <Pencil className="size-4" />
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeletingFaq(faq)}
                              >
                                <Trash2 className="size-4" />
                                Delete
                              </Button>
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}
                />
              </Accordion>
            )}
          </section>
        ))}
      </div>

      {editing && <EditFaqDialog key={editing.id} faq={editing} onClose={() => setEditing(null)} />}
      {deletingFaq && (
        <ConfirmDeleteDialog
          title="Delete this FAQ?"
          description={`“${deletingFaq.question}” will be removed for everyone.`}
          onConfirm={() => deleteFaq(deletingFaq.id)}
          onClose={() => setDeletingFaq(null)}
        />
      )}
      {deletingCategory && (
        <ConfirmDeleteDialog
          title={`Delete “${deletingCategory.name}”?`}
          description={
            deletingCategory.faqs.length > 0
              ? "Its FAQs will be moved to General."
              : "This category is empty."
          }
          onConfirm={() => deleteFaqCategory(deletingCategory.id)}
          onClose={() => setDeletingCategory(null)}
        />
      )}
    </div>
  );
}
