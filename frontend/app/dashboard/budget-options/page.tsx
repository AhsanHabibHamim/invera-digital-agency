"use client";

import { useState, useEffect, useCallback } from "react";
import DataTable, { type Column } from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import * as budgetService from "@/services/budget-options";
import { getErrorMessage } from "@/lib/utils";
import type { IBudgetOption } from "@/types/pricing";
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

interface OptionForm {
  label: string;
  value: string;
  isActive: boolean;
}

const emptyForm: OptionForm = { label: "", value: "", isActive: true };

export default function BudgetOptionsPage() {
  const [options, setOptions] = useState<IBudgetOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<IBudgetOption | null>(null);
  const [form, setForm] = useState<OptionForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<IBudgetOption | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchOptions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await budgetService.getBudgetOptions();
      if (res.success) {
        const data = res.data as unknown;
        const items = Array.isArray(data)
          ? (data as IBudgetOption[])
          : ((data as { data?: unknown })?.data as IBudgetOption[] | undefined) ?? [];
        setOptions(items);
      }
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOptions();
  }, [fetchOptions]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError("");
    setShowModal(true);
  };

  const openEdit = (o: IBudgetOption) => {
    setEditing(o);
    setForm({
      label: o.label,
      value: o.value,
      isActive: o.isActive !== false,
    });
    setFormError("");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.label.trim() || !form.value.trim()) {
      setFormError("Both label and value are required.");
      return;
    }
    const payload: Partial<IBudgetOption> = {
      label: form.label.trim(),
      value: form.value.trim(),
      isActive: form.isActive,
    };
    setSaving(true);
    setFormError("");
    try {
      const res = editing
        ? await budgetService.updateBudgetOption(editing._id!, payload)
        : await budgetService.createBudgetOption(payload);
      if (!res.success) {
        setFormError(getErrorMessage(res, "Failed to save the option"));
        return;
      }
      setShowModal(false);
      fetchOptions();
    } catch (err) {
      setFormError(getErrorMessage(err, "Failed to save the option"));
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (o: IBudgetOption) => {
    try {
      await budgetService.toggleBudgetOption(o._id!);
      fetchOptions();
    } catch {
      // handled
    }
  };

  const handleMove = async (index: number, dir: -1 | 1) => {
    const next = [...options];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    const ordered = next
      .map((o) => o._id)
      .filter((id): id is string => Boolean(id));
    setOptions(next);
    try {
      await budgetService.reorderBudgetOptions(ordered);
    } catch {
      fetchOptions();
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await budgetService.deleteBudgetOption(deleteTarget._id!);
      setDeleteTarget(null);
      fetchOptions();
    } catch {
      // handled
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<IBudgetOption>[] = [
    {
      key: "order",
      label: "Order",
      render: (o) => {
        const idx = options.findIndex((x) => x._id === o._id);
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
              disabled={idx < 0 || idx >= options.length - 1}
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
      key: "label",
      label: "Label",
      sortable: true,
      render: (o) => <span className="font-medium text-foreground">{o.label}</span>,
    },
    {
      key: "value",
      label: "Value",
      render: (o) => (
        <span className="font-mono text-sm text-foreground/70">{o.value}</span>
      ),
    },
    {
      key: "isActive",
      label: "Status",
      render: (o) => (
        <Badge variant={o.isActive !== false ? "success" : "destructive"}>
          {o.isActive !== false ? "Active" : "Hidden"}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (o) => (
        <div className="flex items-center gap-1">
          <button
            className="btn btn-ghost btn-icon"
            aria-label="Toggle active"
            title="Toggle active"
            onClick={(e) => {
              e.stopPropagation();
              handleToggle(o);
            }}
          >
            <Power className="w-4 h-4" />
          </button>
          <button
            className="btn btn-ghost btn-icon"
            aria-label={`Edit ${o.label}`}
            onClick={(e) => {
              e.stopPropagation();
              openEdit(o);
            }}
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            className="btn btn-ghost btn-icon text-destructive"
            aria-label={`Delete ${o.label}`}
            onClick={(e) => {
              e.stopPropagation();
              setDeleteTarget(o);
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
          <h1 className="text-2xl font-bold text-foreground">Budget Options</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Budget ranges shown in the contact form dropdown
          </p>
        </div>
        <button className="btn btn-primary btn-md" onClick={openCreate}>
          <Plus className="w-4 h-4" /> Add Option
        </button>
      </div>

      <DataTable<IBudgetOption>
        columns={columns}
        data={options}
        total={options.length}
        page={1}
        totalPages={1}
        isLoading={loading}
        emptyMessage="No budget options yet"
        keyExtractor={(o) => o._id ?? o.label}
      />

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-sm"
          onClick={() => !saving && setShowModal(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-border bg-surface p-md shadow-card-hover"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-md flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">
                {editing ? "Edit Option" : "Add Option"}
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
              <div className="form-alert form-alert-error mb-md">{formError}</div>
            )}

            <div className="grid grid-cols-1 gap-md">
              <div>
                <label htmlFor="opt-label" className="form-label">Label *</label>
                <input
                  id="opt-label"
                  className="input"
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  placeholder="$10K – $25K"
                />
              </div>
              <div>
                <label htmlFor="opt-value" className="form-label">Value *</label>
                <input
                  id="opt-value"
                  className="input"
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                  placeholder="10000-25000"
                />
              </div>
              <label className="flex items-center gap-2xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="w-sm h-sm rounded-sm border-border bg-surface accent-primary"
                />
                <span className="text-body-small text-foreground/70">Visible on website</span>
              </label>
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
              Delete option?
            </h2>
            <p className="text-sm text-foreground/60 mb-md">
              &quot;{deleteTarget.label}&quot; will be permanently removed.
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
