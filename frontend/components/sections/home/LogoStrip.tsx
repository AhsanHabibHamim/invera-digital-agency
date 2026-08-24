"use client";
import { useReveal } from "@/hooks/useReveal";

function LogoItem({ name }: { name: string }) {
  return (
    <div className="flex items-center px-xl shrink-0 opacity-40 grayscale transition-all duration-200 hover:opacity-100 hover:grayscale-0 text-body font-bold text-foreground whitespace-nowrap">
      {name}
    </div>
  );
}

export default function LogoStrip({ logos, label }: { logos: string[]; label?: string }) {
  const { ref } = useReveal();

  if (logos.length === 0) return null;

  return (
    <section
      ref={ref}
      className="reveal py-5xl border-t border-b border-border overflow-hidden relative z-2 bg-secondary"
    >
      {label && (
        <div className="text-label text-center mb-xl text-primary">{label}</div>
      )}

      {/* Marquee */}
      <div className="relative overflow-hidden hover:[&_.marquee-inner]:[animation-play-state:paused]">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-4xl bg-linear-to-r from-secondary to-transparent z-2 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-4xl bg-linear-to-l from-secondary to-transparent z-2 pointer-events-none" />

        <div className="marquee-inner flex animate-marquee-slow w-max">
          {[...logos, ...logos].map((name, i) => (
            <LogoItem key={i} name={name} />
          ))}
        </div>
      </div>
    </section>
  );
}
