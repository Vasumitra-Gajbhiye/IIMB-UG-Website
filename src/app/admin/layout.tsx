export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <p className="mb-6 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Studio
      </p>
      {children}
    </div>
  );
}
