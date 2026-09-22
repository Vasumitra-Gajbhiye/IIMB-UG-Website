"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { toast } from "sonner";

import { ReactionType } from "@/generated/prisma/enums";
import { setBlogReaction } from "@/lib/actions/blogs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Reactions = {
  likes: number;
  dislikes: number;
  mine: ReactionType | null;
};

function apply(state: Reactions, next: ReactionType | null): Reactions {
  const out = { ...state, mine: next };
  if (state.mine === ReactionType.LIKE) out.likes -= 1;
  if (state.mine === ReactionType.DISLIKE) out.dislikes -= 1;
  if (next === ReactionType.LIKE) out.likes += 1;
  if (next === ReactionType.DISLIKE) out.dislikes += 1;
  return out;
}

export function ReactionBar({
  blogId,
  likes,
  dislikes,
  myReaction,
  signedIn,
  signInHref,
}: {
  blogId: string;
  likes: number;
  dislikes: number;
  myReaction: ReactionType | null;
  signedIn: boolean;
  signInHref: string;
}) {
  const router = useRouter();
  const [state, setState] = useState<Reactions>({ likes, dislikes, mine: myReaction });
  const [optimistic, setOptimistic] = useOptimistic(state, apply);
  const [, startTransition] = useTransition();

  function react(type: ReactionType) {
    if (!signedIn) {
      router.push(signInHref);
      return;
    }
    const next = optimistic.mine === type ? null : type;
    startTransition(async () => {
      setOptimistic(next);
      const res = await setBlogReaction(blogId, next);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setState({ likes: res.likes, dislikes: res.dislikes, mine: res.myReaction });
    });
  }

  const buttons = [
    { type: ReactionType.LIKE, Icon: ThumbsUp, count: optimistic.likes, label: "Like" },
    { type: ReactionType.DISLIKE, Icon: ThumbsDown, count: optimistic.dislikes, label: "Dislike" },
  ];

  return (
    <div className="flex items-center gap-2">
      {buttons.map(({ type, Icon, count, label }) => {
        const active = optimistic.mine === type;
        return (
          <Button
            key={type}
            variant="outline"
            size="sm"
            onClick={() => react(type)}
            aria-pressed={active}
            aria-label={`${label} (${count})`}
            title={signedIn ? label : `Sign in to ${label.toLowerCase()}`}
            className={cn(
              "rounded-full",
              active && "border-primary bg-primary/10 text-primary hover:bg-primary/15",
            )}
          >
            <Icon className={cn(active && "fill-current")} />
            <span className="tabular-nums">{count}</span>
          </Button>
        );
      })}
    </div>
  );
}
