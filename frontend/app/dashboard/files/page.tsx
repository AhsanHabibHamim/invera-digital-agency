'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import * as projectsService from '@/services/projects';
import * as uploadsService from '@/services/uploads';
import { getErrorMessage } from '@/lib/utils';
import type { Project, FileRecord, PaginatedResponse } from '@/types';
import {
  File, Upload, Download, FolderOpen, Trash2,
  Loader2, X, ChevronDown,
} from 'lucide-react';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getFileIcon(type: string): React.ReactNode {
  const ext = type.split('/').pop()?.toLowerCase() ?? '';
  if (['pdf'].includes(ext)) return <File className="w-4 h-4 text-destructive" />;
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) return <File className="w-4 h-4 text-info" />;
  if (['doc', 'docx'].includes(ext)) return <File className="w-4 h-4 text-primary" />;
  if (['xls', 'xlsx', 'csv'].includes(ext)) return <File className="w-4 h-4 text-success" />;
  if (['zip', 'rar', 'gz'].includes(ext)) return <File className="w-4 h-4 text-warning" />;
  return <File className="w-4 h-4 text-neutral-500" />;
}

export default function FilesPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProjects = useCallback(async () => {
    setProjectsLoading(true);
    try {
      const res = await projectsService.getProjects({ limit: '100' });
      if (res.success && res.data) {
        const inner = res.data as unknown as { data?: PaginatedResponse<Project> };
        const paginated = inner.data ?? (res.data as unknown as PaginatedResponse<Project>);
        const items = paginated.projects ?? paginated.data ?? paginated.items ?? [];
        setProjects(items as Project[]);
      }
    } catch {
      // handled
    } finally {
      setProjectsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects(); // eslint-disable-line react-hooks/set-state-in-effect
  }, [fetchProjects]);

  const fetchFiles = useCallback(async (projectId: string) => {
    setFilesLoading(true);
    setFiles([]);
    try {
      const res = await uploadsService.getProjectFiles(projectId);
      if (res.success && res.data) {
        const inner = res.data as unknown as { data?: FileRecord[] };
        const filesArr = inner.data ?? (res.data as unknown as FileRecord[]);
        setFiles(Array.isArray(filesArr) ? (filesArr as FileRecord[]) : []);
      }
    } catch {
      // handled
    } finally {
      setFilesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchFiles(selectedProjectId); // eslint-disable-line react-hooks/set-state-in-effect
    } else {
      setFiles([]);
    }
  }, [selectedProjectId, fetchFiles]);

  const handleUpload = async () => {
    if (!selectedFile || !selectedProjectId) return;
    setUploading(true);
    setUploadError('');
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('projectId', selectedProjectId);
      const res = await uploadsService.uploadFile(formData);
      if (res.success && res.data) {
        const inner = res.data as unknown as { data?: FileRecord };
        const fileRecord = inner.data ?? (res.data as unknown as FileRecord);
        setFiles((prev) => [fileRecord as FileRecord, ...prev]);
        setShowUploadModal(false);
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        setUploadError(getErrorMessage(res, 'Upload failed'));
      }
    } catch (err) {
      setUploadError(getErrorMessage(err, 'Upload failed'));
    } finally {
      setUploading(false);
    }
  };

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedProjectId(e.target.value);
  };

  const selectedProject = projects.find((p) => p._id === selectedProjectId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Files</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Manage project files and uploads
          </p>
        </div>
        <button
          className="btn btn-primary btn-md"
          disabled={!selectedProjectId}
          onClick={() => setShowUploadModal(true)}
        >
          <Upload className="w-4 h-4" />
          Upload File
        </button>
      </div>

      {/* Project Selector */}
      <div className="max-w-sm">
        <label className="form-label" htmlFor="project-select">
          Select Project
        </label>
        {projectsLoading ? (
          <div className="skeleton h-[2.75rem] w-full rounded-md" />
        ) : (
          <select
            id="project-select"
            className="input"
            value={selectedProjectId}
            onChange={handleProjectChange}
          >
            <option value="">Choose a project...</option>
            {projects.map((project) => (
              <option key={project._id} value={project._id}>
                {project.title}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* File List */}
      {!selectedProjectId ? (
        <div className="card-dashboard">
          <div className="empty-state">
            <FolderOpen className="empty-state-icon" />
            <p className="empty-state-title">No project selected</p>
            <p className="empty-state-desc">
              Select a project above to view its files.
            </p>
          </div>
        </div>
      ) : filesLoading ? (
        <div className="card-dashboard">
          <div className="loading-state">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="text-sm text-neutral-500">Loading files...</p>
          </div>
        </div>
      ) : files.length === 0 ? (
        <div className="card-dashboard">
          <div className="empty-state">
            <FolderOpen className="empty-state-icon" />
            <p className="empty-state-title">No files yet</p>
            <p className="empty-state-desc">
              Upload files for <strong>{selectedProject?.title}</strong> to get started.
            </p>
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>File</th>
                <th>Version</th>
                <th>Type</th>
                <th>Uploaded By</th>
                <th>Date</th>
                <th className="w-20">Download</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => (
                <tr key={file._id}>
                  <td>
                    <div className="flex items-center gap-3">
                      {getFileIcon(file.type)}
                      <span className="font-medium text-foreground truncate max-w-[200px]">
                        {file.fileName}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="badge">
                      v{file.version}
                    </span>
                  </td>
                  <td>
                    <span className="text-sm text-neutral-500">
                      {file.type}
                    </span>
                  </td>
                  <td>
                    <span className="text-sm text-foreground">
                      {file.uploadedBy ? (
                        <span className="truncate max-w-[120px] inline-block align-bottom">
                          {(typeof file.uploadedBy === 'string'
                            ? file.uploadedBy
                            : file.uploadedBy.name ?? ''
                          ).length > 12
                            ? `${(typeof file.uploadedBy === 'string'
                                ? file.uploadedBy
                                : file.uploadedBy.name ?? ''
                              ).slice(0, 12)}...`
                            : typeof file.uploadedBy === 'string'
                              ? file.uploadedBy
                              : file.uploadedBy.name ?? ''}
                        </span>
                      ) : (
                        <span className="text-neutral-500">&mdash;</span>
                      )}
                    </span>
                  </td>
                  <td>
                    <span className="text-sm text-neutral-500">
                      {formatDate(file.createdAt)}
                    </span>
                  </td>
                  <td>
                    <a
                      href={file.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-ghost btn-icon"
                      aria-label={`Download ${file.fileName}`}
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-foreground">Upload File</h2>
              <button
                className="btn btn-ghost btn-icon"
                onClick={() => setShowUploadModal(false)}
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="form-label" htmlFor="project-name">
                  Project
                </label>
                <input
                  id="project-name"
                  className="input"
                  value={selectedProject?.title ?? ''}
                  disabled
                />
              </div>

              <div>
                <label className="form-label" htmlFor="file-upload">
                  Select File
                </label>
                <input
                  ref={fileInputRef}
                  id="file-upload"
                  type="file"
                  className="input file:mr-3 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary hover:file:bg-primary/20 pt-1.5"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setSelectedFile(file);
                    setUploadError('');
                  }}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.gif,.svg,.webp,.zip,.rar,.txt,.json,.csv,.ppt,.pptx"
                />
                {selectedFile && (
                  <p className="mt-2 text-sm text-neutral-500">
                    {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>

              {uploadError && (
                <div className="form-alert form-alert-error">
                  {uploadError}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                className="btn btn-outline btn-md"
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedFile(null);
                  setUploadError('');
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary btn-md"
                disabled={!selectedFile || uploading}
                onClick={handleUpload}
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
