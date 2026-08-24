"use client";

import { useState, useEffect, useCallback } from "react";
import DataTable, { type Column } from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import * as caseStudiesService from "@/services/case-studies";
import { getErrorMessage } from "@/lib/utils";
import type { CaseStudy } from "@/types";
import {
  Plus,
  Search,
  X,
  Loader2,
  Pencil,
  Trash2,
  AlertCircle,
} from "lucide-react";

interface CaseStudyFormData {
  title: string;
  slug: string;
  category: string;
  coverImage: string;
  problem: string;
  solution: string;
  result: string;
  gradient: string;
  published: boolean;
}

const emptyForm = (): CaseStudyFormData => ({
  title: "",
  slug: "",
  category: "",
  coverImage: "",
  problem: "",
  solution: "",
  result: "",
  gradient: "",
  published: false,
});

export default function CaseStudiesPage() {
  const [studies, setStudies] = useState<CaseStudy[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<CaseStudy | null>(null);
  const [form, setForm] = useState<CaseStudyFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<CaseStudy | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchStudies = useCallback(async () => {
    try {
      const res = await caseStudiesService.getCaseStudies();
      if (res.success) {
        setStudies(Array.isArray(res.data) ? res.data : []);
      }
    } catch {
      // handled
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchStudies().finally(() => { // eslint-disable-line react-hooks/set-state-in-effect
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [fetchStudies]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setFormError("");
    setShowModal(true);
  };

  const openEdit = (cs: CaseStudy) => {
    setEditing(cs);
    setForm({
      title: cs.title,
      slug: cs.slug,
      category: cs.category,
      coverImage: cs.coverImage || "",
      problem: cs.problem,
      solution: cs.solution,
      result: cs.result,
      gradient: cs.gradient || "",
      published: cs.published,
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
      const res = editing
        ? await caseStudiesService.updateCaseStudy(editing._id, form)
        : await caseStudiesService.createCaseStudy(form);
      if (!res.success) {
        setFormError(getErrorMessage(res, "Failed to save the case study"));
        return;
      }
      setShowModal(false);
      setLoading(true);
      fetchStudies();
    } catch (err) {
      setFormError(
        getErrorMessage(
          err,
          "Failed to save the case study. Please try again.",
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await caseStudiesService.deleteCaseStudy(deleteTarget._id);
      setDeleteTarget(null);
      setLoading(true);
      fetchStudies();
    } catch {
      // handle error
    } finally {
      setDeleting(false);
    }
  };

  const categoryOptions = Array.from(
    new Set(
      studies
        .map((c) => c.category)
        .concat(categoryFilter, form.category)
        .filter(Boolean),
    ),
  ).sort();

  const visibleStudies = studies.filter((c) => {
    if (categoryFilter && c.category !== categoryFilter) return false;
    if (statusFilter && String(c.published) !== statusFilter) return false;
    if (
      search &&
      !(c.title ?? "").toLowerCase().includes(search.toLowerCase()) &&
      !(c.slug ?? "").toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  const columns: Column<CaseStudy>[] = [
    {
      key: "title",
      label: "Title",
      sortable: true,
      render: (c) => (
        <div>
          <span className="font-medium text-foreground">{c.title}</span>
          {c.gradient && (
            <span
              className="inline-block w-3 h-3 rounded-full ml-2 align-middle"
              style={{ background: c.gradient }}
            />
          )}
        </div>
      ),
    },
    {
      key: "category",
      label: "Category",
      render: (c) => <Badge variant="info">{c.category}</Badge>,
    },
    {
      key: "published",
      label: "Published",
      render: (c) => (
        <Badge variant={c.published ? "success" : "warning"}>
          {c.published ? "Yes" : "No"}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      label: "Created",
      sortable: true,
      render: (c) => new Date(c.createdAt).toLocaleDateString(),
    },
    {
      key: "actions",
      label: "Actions",
      render: (c) => (
        <div className="flex items-center gap-2">
          <button
            className="btn btn-ghost btn-icon"
            aria-label={`Edit ${c.title}`}
            onClick={(e) => {
              e.stopPropagation();
              openEdit(c);
            }}
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            className="btn btn-ghost btn-icon text-destructive"
            aria-label={`Delete ${c.title}`}
            onClick={(e) => {
              e.stopPropagation();
              setDeleteTarget(c);
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
          <h1 className="text-2xl font-bold text-foreground">Case Studies</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Showcase your success stories
          </p>
        </div>
        <button className="btn btn-primary btn-md" onClick={openCreate}>
          <Plus className="w-4 h-4" /> Add Case Study
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
          <input
            className="input pl-9"
            placeholder="Search case studies..."
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
        <select
          className="input w-auto"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
          }}
        >
          <option value="">All Status</option>
          <option value="true">Published</option>
          <option value="false">Drafts</option>
        </select>
      </div>

      <DataTable<CaseStudy>
        columns={columns}
        data={visibleStudies}
        total={visibleStudies.length}
        page={1}
        totalPages={1}
        isLoading={loading}
        emptyMessage="No case studies found"
        keyExtractor={(c) => c._id}
      />

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="modal-content p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-foreground">
                {editing ? "Edit Case Study" : "Create Case Study"}
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
                <label className="form-label" htmlFor="cs-title">
                  Title *
                </label>
                <input
                  id="cs-title"
                  className="input"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label" htmlFor="cs-slug">
                  Slug *
                </label>
                <input
                  id="cs-slug"
                  className="input"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label" htmlFor="cs-category">
                  Category
                </label>
                <input
                  id="cs-category"
                  className="input"
                  list="case-study-categories"
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                />
                <datalist id="case-study-categories">
                  {categoryOptions.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
              <div className="sm:col-span-2">
                <label className="form-label" htmlFor="cs-cover">
                  Cover Image URL
                </label>
                <input
                  id="cs-cover"
                  className="input"
                  value={form.coverImage}
                  onChange={(e) =>
                    setForm({ ...form, coverImage: e.target.value })
                  }
                />
              </div>
              <div className="sm:col-span-2">
                <label className="form-label" htmlFor="cs-problem">
                  Problem
                </label>
                <textarea
                  id="cs-problem"
                  className="input"
                  rows={4}
                  value={form.problem}
                  onChange={(e) =>
                    setForm({ ...form, problem: e.target.value })
                  }
                />
              </div>
              <div className="sm:col-span-2">
                <label className="form-label" htmlFor="cs-solution">
                  Solution
                </label>
                <textarea
                  id="cs-solution"
                  className="input"
                  rows={4}
                  value={form.solution}
                  onChange={(e) =>
                    setForm({ ...form, solution: e.target.value })
                  }
                />
              </div>
              <div className="sm:col-span-2">
                <label className="form-label" htmlFor="cs-result">
                  Result
                </label>
                <textarea
                  id="cs-result"
                  className="input"
                  rows={4}
                  value={form.result}
                  onChange={(e) => setForm({ ...form, result: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label" htmlFor="cs-gradient">
                  Gradient (CSS value)
                </label>
                <input
                  id="cs-gradient"
                  className="input"
                  placeholder="e.g. linear-gradient(...)"
                  value={form.gradient}
                  onChange={(e) =>
                    setForm({ ...form, gradient: e.target.value })
                  }
                />
              </div>
              <div className="min-h-[2.75rem] flex items-center">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={form.published}
                    onChange={(e) =>
                      setForm({ ...form, published: e.target.checked })
                    }
                  />
                  <span className="checkbox-label">Published</span>
                </label>
              </div>
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

      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div
            className="modal-content p-6 max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-foreground mb-2">
              Delete Case Study
            </h2>
            <p className="text-sm text-foreground/60 mb-6">
              Are you sure you want to delete &ldquo;{deleteTarget.title}
              &rdquo;? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                className="btn btn-outline btn-md"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn-destructive btn-md"
                disabled={deleting}
                onClick={handleDelete}
              >
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
