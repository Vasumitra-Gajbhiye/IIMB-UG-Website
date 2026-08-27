import { requireAllowlisted } from "@/lib/auth";
import { StudioSidebar } from "@/components/admin/studio-sidebar";

export default async function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAllowlisted();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col px-4 py-8 sm:px-6 md:flex-row md:gap-8">
      <StudioSidebar isMod={session.isMod} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
