'use client';

import { Suspense, useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, ShieldCheck, AlertCircle, CheckCircle2, ArrowLeft, RefreshCw, KeyRound } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { sendVerificationEmail } from '@/services/auth';
import Lottie from '@/components/ui/Lottie';

const RESEND_COOLDOWN = 60;

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { verifyEmail } = useAuth();

  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const emailRef = useRef<HTMLInputElement>(null);
  const autoSentRef = useRef(false);

  useEffect(() => {
    if (!email && emailRef.current) emailRef.current.focus();
  }, [email]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    if (email && !autoSentRef.current && !verified) {
      autoSentRef.current = true;
      setCooldown(RESEND_COOLDOWN);
      sendVerificationEmail({ email }).catch(() => undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSend = async () => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setResending(true);
    try {
      const res = await sendVerificationEmail({ email: email.trim() });
      if (res.success) {
        setSuccess('A new verification code has been sent to your email.');
        setCooldown(RESEND_COOLDOWN);
      } else {
        setError(res.message || 'Failed to send the code.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setResending(false);
    }
  };

  async function handleVerify(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    if (!/^\d{6}$/.test(otp)) {
      setError('Enter the 6-digit code from your email.');
      return;
    }

    setLoading(true);
    try {
      const user = await verifyEmail(email.trim(), otp);
      setVerified(true);
      router.push(user.role === 'client' ? '/client' : '/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
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

      {verified ? (
        <div className="flex flex-col items-center gap-2xs py-md text-center">
          <Lottie name="success" className="h-36 w-36" />
          <p className="text-h5 font-semibold text-foreground">Email verified!</p>
          <p className="text-body-small text-foreground/50">Taking you to your dashboard…</p>
        </div>
      ) : (
        <form onSubmit={handleVerify} className="flex flex-col gap-md">
          <div>
            <label htmlFor="email" className="form-label">Email</label>
            <div className="relative">
              <Mail size={16} className="pointer-events-none absolute left-xs top-1/2 -translate-y-1/2 text-foreground/40" />
              <input
                ref={emailRef}
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
            <label htmlFor="otp" className="form-label">Verification Code</label>
            <div className="relative">
              <KeyRound size={16} className="pointer-events-none absolute left-xs top-1/2 -translate-y-1/2 text-foreground/40" />
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="input pl-xl text-center text-h5 tracking-[0.5em]"
                placeholder="000000"
                required
              />
            </div>
            <p className="mt-2xs flex items-center gap-3xs text-caption text-foreground/40">
              <ShieldCheck size={13} />
              We sent a 6-digit code to your inbox. It expires in 10 minutes.
            </p>
          </div>

          <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2xs">
                <span className="loading-spinner" /> Verifying…
              </span>
            ) : (
              'Verify & continue'
            )}
          </button>

          <div className="flex flex-col items-center gap-xs">
            <button
              type="button"
              onClick={handleSend}
              disabled={resending || cooldown > 0}
              className="inline-flex items-center gap-2xs text-body-small text-primary transition-colors hover:text-primary-hover disabled:opacity-50"
            >
              <RefreshCw size={14} className={resending ? 'animate-spin' : ''} />
              {cooldown > 0
                ? `Resend code in ${cooldown}s`
                : resending
                  ? 'Sending…'
                  : 'Resend code'}
            </button>
          </div>
        </form>
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

export default function VerifyEmailPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-sm py-xl">
      <div className="w-full max-w-[28rem]">
        <div className="card-dashboard">
          <div className="mb-lg text-center">
            <Link href="/" className="bg-linear-to-r from-primary to-accent bg-clip-text text-h2 font-bold text-transparent">
              Invera Digital Agency
            </Link>
            <p className="mt-2xs text-body-small text-foreground/50">Verify your email to get started</p>
          </div>

          <Suspense fallback={<div className="flex justify-center py-lg"><div className="loading-spinner" /></div>}>
            <VerifyEmailForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}