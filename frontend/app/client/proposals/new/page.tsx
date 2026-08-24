"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createProposal } from "@/services/proposals";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function NewProposalPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    description: "",
    serviceCategory: "",
    budgetRange: "",
    desiredTimeline: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      setError("Title and description are required");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await createProposal({
        title: form.title.trim(),
        description: form.description.trim(),
        serviceCategory: form.serviceCategory || undefined,
        budgetRange: form.budgetRange || undefined,
        desiredTimeline: form.desiredTimeline || undefined,
      });
      if (res.success) {
        router.push(`/client/proposals/${res.data._id}`);
      } else {
        setError(res.message || "Failed to submit proposal");
      }
    } catch {
      setError("Failed to submit proposal");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-md">
      <div className="flex items-center gap-xs">
        <Link
          href="/client/proposals"
          className="icon-btn"
          aria-label="Back to proposals"
        >
          <ArrowLeft className="w-sm h-sm" />
        </Link>
        <div>
          <h1 className="text-h3 font-bold text-foreground">New Proposal</h1>
          <p className="mt-4xs text-body-small text-foreground/50">
            Tell us about your project
          </p>
        </div>
      </div>

      {error && <div className="form-alert form-alert-error">{error}</div>}

      <form
        onSubmit={handleSubmit}
        className="card-dashboard flex flex-col gap-md "
      >
        <div>
          <label className="form-label">Project Title *</label>
          <input
            className="input"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. E-commerce website redesign"
          />
        </div>
        <div>
          <label className="form-label">Description *</label>
          <textarea
            className="input"
            rows={5}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Describe your project goals, requirements, and any details you want to share..."
          />
        </div>
        <div>
          <label className="form-label">Service Category</label>
          <input
            className="input"
            value={form.serviceCategory}
            onChange={(e) =>
              setForm({ ...form, serviceCategory: e.target.value })
            }
            placeholder="e.g. Web Development, Branding, Marketing"
          />
        </div>
        <div className="grid grid-cols-1 gap-md sm:grid-cols-2">
          <div>
            <label className="form-label">Budget Range</label>
            <input
              className="input"
              value={form.budgetRange}
              onChange={(e) =>
                setForm({ ...form, budgetRange: e.target.value })
              }
              placeholder="e.g. $5,000 - $10,000"
            />
          </div>
          <div>
            <label className="form-label">Desired Timeline</label>
            <input
              className="input"
              value={form.desiredTimeline}
              onChange={(e) =>
                setForm({ ...form, desiredTimeline: e.target.value })
              }
              placeholder="e.g. 4-6 weeks"
            />
          </div>
        </div>
        <div className="flex justify-end gap-xs">
          <Link href="/client/proposals" className="btn btn-outline btn-md">
            Cancel
          </Link>
          <button
            type="submit"
            className="btn btn-primary btn-md"
            disabled={submitting}
          >
            {submitting ? <Loader2 className="w-sm h-sm animate-spin" /> : null}
            Submit Proposal
          </button>
        </div>
      </form>
    </div>
  );
}
