import { SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function SignInPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16 sm:px-6">
      <SignIn
        routing="path"
        path="/sign-in"
        fallbackRedirectUrl="/me"
        forceRedirectUrl="/me"
      />
    </div>
  );
}
