"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-sm py-xl">
      <div className="w-full max-w-md text-center">
        <div className="mb-sm text-h4 font-bold text-destructive">
          Something went wrong
        </div>
        <p className="mb-lg text-body-small text-foreground/60">
          An unexpected error occurred. Please try again, or head back to the
          homepage.
        </p>
        <div className="flex items-center justify-center gap-xs">
          <button type="button" onClick={reset} className="btn btn-primary">
            Try again
          </button>
          <Link href="/" className="btn btn-outline">
            Back home
          </Link>
        </div>
        {error.digest && (
          <p className="mt-md text-caption text-foreground/30">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </main>
  );
}