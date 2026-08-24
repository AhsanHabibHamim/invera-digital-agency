"use client";
import { useReveal } from "@/hooks/useReveal";
import Title from "@/components/ui/Title";
import StartProjectLink from "@/components/sections/StartProjectLink";
import { useState } from "react";
import type { IPricingPlan } from "@/types/pricing";

export default function Pricing({
  plans,
  eyebrow,
  title,
  showHeading = true,
}: {
  plans: IPricingPlan[];
  eyebrow?: string;
  title?: Parameters<typeof Title>[0]["segments"];
  showHeading?: boolean;
}) {
  const [yearly, setYearly] = useState(false);
  const headRef = useReveal();
  const gridRef = useReveal();

  const activePlans = plans.filter((p) => p.isActive !== false);

  if (activePlans.length === 0) return null;

  const billingToggle = (
    <div className="flex items-center gap-xs">
      <span
        className={`text-small font-medium transition-colors duration-200 ${
          yearly ? "text-foreground/40" : "text-foreground"
        }`}
      >
        Monthly
      </span>
      <button
        onClick={() => setYearly((y) => !y)}
        className="switch"
        data-checked={yearly}
        aria-checked={yearly}
        role="switch"
      >
        <div className="switch-thumb" />
      </button>
      <span
        className={`flex items-center gap-2xs text-small font-medium transition-colors duration-200 ${
          yearly ? "text-foreground" : "text-foreground/40"
        }`}
      >
        Yearly
        {yearly && <span className="badge badge-accent">-20%</span>}
      </span>
    </div>
  );

  return (
    <section
      id="pricing"
      className="relative z-2 section-padding container-premium"
    >
      {showHeading ? (
        <div
          // eslint-disable-next-line react-hooks/refs
          ref={headRef.ref}
          className="reveal mb-2xl"
        >
          {eyebrow && <div className="eyebrow mb-md">{eyebrow}</div>}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-md">
            <h2 className="text-section-title font-extrabold tracking-tighter leading-tight text-foreground m-0">
              <Title segments={title} />
            </h2>
            {billingToggle}
          </div>
        </div>
      ) : (
        <div className="mb-2xl flex justify-center">
          {billingToggle}
        </div>
      )}

      <div
        // eslint-disable-next-line react-hooks/refs
        ref={gridRef.ref}
        className="stagger grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md items-stretch"
      >
        {activePlans.map((plan) => (
          <div
            key={plan.name}
            className={`card-corners rounded-xl p-xl flex flex-col transition-all duration-150 ${
              plan.highlight
                ? "bg-primary/8 border-primary/40 shadow-primary-glow scale-[1.03]"
                : "bg-surface border border-border"
            }`}
          >
            {(plan.highlight || plan.badge) && (
              <div className="badge badge-primary self-start mb-md uppercase tracking-wider">
                {plan.badge || "Most popular"}
              </div>
            )}

            <h3 className="text-h5 font-bold tracking-tight text-foreground mb-2xs">
              {plan.name}
            </h3>
            <p className="text-caption text-foreground/50 mb-lg leading-relaxed">
              {plan.description}
            </p>

            <div className="mb-lg">
              {plan.monthly === 0 ? (
                <div className="text-h4 font-extrabold text-foreground tracking-tight">
                  Custom
                </div>
              ) : (
                <div className="flex items-baseline gap-3xs">
                  <span className="text-caption text-foreground/40 mb-3xs">$</span>
                  <span className="text-h2 font-extrabold text-foreground tracking-tighter transition-all duration-300">
                    {yearly
                      ? (plan.yearly / 1000).toFixed(1) + "K"
                      : (plan.monthly / 1000).toFixed(1) + "K"}
                  </span>
                  <span className="text-caption text-foreground/40">/mo</span>
                </div>
              )}
            </div>

            <ul className="list-none m-0 mb-lg p-0 flex-1">
              {(plan.features ?? []).map((f) => (
                <li
                  key={f}
                  className="flex items-center gap-xs text-caption text-foreground/70 mb-xs leading-snug"
                >
                  <span className="text-accent shrink-0 text-caption">✓</span>
                  {f}
                </li>
              ))}
            </ul>

            {plan.ctaText && (
              <p className="text-caption text-foreground/40 mb-md leading-snug">
                {plan.ctaText}
              </p>
            )}

            <StartProjectLink
              href="/contact"
              className={`btn btn-md w-full ${plan.highlight ? "btn-primary" : "btn-outline"}`}
            >
              {plan.cta}
            </StartProjectLink>
          </div>
        ))}
      </div>
    </section>
  );
}
