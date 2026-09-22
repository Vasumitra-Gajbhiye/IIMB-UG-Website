import { Skeleton } from "@/components/ui/skeleton";

export default function MyBlogsLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-10 sm:px-6 sm:py-12">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-9 w-40" />
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
