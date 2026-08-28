import { requireAllowlisted } from "@/lib/auth";

export default async function ProposalsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAllowlisted({ redirectTo: "/not-allowlisted" });
  return children;
}
