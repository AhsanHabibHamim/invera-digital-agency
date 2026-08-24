'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

/**
 * Google Analytics 4 — loads only when NEXT_PUBLIC_GA_ID is configured and
 * only after the visitor has accepted analytics cookies (cookie consent).
 */
export default function Analytics() {
  const pathname = usePathname();

  const consented =
    typeof window !== 'undefined' &&
    window.localStorage.getItem('cookie-consent') === 'accepted';

  useEffect(() => {
    if (!GA_ID || !consented) return;
    if (!document.getElementById('ga-script')) {
      const s = document.createElement('script');
      s.id = 'ga-script';
      s.async = true;
      s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
      document.head.appendChild(s);

      window.dataLayer = window.dataLayer || [];
      window.gtag = function gtag(...args: unknown[]) {
        window.dataLayer?.push(args);
      };
      window.gtag('js', new Date());
    }
    window.gtag?.('config', GA_ID, { page_path: pathname });
  }, [pathname, consented]);

  return null;
}
