import { Skeleton } from "@/components/ui/skeleton";

export default function GalleryAlbumLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-12 sm:px-6">
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-9 w-56" />
      <Skeleton className="h-5 w-72" />
      <div className="columns-2 gap-3 sm:columns-3 lg:columns-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton
            key={i}
            className="mb-3 w-full break-inside-avoid rounded-xl"
            style={{ height: i % 2 === 0 ? 180 : 240 }}
          />
        ))}
      </div>
    </div>
  );
}
