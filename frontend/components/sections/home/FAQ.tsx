"use client";
import { useId, useState } from "react";
import { useReveal } from "@/hooks/useReveal";
import Title from "@/components/ui/Title";
import type { IFaqItem } from "@/types/faq";

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  const contentId = useId();

  return (
    <div className="border-b border-border overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={contentId}
        className="w-full flex justify-between items-center py-md bg-transparent border-none cursor-none text-left gap-md"
      >
        <span className="text-h5 text-foreground">{q}</span>
        <span
          className="shrink-0 w-lg h-lg rounded-full border border-border-muted flex items-center justify-center text-primary text-body transition-all duration-200 hover:border-primary-light-border"
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          ↓
        </span>
      </button>

      <div
        id={contentId}
        className="overflow-hidden transition-all duration-350 ease-out-expo"
        style={{
          maxHeight: open ? "300px" : "0",
        }}
      >
        <p className="text-body-small text-foreground/55 mb-md pr-xl">
          {a}
        </p>
      </div>
    </div>
  );
}

export default function FAQ({
  items,
  eyebrow,
  title,
  description,
  showHeading = true,
}: {
  items: IFaqItem[];
  eyebrow?: string;
  title?: Parameters<typeof Title>[0]["segments"];
  description?: string;
  showHeading?: boolean;
}) {
  const headRef = useReveal();
  const listRef = useReveal();

  if (items.length === 0) return null;

  const faqList = (
    <div
      // eslint-disable-next-line react-hooks/refs
      ref={listRef.ref}
      className="reveal"
    >
      {items.map((item) => (
        <FAQItem key={item.q} q={item.q} a={item.a} />
      ))}
    </div>
  );

  return (
    <section
      id="faq"
      className="relative z-2 section-padding bg-background-alt border-t border-border scroll-mt-20"
    >
      {showHeading ? (
        <div className="container-premium grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-5xl">
          <div
            // eslint-disable-next-line react-hooks/refs
            ref={headRef.ref}
            className="reveal"
          >
            {eyebrow && <div className="eyebrow mb-md">{eyebrow}</div>}
            <h2 className="text-h1 mb-md">
              <Title segments={title} />
            </h2>
            {description && (
              <p className="text-body text-foreground/50 m-0">{description}</p>
            )}
          </div>

          {faqList}
        </div>
      ) : (
        <div className="container-premium">
          <div className="mx-auto max-w-[42rem]">{faqList}</div>
        </div>
      )}
    </section>
  );
}
