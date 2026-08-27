import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function SignInPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16 sm:px-6">
      <h1 className="font-serif text-3xl font-semibold tracking-tight">
        Sign in
      </h1>
      <p className="mt-3 text-center text-muted-foreground">
        Clerk sign-in arrives in Phase 6. This route is a placeholder so the
        URL returns 200.
      </p>
    </div>
  );
}
