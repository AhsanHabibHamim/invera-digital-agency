"use client";

import { useState, useEffect, useCallback } from "react";
import DataTable, { type Column } from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import * as cmsService from "@/services/cms";
import { getErrorMessage } from "@/lib/utils";
import type { CmsContent, SeoMeta } from "@/types";
import {
  Plus,
  Search,
  X,
  Loader2,
  Pencil,
  Trash2,
  AlertCircle,
} from "lucide-react";

const CONTENT_TYPES = ["text", "html", "json", "image"];
const DEFAULT_PAGE_KEY = "home";

interface CmsFormData {
  pageKey: string;
  sectionKey: string;
  contentType: string;
  content: string;
  seoMeta: SeoMeta;
}

const emptyForm: CmsFormData = {
  pageKey: "",
  sectionKey: "",
  contentType: "text",
  content: "",
  seoMeta: { metaTitle: "", metaDescription: "", ogImage: "" },
};

export default function CmsPage() {
  const [sections, setSections] = useState<CmsContent[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [pageKey, setPageKey] = useState(DEFAULT_PAGE_KEY);
  const [pageKeyInput, setPageKeyInput] = useState(DEFAULT_PAGE_KEY);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<CmsContent | null>(null);
  const [form, setForm] = useState<CmsFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<CmsContent | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchSections = useCallback(async (pk: string) => {
    setLoading(true);
    try {
      const res = await cmsService.getPageSections(pk);
      if (res.success) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const d = res.data as any;
        const items = (d.data ?? d.sections ?? Array.isArray(d)) ? d : [];
        setSections(Array.isArray(items) ? (items as CmsContent[]) : []);
        setTotal(Array.isArray(items) ? items.length : 0);
        setTotalPages(1);
      }
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSections(pageKey);
  }, [fetchSections, pageKey]);

  const applyPageKey = () => {
    const pk = pageKeyInput.trim() || DEFAULT_PAGE_KEY;
    setPageKeyInput(pk);
    setPageKey(pk);
    setPage(1);
  };

  const visibleSections = sections.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.sectionKey.toLowerCase().includes(q) ||
      s.pageKey.toLowerCase().includes(q) ||
      (typeof s.content === "string" && s.content.toLowerCase().includes(q))
    );
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, pageKey });
    setFormError("");
    setShowModal(true);
  };

  const openEdit = (sec: CmsContent) => {
    setEditing(sec);
    setForm({
      pageKey: sec.pageKey,
      sectionKey: sec.sectionKey,
      contentType: sec.contentType,
      content:
        typeof sec.content === "string"
          ? sec.content
          : JSON.stringify(sec.content, null, 2),
      seoMeta: sec.seoMeta || {
        metaTitle: "",
        metaDescription: "",
        ogImage: "",
      },
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
    if (!form.pageKey.trim() || !form.sectionKey.trim()) {
      setFormError(
        "Please fill in the required fields (Page Key, Section Key).",
      );
      return;
    }
    let processedContent: cmsService.CmsContentPayload = form.content;
    if (form.contentType === "json") {
      try {
        processedContent = JSON.parse(form.content);
      } catch {
        setFormError("Invalid JSON in content. Please check the formatting.");
        return;
      }
    }
    setSaving(true);
    setFormError("");
    try {
      const res = await cmsService.upsertSection(
        form.pageKey,
        form.sectionKey,
        {
          contentType: form.contentType as "text" | "html" | "json" | "image",
          content: processedContent,
        },
      );
      if (!res.success) {
        setFormError(getErrorMessage(res, "Failed to save the section"));
        return;
      }

      if (
        form.seoMeta.metaTitle ||
        form.seoMeta.metaDescription ||
        form.seoMeta.ogImage
      ) {
        const seoRes = await cmsService.updateSeo(form.pageKey, form.seoMeta);
        if (!seoRes.success) {
          setFormError(getErrorMessage(seoRes, "Failed to update SEO meta"));
          return;
        }
      }

      setShowModal(false);
      fetchSections(form.pageKey);
    } catch (err) {
      setFormError(
        getErrorMessage(err, "Failed to save the section. Please try again."),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await cmsService.deleteSection(
        deleteTarget.pageKey,
        deleteTarget.sectionKey,
      );
      setDeleteTarget(null);
      fetchSections(pageKey);
    } catch {
      // handle error
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<CmsContent>[] = [
    {
      key: "pageKey",
      label: "Page Key",
      sortable: true,
      render: (c) => (
        <span className="font-medium text-foreground">{c.pageKey}</span>
      ),
    },
    { key: "sectionKey", label: "Section Key", sortable: true },
    {
      key: "contentType",
      label: "Content Type",
      render: (c) => (
        <Badge
          variant={
            c.contentType === "json"
              ? "warning"
              : c.contentType === "html"
                ? "accent"
                : "info"
          }
        >
          {c.contentType}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (c) => (
        <div className="flex items-center gap-2">
          <button
            className="btn btn-ghost btn-icon"
            aria-label={`Edit ${c.sectionKey}`}
            onClick={(e) => {
              e.stopPropagation();
              openEdit(c);
            }}
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            className="btn btn-ghost btn-icon text-destructive"
            aria-label={`Delete ${c.sectionKey}`}
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
          <h1 className="text-2xl font-bold text-foreground">CMS Content</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Manage page content and sections
          </p>
        </div>
        <button className="btn btn-primary btn-md" onClick={openCreate}>
          <Plus className="w-4 h-4" /> Add Section
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
          <input
            className="input pl-9"
            placeholder="Search sections..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            className="input w-40"
            placeholder="Page key (e.g. home)"
            value={pageKeyInput}
            onChange={(e) => {
              setPageKeyInput(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") applyPageKey();
            }}
            onBlur={applyPageKey}
          />
          <button
            className="btn btn-outline btn-md"
            type="button"
            onClick={applyPageKey}
          >
            Load
          </button>
        </div>
      </div>

      <DataTable<CmsContent>
        columns={columns}
        data={visibleSections}
        total={visibleSections.length}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        isLoading={loading}
        emptyMessage="No CMS sections found"
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
                {editing ? "Edit Section" : "Create Section"}
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
              <div>
                <label className="form-label" htmlFor="cms-page-key">
                  Page Key *
                </label>
                <input
                  id="cms-page-key"
                  className="input"
                  value={form.pageKey}
                  onChange={(e) =>
                    setForm({ ...form, pageKey: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="form-label" htmlFor="cms-section-key">
                  Section Key *
                </label>
                <input
                  id="cms-section-key"
                  className="input"
                  value={form.sectionKey}
                  onChange={(e) =>
                    setForm({ ...form, sectionKey: e.target.value })
                  }
                />
              </div>
              <div className="sm:col-span-2">
                <label className="form-label" htmlFor="cms-content-type">
                  Content Type
                </label>
                <select
                  id="cms-content-type"
                  className="input"
                  value={form.contentType}
                  onChange={(e) =>
                    setForm({ ...form, contentType: e.target.value })
                  }
                >
                  {CONTENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="form-label" htmlFor="cms-content">
                  Content
                </label>
                <textarea
                  id="cms-content"
                  className="input font-mono text-xs"
                  rows={8}
                  value={form.content}
                  onChange={(e) =>
                    setForm({ ...form, content: e.target.value })
                  }
                  placeholder={
                    form.contentType === "json"
                      ? '{\n  "key": "value"\n}'
                      : "Enter content..."
                  }
                />
                {form.contentType === "json" && (
                  <p className="mt-2 text-xs text-foreground/40 leading-relaxed">
                    Tip: For structured sections, <code className="font-mono">title</code> must be an array of
                    segments — <code className="font-mono">{"[{ text, tone, break }]"}</code> — and list fields
                    (services, projects, stats…) must be arrays. Known sections are automatically normalized on save.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 border-t border-border pt-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">
                SEO Meta
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="form-label" htmlFor="cms-meta-title">
                    Meta Title
                  </label>
                  <input
                    id="cms-meta-title"
                    className="input"
                    value={form.seoMeta.metaTitle || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        seoMeta: { ...form.seoMeta, metaTitle: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="form-label" htmlFor="cms-meta-desc">
                    Meta Description
                  </label>
                  <textarea
                    id="cms-meta-desc"
                    className="input"
                    rows={2}
                    value={form.seoMeta.metaDescription || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        seoMeta: {
                          ...form.seoMeta,
                          metaDescription: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="form-label" htmlFor="cms-og-image">
                    OG Image URL
                  </label>
                  <input
                    id="cms-og-image"
                    className="input"
                    value={form.seoMeta.ogImage || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        seoMeta: { ...form.seoMeta, ogImage: e.target.value },
                      })
                    }
                  />
                </div>
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
              Delete Section
            </h2>
            <p className="text-sm text-foreground/60 mb-6">
              Are you sure you want to delete section &ldquo;
              {deleteTarget.sectionKey}&rdquo; from page &ldquo;
              {deleteTarget.pageKey}&rdquo;? This action cannot be undone.
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
