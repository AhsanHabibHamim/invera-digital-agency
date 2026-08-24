"use client";

import { useState, useEffect, useCallback } from "react";
import DataTable, { type Column } from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import * as pricingService from "@/services/pricing";
import { getErrorMessage } from "@/lib/utils";
import type { IPricingPlan } from "@/types/pricing";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  ChevronUp,
  ChevronDown,
  Power,
  Loader2,
} from "lucide-react";

interface PlanForm {
  name: string;
  description: string;
  monthly: string;
  yearly: string;
  currency: string;
  features: string;
  badge: string;
  cta: string;
  ctaText: string;
  highlight: boolean;
  isActive: boolean;
  isCustom: boolean;
}

const emptyForm: PlanForm = {
  name: "",
  description: "",
  monthly: "0",
  yearly: "0",
  currency: "USD",
  features: "",
  badge: "",
  cta: "Start a project",
  ctaText: "",
  highlight: false,
  isActive: true,
  isCustom: false,
};

export default function PricingPage() {
  const [plans, setPlans] = useState<IPricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<IPricingPlan | null>(null);
  const [form, setForm] = useState<PlanForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<IPricingPlan | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await pricingService.getPricingPlans();
      if (res.success) {
        const data = res.data as unknown;
        const items = Array.isArray(data)
          ? (data as IPricingPlan[])
          : (((data as { data?: unknown })?.data as
              | IPricingPlan[]
              | undefined) ?? []);
        setPlans(items);
      }
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPlans();
  }, [fetchPlans]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError("");
    setShowModal(true);
  };

  const openEdit = (plan: IPricingPlan) => {
    setEditing(plan);
    setForm({
      name: plan.name,
      description: plan.description,
      monthly: String(plan.monthly),
      yearly: String(plan.yearly),
      currency: plan.currency || "USD",
      features: plan.features.join("\n"),
      badge: plan.badge || "",
      cta: plan.cta,
      ctaText: plan.ctaText || "",
      highlight: plan.highlight,
      isActive: plan.isActive !== false,
      isCustom: plan.isCustom || false,
    });
    setFormError("");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setFormError("Name is required.");
      return;
    }
    const monthly = Number(form.monthly) || 0;
    const yearly = Number(form.yearly) || 0;
    const payload: Partial<IPricingPlan> = {
      name: form.name.trim(),
      description: form.description.trim(),
      monthly,
      yearly,
      currency: form.currency.trim() || "USD",
      features: form.features
        .split("\n")
        .map((f) => f.trim())
        .filter(Boolean),
      badge: form.badge.trim() || undefined,
      cta: form.cta.trim(),
      ctaText: form.ctaText.trim() || undefined,
      highlight: form.highlight,
      isActive: form.isActive,
      isCustom: form.isCustom,
    };
    setSaving(true);
    setFormError("");
    try {
      const res = editing
        ? await pricingService.updatePricingPlan(editing._id!, payload)
        : await pricingService.createPricingPlan(payload);
      if (!res.success) {
        setFormError(getErrorMessage(res, "Failed to save the plan"));
        return;
      }
      setShowModal(false);
      fetchPlans();
    } catch (err) {
      setFormError(getErrorMessage(err, "Failed to save the plan"));
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (plan: IPricingPlan) => {
    try {
      await pricingService.togglePricingPlan(plan._id!);
      fetchPlans();
    } catch {
      // handled
    }
  };

  const handleMove = async (index: number, dir: -1 | 1) => {
    const next = [...plans];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    const ordered = next
      .map((p) => p._id)
      .filter((id): id is string => Boolean(id));
    setPlans(next);
    try {
      await pricingService.reorderPricingPlans(ordered);
    } catch {
      fetchPlans();
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await pricingService.deletePricingPlan(deleteTarget._id!);
      setDeleteTarget(null);
      fetchPlans();
    } catch {
      // handled
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<IPricingPlan>[] = [
    {
      key: "order",
      label: "Order",
      render: (p) => {
        const idx = plans.findIndex((x) => x._id === p._id);
        return (
          <div className="flex items-center gap-1">
            <button
              className="btn btn-ghost btn-icon"
              disabled={idx <= 0}
              aria-label="Move up"
              onClick={(e) => {
                e.stopPropagation();
                handleMove(idx, -1);
              }}
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              className="btn btn-ghost btn-icon"
              disabled={idx < 0 || idx >= plans.length - 1}
              aria-label="Move down"
              onClick={(e) => {
                e.stopPropagation();
                handleMove(idx, 1);
              }}
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        );
      },
    },
    {
      key: "name",
      label: "Plan",
      sortable: true,
      render: (p) => (
        <div>
          <span className="font-medium text-foreground">{p.name}</span>
          {p.highlight && <Badge variant="primary">Featured</Badge>}
        </div>
      ),
    },
    {
      key: "monthly",
      label: "Monthly ($)",
      render: (p) =>
        p.monthly === 0 ? "Custom" : `$${(p.monthly / 1000).toFixed(1)}K`,
    },
    {
      key: "yearly",
      label: "Yearly ($)",
      render: (p) => `$${(p.yearly / 1000).toFixed(1)}K`,
    },
    {
      key: "features",
      label: "Features",
      render: (p) => (
        <span className="text-sm text-foreground/70 truncate max-w-55 block">
          {p.features.length} items
        </span>
      ),
    },
    {
      key: "isActive",
      label: "Status",
      render: (p) => (
        <Badge variant={p.isActive !== false ? "success" : "destructive"}>
          {p.isActive !== false ? "Active" : "Hidden"}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (p) => (
        <div className="flex items-center gap-1">
          <button
            className="btn btn-ghost btn-icon"
            aria-label="Toggle active"
            title="Toggle active"
            onClick={(e) => {
              e.stopPropagation();
              handleToggle(p);
            }}
          >
            <Power className="w-4 h-4" />
          </button>
          <button
            className="btn btn-ghost btn-icon"
            aria-label={`Edit ${p.name}`}
            onClick={(e) => {
              e.stopPropagation();
              openEdit(p);
            }}
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            className="btn btn-ghost btn-icon text-destructive"
            aria-label={`Delete ${p.name}`}
            onClick={(e) => {
              e.stopPropagation();
              setDeleteTarget(p);
            }}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pricing Plans</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Manage the pricing plans shown on the public pricing page
          </p>
        </div>
        <button className="btn btn-primary btn-md" onClick={openCreate}>
          <Plus className="w-4 h-4" /> Add Plan
        </button>
      </div>

      <DataTable<IPricingPlan>
        columns={columns}
        data={plans}
        total={plans.length}
        page={1}
        totalPages={1}
        isLoading={loading}
        emptyMessage="No pricing plans yet"
        keyExtractor={(p) => p._id ?? p.name}
      />

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-sm"
          onClick={() => !saving && setShowModal(false)}
        >
          <div
            className="w-full modaldal-content max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-surface p-md shadow-card-hover"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-md flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">
                {editing ? "Edit Plan" : "Add Plan"}
              </h2>
              <button
                className="icon-btn"
                aria-label="Close"
                onClick={() => setShowModal(false)}
                disabled={saving}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="form-alert form-alert-error mb-md">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 gap-md">
              <div>
                <label htmlFor="plan-name" className="form-label">
                  Name *
                </label>
                <input
                  id="plan-name"
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Starter"
                />
              </div>
              <div>
                <label htmlFor="plan-desc" className="form-label">
                  Description
                </label>
                <textarea
                  id="plan-desc"
                  className="input"
                  rows={2}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Short description shown under the plan name"
                />
              </div>
              <div className="grid grid-cols-2 gap-md">
                <div>
                  <label htmlFor="plan-monthly" className="form-label">
                    Monthly ($)
                  </label>
                  <input
                    id="plan-monthly"
                    type="number"
                    className="input"
                    value={form.monthly}
                    onChange={(e) =>
                      setForm({ ...form, monthly: e.target.value })
                    }
                    placeholder="4800"
                  />
                </div>
                <div>
                  <label htmlFor="plan-yearly" className="form-label">
                    Yearly ($)
                  </label>
                  <input
                    id="plan-yearly"
                    type="number"
                    className="input"
                    value={form.yearly}
                    onChange={(e) =>
                      setForm({ ...form, yearly: e.target.value })
                    }
                    placeholder="46080"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="plan-currency" className="form-label">
                  Currency
                </label>
                <input
                  id="plan-currency"
                  className="input"
                  value={form.currency}
                  onChange={(e) =>
                    setForm({ ...form, currency: e.target.value })
                  }
                  placeholder="USD"
                />
              </div>
              <div>
                <label htmlFor="plan-cta" className="form-label">
                  Button Label
                </label>
                <input
                  id="plan-cta"
                  className="input"
                  value={form.cta}
                  onChange={(e) => setForm({ ...form, cta: e.target.value })}
                  placeholder="Start a project"
                />
              </div>
              <div>
                <label htmlFor="plan-cta-text" className="form-label">
                  Button Subtext
                </label>
                <input
                  id="plan-cta-text"
                  className="input"
                  value={form.ctaText}
                  onChange={(e) =>
                    setForm({ ...form, ctaText: e.target.value })
                  }
                  placeholder="Optional note under the features"
                />
              </div>
              <div>
                <label htmlFor="plan-badge" className="form-label">
                  Badge
                </label>
                <input
                  id="plan-badge"
                  className="input"
                  value={form.badge}
                  onChange={(e) => setForm({ ...form, badge: e.target.value })}
                  placeholder="Most popular"
                />
              </div>
              <div>
                <label htmlFor="plan-features" className="form-label">
                  Features (one per line)
                </label>
                <textarea
                  id="plan-features"
                  className="input"
                  rows={5}
                  value={form.features}
                  onChange={(e) =>
                    setForm({ ...form, features: e.target.value })
                  }
                  placeholder={
                    "Unlimited requests\nWeekly sprint cycle\nDedicated product team"
                  }
                />
              </div>
              <div className="flex flex-col gap-2xs">
                <label className="flex items-center gap-2xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.highlight}
                    onChange={(e) =>
                      setForm({ ...form, highlight: e.target.checked })
                    }
                    className="w-sm h-sm rounded-sm border-border bg-surface accent-primary"
                  />
                  <span className="text-body-small text-foreground/70">
                    Featured plan
                  </span>
                </label>
                <label className="flex items-center gap-2xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isCustom}
                    onChange={(e) =>
                      setForm({ ...form, isCustom: e.target.checked })
                    }
                    className="w-sm h-sm rounded-sm border-border bg-surface accent-primary"
                  />
                  <span className="text-body-small text-foreground/70">
                    Custom pricing (shows &quot;Custom&quot;)
                  </span>
                </label>
                <label className="flex items-center gap-2xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) =>
                      setForm({ ...form, isActive: e.target.checked })
                    }
                    className="w-sm h-sm rounded-sm border-border bg-surface accent-primary"
                  />
                  <span className="text-body-small text-foreground/70">
                    Visible on website
                  </span>
                </label>
              </div>
            </div>

            <div className="mt-lg flex justify-end gap-xs">
              <button
                className="btn btn-outline btn-md"
                onClick={() => setShowModal(false)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary btn-md"
                onClick={handleSave}
                disabled={saving}
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-sm"
          onClick={() => !deleting && setDeleteTarget(null)}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-border bg-surface p-md shadow-card-hover"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-foreground mb-2xs">
              Delete plan?
            </h2>
            <p className="text-sm text-foreground/60 mb-md">
              &quot;{deleteTarget.name}&quot; will be permanently removed.
            </p>
            <div className="flex justify-end gap-xs">
              <button
                className="btn btn-outline btn-md"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="btn btn-destructive btn-md"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
