import Link from "next/link";
import Lottie from "@/components/ui/Lottie";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-sm py-xl">
      <div className="w-full max-w-md text-center">
        <Lottie name="not-found" loop className="mx-auto h-48 w-60" />
        <p className="mb-2xs bg-linear-to-r from-primary to-accent bg-clip-text text-h1 font-extrabold text-transparent">
          404
        </p>
        <p className="mb-xs text-h4 font-bold text-foreground">
          Page not found
        </p>
        <p className="mb-lg text-body-small text-foreground/60">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link href="/" className="btn btn-primary">
          Back to homepage
        </Link>
      </div>
    </main>
  );
}
