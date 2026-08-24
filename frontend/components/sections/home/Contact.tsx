"use client";

import { useState } from "react";
import { useReveal } from "@/hooks/useReveal";
import { createPublicLead } from "@/services/leads";
import { Mail, MapPin, Clock, Phone, ArrowRight } from "lucide-react";
import type { ContactContent, ContactFormField } from "@/types/cms";
import type { IBudgetOption } from "@/types/pricing";

const ICON_MAP: Record<string, typeof Mail> = {
  mail: Mail,
  "map-pin": MapPin,
  clock: Clock,
  phone: Phone,
};

interface ContactProps {
  content: ContactContent;
  budgetOptions?: IBudgetOption[];
}

export default function Contact({ content, budgetOptions = [] }: ContactProps) {
  const headRef = useReveal();
  const info = content.contactInfo?.info ?? [];
  const formContent = content.form;
  const fields = formContent?.fields ?? [];
  const budgets = budgetOptions.filter((b) => b.isActive !== false);

  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      await createPublicLead({
        contactName: form.name,
        email: form.email,
        company: form.company || undefined,
        estimatedDealValue: form.budget ? Number(form.budget.replace(/[^\d]/g, "")) : undefined,
        message: form.message,
        serviceInterest: undefined,
        source: "website",
        status: "new",
        priority: "medium",
      });
      setSuccess(true);
      setForm({});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderField = (field: ContactFormField) => {
    const baseId = `contact-${field.name}`;
    if (field.type === "select") {
      return (
        <select
          id={baseId}
          className="input"
          value={form[field.name] ?? ""}
          onChange={(e) => update(field.name, e.target.value)}
        >
          <option value="">{field.placeholder || formContent?.budgetPlaceholder || "Select a range"}</option>
          {budgets.map((b) => (
            <option key={b.value} value={b.value}>
              {b.label}
            </option>
          ))}
        </select>
      );
    }
    if (field.type === "textarea") {
      return (
        <textarea
          id={baseId}
          className="input"
          rows={5}
          placeholder={field.placeholder}
          required={field.required}
          value={form[field.name] ?? ""}
          onChange={(e) => update(field.name, e.target.value)}
        />
      );
    }
    return (
      <input
        id={baseId}
        type={field.type}
        className="input"
        placeholder={field.placeholder}
        required={field.required}
        autoComplete={field.name === "email" ? "email" : field.name === "name" ? "name" : undefined}
        value={form[field.name] ?? ""}
        onChange={(e) => update(field.name, e.target.value)}
      />
    );
  };

  return (
    <section
      id="contact"
      className="relative z-2 section-padding container-premium"
    >
      <div
        // eslint-disable-next-line react-hooks/refs
        ref={headRef.ref}
        className="reveal mb-5xl"
      >
        <div className="eyebrow mb-md">{content.page?.eyebrow || "( 08 ) — Contact"}</div>
        <h2 className="text-section-title">
          {content.page?.title?.[0]?.text || "Let's build something great."}
        </h2>
        {content.page?.description && (
          <p className="text-section-desc mt-md max-w-[36rem]">
            {content.page.description}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-5xl items-start">
        {/* Left — contact info */}
        <div className="flex flex-col gap-md">
          {info.map((item) => {
            const Icon = ICON_MAP[item.icon] || Mail;
            return (
              <div key={item.label} className="card flex items-start gap-md p-lg">
                <div className="icon-btn shrink-0">
                  <Icon size={18} />
                </div>
                <div>
                  <div className="text-label text-foreground/40">{item.label}</div>
                  {item.href ? (
                    <a
                      href={item.href}
                      className="mt-2xs block text-body font-medium text-foreground transition-colors duration-200 hover:text-primary"
                    >
                      {item.value}
                    </a>
                  ) : (
                    <div className="mt-2xs text-body font-medium text-foreground">
                      {item.value}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {content.contactInfo?.preferAsyncText && (
            <div className="card flex items-center gap-md border-primary/20 bg-primary/5 p-lg">
              <div className="text-label text-foreground/60">
                {content.contactInfo.preferAsyncText}
              </div>
            </div>
          )}
        </div>

        {/* Right — form */}
        <form onSubmit={handleSubmit} className="card p-xl">
          <h3 className="text-h4 mb-lg">
            {formContent?.title || "Tell us about your project"}
          </h3>

          {success && formContent?.successMessage && (
            <div className="form-alert form-alert-success mb-md" role="status">
              {formContent.successMessage}
            </div>
          )}
          {error && (
            <div className="form-alert form-alert-error mb-md" role="alert">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
            {fields.map((field) => (
              <div
                key={field.name}
                className={field.type === "textarea" ? "sm:col-span-2" : undefined}
              >
                <label htmlFor={`contact-${field.name}`} className="form-label">
                  {field.label}
                </label>
                {renderField(field)}
              </div>
            ))}
          </div>

          <div className="mt-lg flex flex-col gap-sm sm:flex-row sm:items-center">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-md w-full sm:w-auto"
            >
              {loading ? (
                <span className="flex items-center gap-2xs">
                  <span className="loading-spinner" />
                  {formContent?.sendingLabel || "Sending..."}
                </span>
              ) : (
                <span className="flex items-center gap-2xs">
                  {formContent?.submitLabel || "Send message"}
                  <ArrowRight className="w-sm h-sm" />
                </span>
              )}
            </button>
            {formContent?.noteText && (
              <span className="text-caption text-foreground/40">
                {formContent.noteText}
              </span>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}
