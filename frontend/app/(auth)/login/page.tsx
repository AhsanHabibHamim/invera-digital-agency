"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Restore remembered email on mount.
  useEffect(() => {
    const remembered =
      typeof window !== "undefined" &&
      window.localStorage.getItem("remembered-email");
    if (remembered) {
      setFormData((prev) => ({ ...prev, email: remembered, rememberMe: true }));
    }
  }, []);

  const getTargetPath = (role: string) => {
    if (next && next.startsWith("/") && !next.startsWith("//")) {
      return next;
    }
    return role === "client" ? "/client" : "/dashboard";
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // "Remember me" keeps the pre-filled email for the next visit.
      if (formData.rememberMe) {
        window.localStorage.setItem("remembered-email", formData.email.trim());
      } else {
        window.localStorage.removeItem("remembered-email");
      }
      const user = await login(formData.email, formData.password);
      router.push(getTargetPath(user.role));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid credentials";
      if (message === "EMAIL_NOT_VERIFIED") {
        router.replace(`/verify-email?email=${encodeURIComponent(formData.email.trim())}`);
        return;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background relative overflow-hidden">
      {/* Background Gradient Orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-lg relative z-10">
        <div className="w-full max-w-[28rem]">
          {/* Logo/Branding */}
          <div className="text-center mb-lg">
            <Link href="/" className="inline-block group">
              <div className="flex items-center justify-center gap-xs mb-sm">
                <div className="w-xl h-xl bg-primary rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                  <span className="text-primary-foreground font-bold text-h5">C</span>
                </div>
                <span className="text-h5 font-bold">Invera Digital Agency</span>
              </div>
            </Link>
            <h1 className="text-h3 font-bold mb-2xs">Welcome back</h1>
            <p className="text-body-small text-foreground/60">
              Enter your credentials to access your account
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-md">
            {/* Error Message */}
            {error && (
              <div className="form-alert form-alert-error">{error}</div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-xs top-1/2 -translate-y-1/2 w-sm h-sm text-foreground/40 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="input pl-xl"
                  placeholder="john@example.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-xs top-1/2 -translate-y-1/2 w-sm h-sm text-foreground/40 pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="input pl-xl pr-xl"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-xs top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/70 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-sm h-sm" />
                  ) : (
                    <Eye className="w-sm h-sm" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={(e) =>
                    setFormData({ ...formData, rememberMe: e.target.checked })
                  }
                  className="w-sm h-sm rounded-sm border-border bg-surface accent-primary"
                />
                <span className="text-body-small text-foreground/70">Remember me</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-body-small text-primary hover:text-primary/80 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg w-full"
            >
              {loading ? (
                <span className="flex items-center gap-2xs">
                  <span className="loading-spinner" />
                  <span>Signing in...</span>
                </span>
              ) : (
                <span className="flex items-center gap-2xs">
                  Sign In
                  <ArrowRight className="w-sm h-sm" />
                </span>
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-lg text-center">
            <p className="text-body-small text-foreground/60">
              Don&apos;t have an account?{" "}
              <Link
                href={next ? `/register?next=${encodeURIComponent(next)}` : "/register"}
                className="text-primary hover:text-primary/80 font-semibold transition-colors"
              >
                Create free account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="loading-spinner" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
