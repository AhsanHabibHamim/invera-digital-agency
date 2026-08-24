"use client";
import Link from "next/link";
import { useReveal } from "@/hooks/useReveal";
import Title from "@/components/ui/Title";
import StartProjectLink from "@/components/sections/StartProjectLink";
import NodeNetwork from "./NodeNetwork";
import type { FinalCtaContent } from "@/types/cms";

export default function FinalCTA({ content }: { content?: FinalCtaContent }) {
  const { ref } = useReveal();

  if (!content || (!content.title && !content.description)) return null;

  const primary = content.primaryButton;
  const secondary = content.secondaryButton;

  return (
    <section
      id="contact"
      className="relative z-2 overflow-hidden border-t border-border"
    >
      <NodeNetwork opacity={0.6} pulseNodes={true} />

      {/* Purple glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[radial-gradient(ellipse,rgba(111,77,241,0.12)_0%,transparent_70%)] pointer-events-none" />

      <div
        ref={ref}
        className="reveal relative z-2 max-w-[720px] mx-auto py-7xl px-xl text-center"
      >
        {content.eyebrow && (
          <div className="eyebrow mb-md">{content.eyebrow}</div>
        )}

        <h2 className="text-display-xl mb-lg">
          <Title segments={content.title} />
        </h2>

        {content.description && (
          <p className="text-body-large text-foreground/55 mx-auto mb-xl">
            {content.description}
          </p>
        )}

        <div className="flex gap-sm justify-center flex-wrap">
          {primary &&
            (primary.action === "start" ? (
              <StartProjectLink
                href={primary.href || "/contact"}
                className="btn btn-primary btn-xxl shadow-primary-glow"
              >
                {primary.label}
              </StartProjectLink>
            ) : (
              <Link
                href={primary.href || "/contact"}
                className="btn btn-primary btn-xxl shadow-primary-glow"
              >
                {primary.label}
              </Link>
            ))}
          {secondary && (
            <Link href={secondary.href || "/contact"} className="btn btn-outline btn-xxl">
              {secondary.label}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
