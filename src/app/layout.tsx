import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { Geist, Geist_Mono, Source_Serif_4 } from "next/font/google";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { SiteShell } from "@/components/layout/site-shell";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/constants";
import { hasCompletedOnboarding } from "@/lib/auth";

import "./globals.css";

const ONBOARDING_EXEMPT_PREFIXES = ["/onboarding", "/sign-in", "/api"];

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_TAGLINE,
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { userId } = await auth();
  if (userId) {
    const pathname = (await headers()).get("x-pathname") ?? "";
    const exempt = ONBOARDING_EXEMPT_PREFIXES.some((p) => pathname.startsWith(p));
    if (!exempt && !(await hasCompletedOnboarding(userId))) {
      redirect("/onboarding");
    }
  }

  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} ${sourceSerif.variable} h-full antialiased`}
      >
        <body className="flex min-h-full flex-col font-sans">
          <SiteShell>{children}</SiteShell>
        </body>
      </html>
    </ClerkProvider>
  );
}
