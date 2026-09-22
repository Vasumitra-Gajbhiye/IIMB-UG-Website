import Image from "next/image";

import { initials } from "@/lib/blogs";
import { cn } from "@/lib/utils";

export function AuthorAvatar({
  name,
  avatarUrl,
  className,
}: {
  name: string;
  avatarUrl: string | null;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "relative inline-flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-[0.65rem] font-semibold text-muted-foreground",
        className,
      )}
    >
      {avatarUrl ? (
        <Image src={avatarUrl} alt="" fill sizes="40px" className="object-cover" />
      ) : (
        initials(name)
      )}
    </span>
  );
}
