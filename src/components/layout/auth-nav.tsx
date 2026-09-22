"use client";

import { SignInButton, useAuth, useUser } from "@clerk/nextjs";
import { User } from "lucide-react";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function AuthNav() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <div
        className="size-8 animate-pulse rounded-full bg-muted"
        aria-hidden
      />
    );
  }

  if (!isSignedIn) {
    return (
      <SignInButton mode="redirect" forceRedirectUrl="/onboarding">
        <Button variant="outline" size="sm">
          Sign in
        </Button>
      </SignInButton>
    );
  }

  return <ProfileLink />;
}

function ProfileLink() {
  const { user } = useUser();

  return (
    <Link
      href="/me"
      className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
      aria-label="My profile"
      title="My profile"
    >
      <Avatar className="size-8 border border-border">
        <AvatarImage src={user?.imageUrl} alt="" />
        <AvatarFallback className="bg-zinc-300 text-zinc-600">
          <User className="size-4" aria-hidden />
        </AvatarFallback>
      </Avatar>
    </Link>
  );
}
