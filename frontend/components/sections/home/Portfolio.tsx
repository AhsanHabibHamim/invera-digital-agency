"use client";
import { useState } from "react";
import Image from "next/image";
import { useReveal } from "@/hooks/useReveal";
import Title from "@/components/ui/Title";
import type { IProject } from "@/types/portfolio";

export default function Portfolio({
  categories,
  projects,
  eyebrow,
  title,
  showHeading = true,
}: {
  categories: string[];
  projects: IProject[];
  eyebrow?: string;
  title?: Parameters<typeof Title>[0]["segments"];
  showHeading?: boolean;
}) {
  const [active, setActive] = useState("All");
  const headRef = useReveal();

  const filtered =
    active === "All"
      ? projects
      : projects.filter((p) => p.category === active);

  if (projects.length === 0) return null;

  const filterPills = (
    <div className="flex flex-wrap gap-2xs p-3xs bg-white/4 border border-border rounded-xl">
      {(categories.length > 0 ? categories : ["All"]).map((cat) => (
        <button
          key={cat}
          onClick={() => setActive(cat)}
          className={`filter-pill ${active === cat ? "active" : ""}`}
        >
          {cat}
        </button>
      ))}
    </div>
  );

  return (
    <section
      id="work"
      className="relative z-2 section-padding container-premium scroll-mt-20"
    >
      {showHeading ? (
        <div
          // eslint-disable-next-line react-hooks/refs
          ref={headRef.ref}
          className="reveal mb-2xl"
        >
          {eyebrow && <div className="eyebrow mb-md">{eyebrow}</div>}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-md">
            <h2 className="text-section-title m-0">
              <Title segments={title} />
            </h2>
            {filterPills}
          </div>
        </div>
      ) : (
        <div className="mb-2xl flex justify-center">
          {filterPills}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md">
        {filtered.map((p) => (
          <div
            key={p.title}
            data-cursor="view"
            className="rounded-xl overflow-hidden bg-surface-elevated border border-border transition-transform duration-300 ease-out-expo"
            onMouseEnter={(e) => {
              e.currentTarget.style.transform =
                "perspective(800px) rotateX(-1.5deg) rotateY(1deg) translateY(-4px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "none";
            }}
          >
            {/* Image */}
            <div className="relative h-55 overflow-hidden bg-surface-dark">
              {p.image ? (
                <Image
                  src={p.image}
                  alt={p.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover block transition-transform duration-400 hover:scale-[1.04] opacity-85"
                />
              ) : null}
              <div className="absolute inset-0 bg-linear-to-b from-transparent to-background/70 via-transparent/40" />
            </div>
            {/* Content */}
            <div className="p-md">
              <div
                className="inline-block px-xs py-4xs rounded-xs text-caption font-mono mb-xs"
                style={{
                  background: `${p.color || "#6f4df1"}18`,
                  border: `1px solid ${p.color || "#6f4df1"}30`,
                  color: p.color || "#6f4df1",
                }}
              >
                {p.category}
              </div>
              <h3 className="text-h4 mb-2xs">{p.title}</h3>
              <p className="text-caption text-foreground/50 m-0">
                {p.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
