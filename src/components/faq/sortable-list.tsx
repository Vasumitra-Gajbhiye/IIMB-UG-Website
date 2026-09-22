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

function SortableRow({
  id,
  itemClassName,
  children,
}: {
  id: string;
  itemClassName: string;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-start gap-1 bg-background ${itemClassName} ${isDragging ? "relative z-10 shadow-md" : ""}`}
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

/**
 * Drag-to-reorder list for anyone who can reorder; a plain list otherwise.
 * `onReorder` persists the new order and should return `{ok:false}` on failure,
 * at which point the list reverts and a toast explains why.
 */
export function SortableList<T extends { id: string }>({
  items,
  canReorder,
  onReorder,
  renderItem,
  className = "",
  itemClassName = "border-b last:border-b-0",
}: {
  items: T[];
  canReorder: boolean;
  onReorder: (orderedIds: string[]) => Promise<{ ok: boolean; error?: string }>;
  renderItem: (item: T) => ReactNode;
  /** Classes for the list's own wrapping element (e.g. vertical spacing). */
  className?: string;
  /** Classes for each item's wrapping element (e.g. dividers). */
  itemClassName?: string;
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
    return (
      <div className={className}>
        {local.map((item) => (
          <div key={item.id} className={itemClassName}>
            {renderItem(item)}
          </div>
        ))}
      </div>
    );
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = local.findIndex((item) => item.id === active.id);
    const to = local.findIndex((item) => item.id === over.id);
    if (from < 0 || to < 0) return;

    const previous = local;
    const next = arrayMove(local, from, to);
    setLocal(next);
    startTransition(async () => {
      const res = await onReorder(next.map((item) => item.id));
      if (!res.ok) {
        setLocal(previous);
        toast.error(res.error ?? "Could not save the new order.");
      }
    });
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={local.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        <div className={className}>
          {local.map((item) => (
            <SortableRow key={item.id} id={item.id} itemClassName={itemClassName}>
              {renderItem(item)}
            </SortableRow>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
