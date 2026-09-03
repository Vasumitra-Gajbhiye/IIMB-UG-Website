import type { Metadata } from "next";

import { GalleryAlbumList } from "@/components/admin/gallery-album-list";
import { GalleryComposer } from "@/components/admin/gallery-composer";
import { GalleryPostList } from "@/components/admin/gallery-post-list";
import { requireAllowlisted } from "@/lib/auth";
import {
  listAdminGalleryAlbums,
  listAdminGalleryPosts,
} from "@/lib/queries/gallery";

export const metadata: Metadata = {
  title: "Gallery",
};

export default async function AdminGalleryPage() {
  const session = await requireAllowlisted();
  const [posts, albums] = await Promise.all([
    listAdminGalleryPosts({
      authorId: session.id,
      isMod: session.isMod,
    }),
    listAdminGalleryAlbums({
      authorId: session.id,
      isMod: session.isMod,
    }),
  ]);

  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold tracking-tight">
        Gallery
      </h1>
      <p className="mt-2 text-muted-foreground">
        Add photos and videos. They go live on /gallery as soon as you post.
      </p>

      <div className="mt-8">
        <GalleryComposer />
      </div>

      <section className="mt-12">
        <h2 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
          {session.isMod ? "All posts" : "Your posts"}
        </h2>
        <div className="mt-4">
          <GalleryPostList posts={posts} isMod={session.isMod} />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
          {session.isMod ? "All albums" : "Your albums"}
        </h2>
        <div className="mt-4">
          <GalleryAlbumList albums={albums} isMod={session.isMod} />
        </div>
      </section>
    </div>
  );
}
