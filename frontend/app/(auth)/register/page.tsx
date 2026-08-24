'use client';

import { Suspense, useState, type FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, User, AlertCircle } from 'lucide-react';

function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError('All fields are required');
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
      const user = await register({ name: name.trim(), email: email.trim(), password });
      if (user.isEmailVerified === false) {
        router.push(`/verify-email?email=${encodeURIComponent(user.email)}`);
      } else {
        const target =
          next && next.startsWith('/') && !next.startsWith('//')
            ? next
            : user.role === 'client'
              ? '/client'
              : '/dashboard';
        router.push(target);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-sm py-xl">
      <div className="w-full max-w-[28rem]">
        <div className="card-dashboard">
          <div className="mb-lg text-center">
            <Link href="/" className="bg-linear-to-r from-primary to-accent bg-clip-text text-h2 font-bold text-transparent">
              Invera Digital Agency
            </Link>
            <p className="mt-2xs text-body-small text-foreground/50">Create your account</p>
          </div>

          {error && (
            <div className="form-alert form-alert-error mb-md">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-md">
            <div>
              <label htmlFor="name" className="form-label">Full Name</label>
              <div className="relative">
                <User size={16} className="pointer-events-none absolute left-xs top-1/2 -translate-y-1/2 text-foreground/40" />
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input pl-xl"
                  placeholder="John Doe"
                  required
                  autoComplete="name"
                />
              </div>
            </div>

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
              <label htmlFor="password" className="form-label">Password</label>
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
              <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
              <div className="relative">
                <Lock size={16} className="pointer-events-none absolute left-xs top-1/2 -translate-y-1/2 text-foreground/40" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input pl-xl pr-xl"
                  placeholder="Repeat your password"
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
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <div className="mt-md text-center text-body-small">
            <span className="text-foreground/40">Already have an account? </span>
            <Link
              href={next ? `/login?next=${encodeURIComponent(next)}` : '/login'}
              className="text-primary transition-colors hover:text-primary-hover"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="loading-spinner" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
