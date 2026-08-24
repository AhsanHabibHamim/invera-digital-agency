"use client";
import { useEffect, useRef, useState } from "react";
import NodeNetwork from "./NodeNetwork";
import Title from "@/components/ui/Title";
import StartProjectLink from "@/components/sections/StartProjectLink";
import type { HeroContent } from "@/types/cms";
import Link from "next/link";

function CountUp({ target, suffix }: { target: number; suffix: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1200;
          const start = performance.now();
          const animate = (now: number) => {
            const t = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - t, 3);
            setVal(Math.round(eased * target));
            if (t < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [target]);

  return (
    <div ref={ref} className="text-h2 text-foreground">
      {val}
      {suffix}
    </div>
  );
}

export default function Hero({ content }: { content: HeroContent }) {
  const heroRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hero = heroRef.current;
    const glow = glowRef.current;
    if (!hero || !glow) return;

    const onMove = (e: MouseEvent) => {
      const rect = hero.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      glow.style.left = `${x}px`;
      glow.style.top = `${y}px`;
    };

    hero.addEventListener("mousemove", onMove);
    return () => hero.removeEventListener("mousemove", onMove);
  }, []);

  const primary = content.primaryButton;
  const secondary = content.secondaryButton;
  const stats = (content.stats ?? []).filter(
    (s) => s && typeof s.value === "number" && typeof s.label === "string",
  );

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex items-center overflow-hidden pt-6xl pb-5xl"
    >
      {/* Node network background */}
      <NodeNetwork opacity={0.9} />

      {/* Cursor glow */}
      <div
        ref={glowRef}
        className="absolute w-100 h-100 rounded-full bg-[radial-gradient(circle,rgba(111,77,241,0.18)_0%,transparent_70%)] -translate-x-1/2 -translate-y-1/2 pointer-events-none z-1"
        style={{ transition: "left 0.08s, top 0.08s" }}
      />

      <div className="container-premium grid grid-cols-1 lg:grid-cols-2 gap-5xl items-center">
        {/* Left */}
        <div>
          {content.eyebrow && (
            <div className="eyebrow mb-md">{content.eyebrow}</div>
          )}

          <h1 className="text-hero leading-none mb-lg">
            <Title segments={content.title} />
          </h1>

          {content.subheadline && (
            <p className="text-body-large mb-xl">{content.subheadline}</p>
          )}

          <div className="flex flex-col sm:flex-row gap-sm items-start sm:items-center">
            {primary &&
              (primary.action === "start" ? (
                <StartProjectLink
                  href={primary.href || "/contact"}
                  className="btn btn-primary btn-xl w-full sm:w-auto text-center"
                >
                  {primary.label}
                </StartProjectLink>
              ) : (
                <Link
                  href={primary.href || "/contact"}
                  className="btn btn-primary btn-xl w-full sm:w-auto text-center"
                >
                  {primary.label}
                </Link>
              ))}
            {secondary && (
              <Link
                href={secondary.href || "/work"}
                className="btn btn-outline btn-xl w-full sm:w-auto text-center"
              >
                {secondary.label}
              </Link>
            )}
          </div>

          {/* Stats */}
          {stats.length > 0 && (
            <div className="flex flex-wrap gap-xl mt-2xl pt-xl border-t border-border">
              {stats.map((s) => (
                <div key={s.label}>
                  <CountUp target={s.value} suffix={s.suffix} />
                  <div className="text-caption mt-3xs">{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right — floating UI mockup cards */}
        <div className="relative h-120 hidden lg:block">
          {/* Main dashboard card */}
          <div className="card-corners absolute top-xl left-md right-0 bg-surface-deep backdrop-blur-2xl border border-primary/20 rounded-xl p-md animate-float z-10">
            <div className="flex justify-between items-center mb-md">
              <span className="text-caption font-semibold text-foreground">
                Revenue Dashboard
              </span>
              <span className="eyebrow text-accent text-caption">● LIVE</span>
            </div>
            {/* Mini chart bars */}
            <div className="flex gap-2xs items-end h-14 mb-sm">
              {[40, 65, 45, 80, 55, 90, 70, 95, 60, 88, 72, 100].map((h, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-xs ${
                    i === 11
                      ? "bg-linear-to-b from-accent to-accent-hover"
                      : i > 8
                        ? "bg-linear-to-b from-primary to-[#4a2fd0]"
                        : "bg-primary/20"
                  }`}
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            <div className="flex justify-between">
              <div>
                <div className="text-h3">$2.4M</div>
                <div className="text-caption">Monthly ARR</div>
              </div>
              <div className="text-right">
                <div className="text-small font-semibold text-accent">
                  +24.8%
                </div>
                <div className="text-caption">vs last month</div>
              </div>
            </div>
          </div>

          {/* Small floating metric card */}
          <div className="absolute bottom-14 -right-md bg-surface-full backdrop-blur-2xl border border-accent/20 rounded-xl px-md py-sm animate-float-slow w-45">
            <div className="text-caption mb-2xs font-medium">Active users</div>
            <div className="text-h2">48.2K</div>
            <div className="progress-bar">
              <div className="progress-bar-fill" style={{ width: "72%" }} />
            </div>
          </div>

          {/* Small notification */}
          <div className="absolute top-0 -right-xs bg-primary/12 backdrop-blur-2xl border border-primary/30 rounded-md px-xs py-2xs flex items-center gap-xs animate-float">
            <div className="w-2xs h-2xs rounded-full bg-accent shrink-0" />
            <div className="text-caption text-foreground font-medium whitespace-nowrap">
              Deploy successful ✓
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
