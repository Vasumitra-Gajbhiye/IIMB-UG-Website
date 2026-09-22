import { Skeleton } from "@/components/ui/skeleton";

export default function EditBlogLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="aspect-[32/9] w-full rounded-xl" />
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-80 w-full rounded-lg" />
    </div>
  );
}
