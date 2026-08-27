import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gallery",
};

export default function GalleryPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="font-serif text-3xl font-semibold tracking-tight">
        Gallery
      </h1>
      <p className="mt-2 text-muted-foreground">
        Placeholder — batch photo gallery is the last content page (Phase 8).
      </p>
    </div>
  );
}
