"use client";
import { useReveal } from "@/hooks/useReveal";
import Title from "@/components/ui/Title";
import type { IService } from "@/types/service";

interface ServicesProps {
  services: IService[];
  eyebrow?: string;
  title?: Parameters<typeof Title>[0]["segments"];
  showHeading?: boolean;
}

export default function Services({ services, eyebrow, title, showHeading = true }: ServicesProps) {
  const headRef = useReveal();
  const gridRef = useReveal();

  if (services.length === 0) return null;

  return (
    <section
      id="services"
      className="relative z-2 section-padding container-premium scroll-mt-20"
    >
      {showHeading && (eyebrow || title) && (
        <div
          // eslint-disable-next-line react-hooks/refs
          ref={headRef.ref}
          className="reveal mb-2xl"
        >
          {eyebrow && <div className="eyebrow mb-md">{eyebrow}</div>}
          <h2 className="text-section-title">
            <Title segments={title} />
          </h2>
        </div>
      )}

      <div
        // eslint-disable-next-line react-hooks/refs
        ref={gridRef.ref}
        className="stagger grid grid-cols-1 md:grid-cols-2 gap-md"
      >
        {services.map((s, i) => (
          <div
            key={s.number || s.title || i}
            className="card-corners bg-surface border border-border rounded-xl p-xl transition-all duration-150 hover:-translate-y-1 hover:shadow-card-hover hover:bg-surface-full"
          >
            <div className="text-caption text-foreground/30 mb-md">
              {s.number}
            </div>
            <h3 className="text-h3 mb-sm">{s.title}</h3>
            <p className="text-body-small mb-md">{s.desc}</p>
            <div className="flex gap-2xs flex-wrap">
              {(s.tags ?? []).map((t) => (
                <span key={t} className="service-tag">
                  {t}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
