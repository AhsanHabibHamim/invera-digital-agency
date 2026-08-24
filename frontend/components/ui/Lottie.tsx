'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const DEFAULT_SIZE = 'h-40 w-40';

const Lottie = dynamic(
  () => import('lottie-react').then((m) => m.Lottie),
  {
    ssr: false,
    loading: () => <div className={DEFAULT_SIZE} />,
  },
);

export type LottieName =
  | 'success'
  | 'loading'
  | 'empty'
  | 'not-found'
  | 'payment';

/**
 * Lazy-loaded Lottie wrapper. The animation data is fetched on demand from
 * /public/animations/<name>.json only when this component mounts, so pages
 * never pay for unused animation payloads.
 */
export default function LottieAnimation({
  name,
  loop = false,
  className = DEFAULT_SIZE,
}: {
  name: LottieName;
  loop?: boolean;
  className?: string;
}) {
  const [data, setData] = useState<object | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/animations/${name}.json`)
      .then((res) => res.ok ? res.json() : null)
      .then((json) => !cancelled && setData(json))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [name]);

  if (!data) return <div className={className} aria-hidden />;

  return (
    <Lottie
      src={data}
      autoplay
      loop={loop}
      className={`mx-auto ${className}`}
      aria-hidden
    />
  );
}

export { LottieAnimation };
