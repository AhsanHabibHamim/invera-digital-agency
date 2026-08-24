/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import DataTable, { type Column } from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import * as blogService from "@/services/blog";
import { getErrorMessage } from "@/lib/utils";
import type { BlogPost } from "@/types";
import {
  Plus,
  Search,
  X,
  Loader2,
  Pencil,
  Trash2,
  AlertCircle,
  FileText,
} from "lucide-react";

interface BlogFormData {
  title: string;
  slug: string;
  coverImage: string;
  excerpt: string;
  body: string;
  tags: string;
  published: boolean;
}

const emptyForm = (): BlogFormData => ({
  title: "",
  slug: "",
  coverImage: "",
  excerpt: "",
  body: "",
  tags: "",
  published: false,
});

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [form, setForm] = useState<BlogFormData>(emptyForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<BlogPost | null>(null);
  const [deleting, setDeleting] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);

  const fetchPosts = useCallback(async () => {
    try {
      const res = await blogService.getBlogPosts();
      if (res.success) {
        setPosts(Array.isArray(res.data) ? res.data : []);
      }
    } catch {
      // handled by empty state
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchPosts().finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [fetchPosts]);

  // Lock background scroll + close on Escape while a modal is open
  useEffect(() => {
    const anyModalOpen = showModal || !!deleteTarget;
    if (!anyModalOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (saving || deleting) return;
      if (showModal) setShowModal(false);
      if (deleteTarget) setDeleteTarget(null);
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [showModal, deleteTarget, saving, deleting]);

  // Focus the title field when the modal opens
  useEffect(() => {
    if (showModal) {
      const id = window.setTimeout(() => titleInputRef.current?.focus(), 50);
      return () => window.clearTimeout(id);
    }
  }, [showModal]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setSlugTouched(false);
    setFormError("");
    setShowModal(true);
  };

  const openEdit = (post: BlogPost) => {
    setEditing(post);
    setForm({
      title: post.title ?? "",
      slug: post.slug ?? "",
      coverImage: post.coverImage || "",
      excerpt: post.excerpt || "",
      body: post.body ?? "",
      tags: (post.tags || []).join(", "),
      published: !!post.published,
    });
    setSlugTouched(true);
    setFormError("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;
    setShowModal(false);
    setFormError("");
  };

  const handleTitleChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      title: value,
      slug: slugTouched ? prev.slug : slugify(value),
    }));
  };

  const handleSave = async () => {
    const title = form.title.trim();
    const slug = form.slug.trim();
    const body = form.body.trim();

    if (!title || !slug || !body) {
      setFormError("Please fill in the required fields (Title, Slug, Body).");
      return;
    }

    setSaving(true);
    setFormError("");
    try {
      const payload = {
        ...form,
        title,
        slug,
        body,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      };
      const res = editing
        ? await blogService.updateBlogPost(editing._id, payload)
        : await blogService.createBlogPost(payload);

      if (!res.success) {
        setFormError(getErrorMessage(res, "Failed to save the post"));
        return;
      }

      setShowModal(false);
      setLoading(true);
      await fetchPosts();
      setLoading(false);
    } catch (err) {
      setFormError(
        getErrorMessage(err, "Failed to save the post. Please try again."),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await blogService.deleteBlogPost(deleteTarget._id);
      setDeleteTarget(null);
      setLoading(true);
      await fetchPosts();
      setLoading(false);
    } catch {
      // could surface a toast here
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<BlogPost>[] = [
    {
      key: "title",
      label: "Title",
      sortable: true,
      render: (p) => (
        <div>
          <span className="font-medium text-foreground">{p.title}</span>
          {p.excerpt && (
            <p className="text-xs text-foreground/40 truncate max-w-xs">
              {p.excerpt}
            </p>
          )}
        </div>
      ),
    },
    { key: "author", label: "Author", sortable: true },
    {
      key: "published",
      label: "Status",
      render: (p) => (
        <Badge variant={p.published ? "success" : "warning"}>
          {p.published ? "Published" : "Draft"}
        </Badge>
      ),
    },
    {
      key: "tags",
      label: "Tags",
      render: (p) => (
        <div className="flex flex-wrap gap-1">
          {(p.tags || []).slice(0, 3).map((t) => (
            <Badge key={t} variant="info">
              {t}
            </Badge>
          ))}
          {(p.tags || []).length > 3 && (
            <span className="text-xs text-foreground/40">
              +{(p.tags || []).length - 3}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "publishedAt",
      label: "Published Date",
      sortable: true,
      render: (p) =>
        p.publishedAt ? (
          new Date(p.publishedAt).toLocaleDateString()
        ) : (
          <span className="text-foreground/40">—</span>
        ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (p) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            aria-label={`Edit ${p.title}`}
            onClick={(e) => {
              e.stopPropagation();
              openEdit(p);
            }}
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-icon text-destructive"
            aria-label={`Delete ${p.title}`}
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

  const visiblePosts = posts.filter((p) => {
    if (statusFilter && String(p.published) !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !(p.title ?? "").toLowerCase().includes(q) &&
        !(p.slug ?? "").toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="eyebrow">Content</span>
          <h1 className="text-2xl font-bold text-foreground mt-1">
            Blog Posts
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Manage your blog content
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-md"
          onClick={openCreate}
        >
          <Plus className="w-4 h-4" /> Add Post
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-50 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
          <input
            className="input pl-9"
            placeholder="Search posts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input w-auto"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="true">Published</option>
          <option value="false">Drafts</option>
        </select>
      </div>

      {/* Table */}
      <DataTable<BlogPost>
        columns={columns}
        data={visiblePosts}
        total={visiblePosts.length}
        page={1}
        totalPages={1}
        isLoading={loading}
        emptyMessage="No blog posts found"
        keyExtractor={(p) => p._id}
      />

      {/* Create / Edit Modal */}
      {showModal && (
        <div
          className="modal-overlay"
          onMouseDown={closeModal}
          role="presentation"
        >
          <div
            className="modal-content flex w-full flex-col overflow-hidden"
            onMouseDown={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="blog-modal-title"
          >
            {/* Header — fixed, never scrolls */}
            <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-5 sm:px-8 sm:py-6">
              <div>
                <h2
                  id="blog-modal-title"
                  className="flex items-center gap-2 text-h4 font-bold text-foreground"
                >
                  <FileText className="h-5 w-5 text-primary" />
                  {editing ? "Edit Blog Post" : "Create Blog Post"}
                </h2>

                <p className="mt-1 text-body-small text-foreground/60">
                  Fill in the details below.
                </p>
              </div>

              <button
                type="button"
                className="btn btn-ghost btn-icon"
                onClick={closeModal}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Error — fixed, never scrolls */}
            {formError && (
              <div className="shrink-0 px-5 pt-5 sm:px-8 sm:pt-6">
                <div className="form-alert form-alert-error" role="alert">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              </div>
            )}

            {/* Form wraps the scrollable body + the fixed footer */}
            <form
              className="flex min-h-0 flex-1 flex-col"
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}
            >
              {/* Scrollable body — the ONLY part that scrolls */}
              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-8">
                <div className="space-y-8">
                  {/* Basic */}
                  <section>
                    <h3 className="mb-5 text-h5 font-semibold">
                      Basic Information
                    </h3>

                    <div className="grid gap-5 md:grid-cols-2">
                      {/* Title */}
                      <div className="md:col-span-2">
                        <label className="form-label">
                          Title
                          <span className="ml-1 text-destructive">*</span>
                        </label>

                        <input
                          className="input"
                          value={form.title}
                          onChange={(e) => handleTitleChange(e.target.value)}
                          disabled={saving}
                        />
                      </div>

                      {/* Slug */}
                      <div>
                        <label className="form-label">Slug</label>

                        <input
                          className="input"
                          value={form.slug}
                          onChange={(e) => {
                            setSlugTouched(true);
                            setForm({
                              ...form,
                              slug: slugify(e.target.value),
                            });
                          }}
                          disabled={saving}
                        />

                        <p className="mt-2 text-caption text-foreground/50">
                          /blog/{form.slug || "your-post"}
                        </p>
                      </div>

                      {/* Cover */}
                      <div>
                        <label className="form-label">Cover Image</label>

                        <input
                          className="input"
                          value={form.coverImage}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              coverImage: e.target.value,
                            })
                          }
                          disabled={saving}
                        />
                      </div>

                      {/* Excerpt */}
                      <div className="md:col-span-2">
                        <label className="form-label">Excerpt</label>

                        <input
                          className="input"
                          value={form.excerpt}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              excerpt: e.target.value,
                            })
                          }
                          disabled={saving}
                        />
                      </div>
                    </div>
                  </section>

                  {/* Content */}
                  <section>
                    <h3 className="mb-5 text-h5 font-semibold">Content</h3>

                    <div className="space-y-5">
                      <div>
                        <label className="form-label">
                          Body
                          <span className="ml-1 text-destructive">*</span>
                        </label>

                        <textarea
                          rows={10}
                          className="input min-h-64"
                          value={form.body}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              body: e.target.value,
                            })
                          }
                          disabled={saving}
                        />
                      </div>

                      <div>
                        <label className="form-label">Tags</label>

                        <input
                          className="input"
                          value={form.tags}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              tags: e.target.value,
                            })
                          }
                          disabled={saving}
                        />
                      </div>

                      <div className="rounded-lg border border-border bg-surface p-4">
                        <label className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            className="checkbox"
                            checked={form.published}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                published: e.target.checked,
                              })
                            }
                            disabled={saving}
                          />

                          <div>
                            <p className="font-medium">Publish immediately</p>

                            <p className="text-body-small text-foreground/60">
                              This article will be publicly visible.
                            </p>
                          </div>
                        </label>
                      </div>
                    </div>
                  </section>
                </div>
              </div>

              {/* Footer — fixed, never scrolls, always visible */}
              <div className="flex shrink-0 flex-col-reverse items-center justify-between gap-3 border-t border-border px-5 py-5 sm:flex-row sm:px-8 sm:py-5">
                <span className="text-body-small text-foreground/50">
                  * Required fields
                </span>

                <div className="flex w-full gap-3 sm:w-auto">
                  <button
                    type="button"
                    className="btn btn-outline btn-md flex-1 sm:flex-initial"
                    onClick={closeModal}
                    disabled={saving}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="btn btn-primary btn-md flex-1 sm:flex-initial"
                    disabled={saving}
                  >
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    {editing ? "Update Post" : "Create Post"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          className="modal-overlay"
          onMouseDown={() => !deleting && setDeleteTarget(null)}
          role="presentation"
        >
          <div
            className="modal-content p-6 max-w-sm"
            onMouseDown={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
          >
            <h2
              id="delete-modal-title"
              className="text-lg font-bold text-foreground mb-2"
            >
              Delete Post
            </h2>
            <p className="text-sm text-foreground/60 mb-6">
              Are you sure you want to delete &ldquo;{deleteTarget.title}
              &rdquo;? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="btn btn-outline btn-md"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
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
function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
