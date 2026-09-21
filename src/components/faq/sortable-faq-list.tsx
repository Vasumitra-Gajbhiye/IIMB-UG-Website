"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";

import { reorderFaqs } from "@/lib/actions/faq";
import type { FaqItem } from "@/lib/queries/faqs";

function SortableRow({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-start gap-1 border-b bg-background last:border-b-0 ${isDragging ? "relative z-10 shadow-md" : ""}`}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        aria-label="Drag to reorder"
        className="mt-2 cursor-grab touch-none rounded p-1 text-muted-foreground hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

/** Mods get drag-to-reorder; everyone else gets a plain list. */
export function SortableFaqs({
  categoryId,
  items,
  canReorder,
  renderItem,
}: {
  categoryId: string;
  items: FaqItem[];
  canReorder: boolean;
  renderItem: (item: FaqItem) => ReactNode;
}) {
  const [local, setLocal] = useState(items);
  const [prevItems, setPrevItems] = useState(items);
  const [, startTransition] = useTransition();

  // Adopt fresh server data (after add/edit/delete/reorder revalidation).
  if (prevItems !== items) {
    setPrevItems(items);
    setLocal(items);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  if (!canReorder) {
    return <div>{local.map((item) => <div key={item.id} className="border-b last:border-b-0">{renderItem(item)}</div>)}</div>;
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = local.findIndex((f) => f.id === active.id);
    const to = local.findIndex((f) => f.id === over.id);
    if (from < 0 || to < 0) return;

    const previous = local;
    const next = arrayMove(local, from, to);
    setLocal(next);
    startTransition(async () => {
      const res = await reorderFaqs({
        categoryId,
        orderedIds: next.map((f) => f.id),
      });
      if (!res.ok) {
        setLocal(previous);
        toast.error(res.error ?? "Could not save the new order.");
      }
    });
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={local.map((f) => f.id)} strategy={verticalListSortingStrategy}>
        {local.map((item) => (
          <SortableRow key={item.id} id={item.id}>
            {renderItem(item)}
          </SortableRow>
        ))}
      </SortableContext>
    </DndContext>
  );
}
