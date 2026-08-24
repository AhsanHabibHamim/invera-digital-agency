'use client';

import { Suspense, useState, type FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { resetPassword } from '@/services/auth';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const paramEmail = searchParams.get('email') ?? '';
  const [email, setEmail] = useState(paramEmail);
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim() || !otp.trim() || !password || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      setError('OTP must be a 6-digit code');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      const res = await resetPassword({ email: email.trim(), otp: otp.trim(), password });
      if (res.success) {
        setSuccess(res.message || 'Password has been reset successfully.');
      } else {
        setError(res.message || 'Failed to reset password');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
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

      {!success ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-md">
          <div>
            <label htmlFor="email" className="form-label">Email</label>
            <div className="relative">
              <Mail size={16} className="pointer-events-none absolute left-xs top-1/2 -translate-y-1/2 text-foreground/40" />
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

          <div>
            <label htmlFor="otp" className="form-label">OTP Code</label>
            <input
              id="otp"
              type="text"
              inputMode="numeric"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="input text-center text-h5 tracking-[0.5em]"
              placeholder="000000"
              required
              autoComplete="one-time-code"
            />
          </div>

          <div>
            <label htmlFor="password" className="form-label">New Password</label>
            <div className="relative">
              <Lock size={16} className="pointer-events-none absolute left-xs top-1/2 -translate-y-1/2 text-foreground/40" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input pl-xl pr-xl"
                placeholder="Min. 8 characters"
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-xs top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/70"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="form-label">Confirm New Password</label>
            <div className="relative">
              <Lock size={16} className="pointer-events-none absolute left-xs top-1/2 -translate-y-1/2 text-foreground/40" />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input pl-xl pr-xl"
                placeholder="Repeat your new password"
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-xs top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/70"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
            {loading && <span className="loading-spinner" />}
            {loading ? 'Resetting...' : 'Reset password'}
          </button>
        </form>
      ) : (
        <div className="text-center">
          <Link href="/login" className="btn btn-primary btn-lg w-full">
            Sign in with new password
          </Link>
        </div>
      )}

      <div className="mt-md text-center">
        <Link href="/login" className="inline-flex items-center gap-3xs text-body-small text-foreground/40 transition-colors hover:text-foreground/70">
          <ArrowLeft size={14} />
          Back to sign in
        </Link>
      </div>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-sm py-xl">
      <div className="w-full max-w-[28rem]">
        <div className="card-dashboard">
          <div className="mb-lg text-center">
            <Link href="/" className="bg-linear-to-r from-primary to-accent bg-clip-text text-h2 font-bold text-transparent">
              Invera Digital Agency
            </Link>
            <p className="mt-2xs text-body-small text-foreground/50">Set a new password</p>
          </div>

          <Suspense fallback={<div className="flex justify-center py-lg"><div className="loading-spinner" /></div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
