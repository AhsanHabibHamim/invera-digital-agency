"use client";

import { useState, useEffect, useCallback } from "react";
import DataTable, { type Column } from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import * as servicesService from "@/services/services";
import { getErrorMessage } from "@/lib/utils";
import type { Service } from "@/types";
import {
  Plus,
  Search,
  X,
  Loader2,
  Pencil,
  Power,
  PowerOff,
  AlertCircle,
} from "lucide-react";

interface ServiceFormData {
  title: string;
  slug: string;
  category: string;
  description: string;
  icon: string;
  pricingTiers: { name: string; price: number; features: string }[];
}

const emptyForm: ServiceFormData = {
  title: "",
  slug: "",
  category: "",
  description: "",
  icon: "",
  pricingTiers: [{ name: "", price: 0, features: "" }],
};

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState<ServiceFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (categoryFilter) params.category = categoryFilter;
      const res = await servicesService.getServices(params);
      if (res.success) {
        setServices(Array.isArray(res.data) ? res.data : []);
      }
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, [categoryFilter]);

  useEffect(() => {
    fetchServices(); // eslint-disable-line react-hooks/set-state-in-effect
  }, [fetchServices]);

  const categoryOptions = Array.from(
    new Set(
      services
        .map((s) => s.category)
        .concat(categoryFilter, form.category)
        .filter(Boolean),
    ),
  ).sort();

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError("");
    setShowModal(true);
  };

  const openEdit = (svc: Service) => {
    setEditing(svc);
    setForm({
      title: svc.title,
      slug: svc.slug,
      category: svc.category,
      description: svc.description,
      icon: svc.icon || "",
      pricingTiers: svc.pricingTiers?.length
        ? svc.pricingTiers.map((t) => ({
            name: t.name,
            price: t.price,
            features: t.features.join(", "),
          }))
        : [{ name: "", price: 0, features: "" }],
    });
    setFormError("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;
    setShowModal(false);
    setFormError("");
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.slug.trim()) {
      setFormError("Please fill in the required fields (Title, Slug).");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const payload = {
        ...form,
        pricingTiers: form.pricingTiers
          .filter((t) => t.name)
          .map((t) => ({
            name: t.name,
            price: t.price,
            features: t.features
              .split(",")
              .map((f) => f.trim())
              .filter(Boolean),
          })),
      };
      const res = editing
        ? await servicesService.updateService(editing._id, payload)
        : await servicesService.createService(payload);
      if (!res.success) {
        setFormError(getErrorMessage(res, "Failed to save the service"));
        return;
      }
      setShowModal(false);
      fetchServices();
    } catch (err) {
      setFormError(
        getErrorMessage(err, "Failed to save the service. Please try again."),
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (svc: Service) => {
    await servicesService.updateService(svc._id, { isActive: !svc.isActive });
    fetchServices();
  };

  const addTier = () => {
    setForm((prev) => ({
      ...prev,
      pricingTiers: [
        ...prev.pricingTiers,
        { name: "", price: 0, features: "" },
      ],
    }));
  };

  const removeTier = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      pricingTiers: prev.pricingTiers.filter((_, i) => i !== idx),
    }));
  };

  const updateTier = (idx: number, field: string, value: string | number) => {
    setForm((prev) => {
      const tiers = [...prev.pricingTiers];
      tiers[idx] = { ...tiers[idx], [field]: value };
      return { ...prev, pricingTiers: tiers };
    });
  };

  const columns: Column<Service>[] = [
    {
      key: "title",
      label: "Title",
      sortable: true,
      render: (s) => (
        <div className="flex items-center gap-2">
          {s.icon && <span className="text-lg">{s.icon}</span>}
          <span className="font-medium text-foreground">{s.title}</span>
        </div>
      ),
    },
    {
      key: "slug",
      label: "Slug",
      render: (s) => <code className="text-xs">{s.slug}</code>,
    },
    {
      key: "category",
      label: "Category",
      render: (s) => <Badge variant="info">{s.category}</Badge>,
    },
    {
      key: "isActive",
      label: "Active",
      render: (s) => (
        <Badge variant={s.isActive ? "success" : "warning"}>
          {s.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (s) => (
        <div className="flex items-center gap-2">
          <button
            className="btn btn-ghost btn-icon"
            aria-label={`Edit ${s.title}`}
            onClick={(e) => {
              e.stopPropagation();
              openEdit(s);
            }}
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            className="btn btn-ghost btn-icon"
            aria-label={
              s.isActive ? `Deactivate ${s.title}` : `Activate ${s.title}`
            }
            onClick={(e) => {
              e.stopPropagation();
              toggleActive(s);
            }}
          >
            {s.isActive ? (
              <PowerOff className="w-4 h-4 text-warning" />
            ) : (
              <Power className="w-4 h-4 text-success" />
            )}
          </button>
        </div>
      ),
    },
  ];

  const filteredServices = search
    ? services.filter((s) =>
        (s.title ?? "").toLowerCase().includes(search.toLowerCase()),
      )
    : services;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Services</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Manage your service offerings
          </p>
        </div>
        <button className="btn btn-primary btn-md" onClick={openCreate}>
          <Plus className="w-4 h-4" /> Add Service
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
          <input
            className="input pl-9"
            placeholder="Search services..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
            }}
          />
        </div>
        <select
          className="input w-auto"
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
          }}
        >
          <option value="">All Categories</option>
          {categoryOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <DataTable<Service>
        columns={columns}
        data={filteredServices}
        total={filteredServices.length}
        page={1}
        totalPages={1}
        isLoading={loading}
        emptyMessage="No services found"
        keyExtractor={(s) => s._id}
      />

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="modal-content p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-foreground">
                {editing ? "Edit Service" : "Create Service"}
              </h2>
              <button
                className="btn btn-ghost btn-icon"
                aria-label="Close"
                onClick={closeModal}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="form-alert form-alert-error mb-4" role="alert">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="form-label" htmlFor="svc-title">
                  Title *
                </label>
                <input
                  id="svc-title"
                  className="input"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label" htmlFor="svc-slug">
                  Slug *
                </label>
                <input
                  id="svc-slug"
                  className="input"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label" htmlFor="svc-category">
                  Category *
                </label>
                <input
                  id="svc-category"
                  className="input"
                  list="service-categories"
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                />
                <datalist id="service-categories">
                  {categoryOptions.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
              <div className="sm:col-span-2">
                <label className="form-label" htmlFor="svc-description">
                  Description
                </label>
                <textarea
                  id="svc-description"
                  className="input"
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>
              <div className="sm:col-span-2">
                <label className="form-label" htmlFor="svc-icon">
                  Icon (emoji or URL)
                </label>
                <input
                  id="svc-icon"
                  className="input"
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                />
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <label className="form-label mb-0">Pricing Tiers</label>
                <button
                  className="btn btn-outline btn-sm"
                  type="button"
                  onClick={addTier}
                >
                  <Plus className="w-3 h-3" /> Add Tier
                </button>
              </div>
              {form.pricingTiers.map((tier, idx) => (
                <div
                  key={idx}
                  className="flex flex-col gap-2 mb-2 p-3 rounded-lg border border-border sm:flex-row sm:items-start"
                >
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:flex-1">
                    <input
                      className="input"
                      placeholder="Name"
                      value={tier.name}
                      onChange={(e) => updateTier(idx, "name", e.target.value)}
                    />
                    <input
                      className="input"
                      type="number"
                      placeholder="Price"
                      value={tier.price}
                      onChange={(e) =>
                        updateTier(idx, "price", Number(e.target.value))
                      }
                    />
                    <input
                      className="input"
                      placeholder="Features (comma separated)"
                      value={tier.features}
                      onChange={(e) =>
                        updateTier(idx, "features", e.target.value)
                      }
                    />
                  </div>
                  {form.pricingTiers.length > 1 && (
                    <button
                      className="btn btn-ghost btn-icon self-end shrink-0 sm:self-start"
                      type="button"
                      aria-label={`Remove tier ${idx + 1}`}
                      onClick={() => removeTier(idx)}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button className="btn btn-outline btn-md" onClick={closeModal}>
                Cancel
              </button>
              <button
                className="btn btn-primary btn-md"
                disabled={saving}
                onClick={handleSave}
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editing ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
