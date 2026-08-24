"use client";
import { useRef, useState } from "react";
import { useReveal } from "@/hooks/useReveal";
import Title from "@/components/ui/Title";
import type { ITestimonial } from "@/types/testimonials";

function Stars({ count, visible }: { count: number; visible: boolean }) {
  return (
    <div className="flex gap-3xs mb-md">
      {Array.from({ length: count }).map((_, i) => (
        <svg
          key={i}
          width="16"
          height="16"
          viewBox="0 0 16 16"
          className={visible ? "fill-accent" : "fill-accent/20"}
          style={{
            transition: `fill 0.3s ease ${i * 80}ms`,
          }}
        >
          <path d="M8 1l1.85 3.75L14 5.5l-3 2.9.7 4.1L8 10.35 5.3 12.5l.7-4.1L3 5.5l4.15-.75L8 1z" />
        </svg>
      ))}
    </div>
  );
}

export default function Testimonials({
  testimonials,
  eyebrow,
  title,
  showHeading = true,
}: {
  testimonials: ITestimonial[];
  eyebrow?: string;
  title?: Parameters<typeof Title>[0]["segments"];
  showHeading?: boolean;
}) {
  const [idx, setIdx] = useState(0);
  const headRef = useReveal();
  const dragStart = useRef<number | null>(null);

  const prev = () =>
    setIdx((i) => (i - 1 + testimonials.length) % testimonials.length);
  const next = () => setIdx((i) => (i + 1) % testimonials.length);

  const onPointerDown = (e: React.PointerEvent) => {
    dragStart.current = e.clientX;
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (dragStart.current === null) return;
    const delta = e.clientX - dragStart.current;
    if (Math.abs(delta) > 40) {
      if (delta < 0) {
        next();
      } else {
        prev();
      }
    }
    dragStart.current = null;
  };

  if (testimonials.length === 0) return null;

  const t = testimonials[idx];

  return (
    <section className="relative z-2 section-padding bg-background-alt border-t border-b border-border">
      <div className="container-premium">
        {showHeading && (eyebrow || title) && (
          <div
            // eslint-disable-next-line react-hooks/refs
            ref={headRef.ref}
            className="reveal mb-2xl"
          >
            {eyebrow && <div className="eyebrow mb-md">{eyebrow}</div>}
            <h2 className="text-section-title m-0">
              <Title segments={title} />
            </h2>
          </div>
        )}

        <div
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          className="select-none touch-pan-y"
        >
          <div className="card-corners bg-surface-elevated border border-border-alt rounded-2xl py-2xl px-2xl max-w-full">
            <Stars count={t.stars} visible={true} />

            <blockquote className="text-h4 font-medium leading-[1.55] text-foreground mb-xl">
              &ldquo;{t.quote}&rdquo;
            </blockquote>

            <div className="flex items-center gap-sm">
              <div className="avatar avatar-lg">
                {t.avatar}
              </div>
              <div>
                <div className="text-body font-bold text-foreground">
                  {t.author}
                </div>
                <div className="text-caption text-foreground/40 mt-4xs">
                  {t.role}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-xs mt-lg items-center">
          <button onClick={prev} className="icon-btn">
            ←
          </button>
          <button onClick={next} className="icon-btn">
            →
          </button>
          <div className="flex gap-2xs ml-2xs">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`carousel-dot ${
                  i === idx ? "carousel-dot-active" : "carousel-dot-inactive"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
