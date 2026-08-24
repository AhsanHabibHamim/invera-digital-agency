"use client";
import { useEffect, useRef } from "react";
import { useReveal } from "@/hooks/useReveal";
import Title from "@/components/ui/Title";
import type { IProcessStep } from "@/types/whyChooseUs";

function TimelineLine() {
  const lineRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const line = lineRef.current;
    const fill = fillRef.current;
    if (!line || !fill) return;

    const onScroll = () => {
      const rect = line.getBoundingClientRect();
      const viewH = window.innerHeight;
      const start = viewH * 0.8;
      const end = -rect.height * 0.2;

      if (rect.top > start) {
        fill.style.height = "0%";
      } else if (rect.bottom < end) {
        fill.style.height = "100%";
      } else {
        const progress = (start - rect.top) / (start - end + rect.height);
        fill.style.height = `${Math.min(100, Math.max(0, progress * 100))}%`;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      ref={lineRef}
      className="absolute left-[19px] top-md bottom-md w-px bg-border"
    >
      <div
        ref={fillRef}
        className="absolute top-0 left-0 right-0 bg-linear-to-b from-primary to-accent transition-all duration-100 rounded-sm"
        style={{ height: "0%" }}
      />
    </div>
  );
}

export default function WhyChooseUs({
  steps,
  eyebrow,
  title,
  paragraph,
  showHeading = true,
}: {
  steps: IProcessStep[];
  eyebrow?: string;
  title?: Parameters<typeof Title>[0]["segments"];
  paragraph?: string;
  showHeading?: boolean;
}) {
  const headRef = useReveal();

  if (steps.length === 0) return null;

  return (
    <section
      id="process"
      className="relative z-2 section-padding bg-background-alt border-t border-b border-border scroll-mt-20"
    >
      <div
        className="container-premium grid grid-cols-1 lg:grid-cols-2 gap-5xl"
      >
        {/* Left */}
        {showHeading && (eyebrow || title) && (
        <div
          // eslint-disable-next-line react-hooks/refs
          ref={headRef.ref}
          className="reveal"
        >
          {eyebrow && (
            <div className="eyebrow mb-md">{eyebrow}</div>
          )}
          <h2
            className="text-section-title mb-lg"
          >
            <Title segments={title} />
          </h2>
          {paragraph && (
            <p
              className="text-body text-foreground/55 m-0"
            >
              {paragraph}
            </p>
          )}
        </div>
        )}

        {/* Right — timeline */}
        <div className={`relative pl-xl ${showHeading ? "" : "lg:col-span-2 mx-auto w-full max-w-[42rem]"}`}>
          <TimelineLine />
          {steps.map((step, i) => (
            <div
              key={step.num}
              className={`pl-sm relative ${i < steps.length - 1 ? "mb-xl" : ""}`}
            >
              {/* Node dot */}
              <div
                className="absolute -left-xl top-3xs w-2xs h-2xs rounded-full bg-primary border border-primary shadow-node-glow"
              />
              <div
                className="text-caption text-foreground/30 mb-2xs"
              >
                {step.num}
              </div>
              <h4
                className="text-h4 mb-xs"
              >
                {step.title}
              </h4>
              <p
                className="text-body-small text-foreground/50 m-0"
              >
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
