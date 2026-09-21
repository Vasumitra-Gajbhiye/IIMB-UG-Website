"use client";

import { Plus } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createFaq, createFaqCategory } from "@/lib/actions/faq";

const NEW_CATEGORY = "__new__";

type CategoryOption = { id: string; name: string; isDefault: boolean };

export function AddFaqDialog({ categories }: { categories: CategoryOption[] }) {
  const defaultId = categories.find((c) => c.isDefault)?.id ?? categories[0]?.id ?? "";

  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [categoryId, setCategoryId] = useState(defaultId);
  const [newCategory, setNewCategory] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const creatingCategory = categoryId === NEW_CATEGORY;

  function reset() {
    setQuestion("");
    setAnswer("");
    setCategoryId(defaultId);
    setNewCategory("");
    setError(null);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      let targetId = categoryId;
      if (creatingCategory) {
        const made = await createFaqCategory(newCategory);
        if (!made.ok || !made.categoryId) {
          setError(made.error ?? "Could not create that category.");
          return;
        }
        targetId = made.categoryId;
      }
      const res = await createFaq({ question, answer, categoryId: targetId });
      if (!res.ok) {
        setError(res.error ?? "Could not save your FAQ.");
        return;
      }
      toast.success("FAQ added");
      setOpen(false);
      reset();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Add FAQ
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Add an FAQ</DialogTitle>
            <DialogDescription>
              Write a question and its answer. It goes live straight away.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2">
            <Label htmlFor="faq-question">Question</Label>
            <Input
              id="faq-question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={300}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="faq-answer">Answer</Label>
            <Textarea
              id="faq-answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={5}
              maxLength={5000}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="faq-category">Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger id="faq-category" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
                <SelectSeparator />
                <SelectItem value={NEW_CATEGORY}>+ New category…</SelectItem>
              </SelectContent>
            </Select>
            {creatingCategory && (
              <Input
                aria-label="New category name"
                placeholder="New category name"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                maxLength={40}
                required
                autoFocus
              />
            )}
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Post FAQ"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
