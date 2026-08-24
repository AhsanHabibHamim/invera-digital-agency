'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Cookie } from 'lucide-react';

const STORAGE_KEY = 'cookie-consent';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!window.localStorage.getItem(STORAGE_KEY)) {
      const t = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(t);
    }
  }, []);

  const choose = (value: 'accepted' | 'essential') => {
    window.localStorage.setItem(STORAGE_KEY, value);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[60] mx-auto max-w-xl rounded-2xl border border-border bg-surface/95 p-sm shadow-2xl backdrop-blur md:left-6 md:right-auto">
      <div className="flex items-start gap-xs">
        <span className="icon-btn shrink-0 pointer-events-none">
          <Cookie size={18} />
        </span>
        <div className="flex flex-col gap-2xs text-body-small text-foreground/70">
          <p>
            We use essential cookies to keep you signed in, and optional
            analytics cookies to improve the site. See our{' '}
            <Link href="/privacy" className="font-semibold text-primary hover:underline">
              privacy policy
            </Link>
            .
          </p>
          <div className="mt-2xs flex gap-2xs">
            <button className="btn btn-primary btn-sm" onClick={() => choose('accepted')}>
              Accept all
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => choose('essential')}>
              Essential only
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
