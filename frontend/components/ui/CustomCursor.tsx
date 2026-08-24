"use client";
import { useEffect, useRef, useState } from "react";

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: -100, y: -100 });
  const ring = useRef({ x: -100, y: -100 });
  const [label, setLabel] = useState("");
  const raf = useRef<number>(0);

  useEffect(() => {
    // Only serve a custom cursor for fine pointers (mouse/trackpad) that
    // don't request reduced motion. Touch and reduced-motion users keep the
    // native OS cursor and a fully accessible UI.
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (!finePointer || prefersReducedMotion) return;
    const onMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };

      // Check if hovering a portfolio item
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const inPortfolio = el?.closest('[data-cursor="view"]');
      setLabel(inPortfolio ? "View" : "");
    };

    window.addEventListener("mousemove", onMove);

    const animate = () => {
      ring.current.x += (pos.current.x - ring.current.x) * 0.12;
      ring.current.y += (pos.current.y - ring.current.y) * 0.12;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px) translate(-50%, -50%)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ring.current.x}px, ${ring.current.y}px) translate(-50%, -50%)`;
      }

      raf.current = requestAnimationFrame(animate);
    };

    raf.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <>
      {/* Dot */}
      <div
        ref={dotRef}
        className="custom-cursor-dot fixed top-0 left-0 bg-accent z-[99999] pointer-events-none transition-[width,height,border-radius] duration-200 flex items-center justify-center text-[10px] font-mono font-medium text-background tracking-wider"
        style={{
          width: label ? "52px" : "8px",
          height: label ? "28px" : "8px",
          borderRadius: label ? "14px" : "50%",
        }}
      >
        {label}
      </div>
      {/* Ring */}
      <div
        ref={ringRef}
        className="custom-cursor-ring fixed top-0 left-0 w-8 h-8 rounded-full border border-primary/50 z-[99998] pointer-events-none"
      />
    </>
  );
}
