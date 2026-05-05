"use client";
import Link from "next/link";
import { SignInButton, SignUpButton, useAuth } from "@clerk/nextjs";
import { ArrowRight } from "lucide-react";

export function NavAuthButtons() {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) return null;
  if (isSignedIn) {
    return (
      <Link
        href="/dashboard"
        className="bg-primary hover:opacity-90 text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 shadow-sm"
      >
        Dashboard <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    );
  }
  return (
    <>
      <SignInButton mode="redirect">
        <button className="text-foreground border border-border hover:bg-muted px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          Sign In
        </button>
      </SignInButton>
      <SignUpButton mode="redirect">
        <button className="bg-primary hover:opacity-90 text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm">
          Get Started
        </button>
      </SignUpButton>
    </>
  );
}

export function HeroCTA() {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) return null;
  if (isSignedIn) {
    return (
      <Link
        href="/dashboard"
        className="bg-primary hover:opacity-90 text-primary-foreground px-8 py-3.5 rounded-xl text-base font-semibold transition-all flex items-center justify-center gap-2 shadow-md"
      >
        Go to Dashboard <ArrowRight className="w-4 h-4" />
      </Link>
    );
  }
  return (
    <>
      <SignUpButton mode="redirect">
        <button className="bg-primary hover:opacity-90 text-primary-foreground px-8 py-3.5 rounded-xl text-base font-semibold transition-all flex items-center justify-center gap-2 shadow-md">
          Start Farming Smarter <ArrowRight className="w-4 h-4" />
        </button>
      </SignUpButton>
      <SignInButton mode="redirect">
        <button className="bg-card hover:bg-muted text-foreground border border-border px-8 py-3.5 rounded-xl text-base font-semibold transition-colors">
          Sign In to Dashboard
        </button>
      </SignInButton>
    </>
  );
}

export function CTAButton() {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) return null;
  if (isSignedIn) {
    return (
      <Link
        href="/dashboard"
        className="bg-primary-foreground hover:opacity-90 text-primary px-10 py-3.5 rounded-xl text-base font-semibold transition-all inline-flex items-center gap-2 shadow-lg"
      >
        Go to Dashboard <ArrowRight className="w-4 h-4" />
      </Link>
    );
  }
  return (
    <SignUpButton mode="redirect">
      <button className="bg-primary-foreground hover:opacity-90 text-primary px-10 py-3.5 rounded-xl text-base font-semibold transition-all inline-flex items-center gap-2 shadow-lg">
        Get Started for Free <ArrowRight className="w-4 h-4" />
      </button>
    </SignUpButton>
  );
}
