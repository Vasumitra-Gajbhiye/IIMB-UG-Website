import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Toaster } from "@/components/ui/sonner";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <div className="print:hidden">
        <Navbar />
      </div>
      <main className="flex-1">{children}</main>
      <div className="print:hidden">
        <Footer />
        <Toaster />
      </div>
    </div>
  );
}
