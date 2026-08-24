"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Mail, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { forgotPassword } from "@/services/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await forgotPassword({ email: email.trim() });
      if (res.success) {
        setSuccess(
          res.message || "Password reset email sent. Please check your inbox.",
        );
      } else {
        setError(res.message || "Failed to send reset email");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-sm py-xl">
      <div className="w-full max-w-112">
        <div className="card-dashboard">
          <div className="mb-lg text-center">
            <Link
              href="/"
              className="bg-linear-to-r from-primary to-accent bg-clip-text text-h2 font-bold text-transparent"
            >
              Invera Digital Agency
            </Link>
            <p className="mt-2xs text-body-small text-foreground/50">
              Reset your password
            </p>
          </div>

          {error && (
            <div className="form-alert form-alert-error mb-md">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="form-alert form-alert-success mb-md">
              <CheckCircle2 size={16} />
              <span>{success}</span>
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-md">
              <div>
                <label htmlFor="email" className="form-label">
                  Email
                </label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="pointer-events-none absolute left-xs top-1/2 -translate-y-1/2 text-foreground/40"
                  />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input pl-xl"
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg w-full"
                disabled={loading}
              >
                {loading && <span className="loading-spinner" />}
                {loading ? "Sending..." : "Send reset link"}
              </button>
            </form>
          )}

          <div className="mt-md text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-3xs text-body-small text-foreground/40 transition-colors hover:text-foreground/70"
            >
              <ArrowLeft size={14} />
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
