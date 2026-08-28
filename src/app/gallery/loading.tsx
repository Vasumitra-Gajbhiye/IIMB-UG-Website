import { Skeleton } from "@/components/ui/skeleton";

export default function GalleryLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-12 sm:px-6">
      <Skeleton className="h-9 w-40" />
      <Skeleton className="h-5 w-72" />
      <div>
        <Skeleton className="mb-4 h-6 w-48" />
        <div className="columns-2 gap-3 sm:columns-3 lg:columns-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton
              key={i}
              className="mb-3 w-full break-inside-avoid rounded-xl"
              style={{ height: i % 3 === 0 ? 220 : i % 2 === 0 ? 160 : 280 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
