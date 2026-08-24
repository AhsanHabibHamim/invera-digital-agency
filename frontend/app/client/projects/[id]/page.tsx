'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import * as projectsService from '@/services/projects';
import type { Project } from '@/types';
import {
  ArrowLeft, Briefcase, Loader2, FileCheck2, MessageSquareWarning, CheckCircle2, XCircle, Check,
} from 'lucide-react';

const statusBadge: Record<string, string> = {
  requested: 'badge-info',
  quoted: 'badge-primary',
  in_progress: 'badge-accent',
  in_review: 'badge-warning',
  completed: 'badge-success',
  closed: 'badge',
};

// Ordered lifecycle used to render the live "order tracking" timeline.
const TRACK_STEPS: { key: string; label: string }[] = [
  { key: 'requested', label: 'Requested' },
  { key: 'quoted', label: 'Quoted' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'in_review', label: 'In review' },
  { key: 'completed', label: 'Completed' },
];

export default function ClientProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
const [acting, setActing] = useState(false);
const [revisionFor, setRevisionFor] = useState<{ milestoneId: string; title: string; notes: string } | null>(null);

  const fetchProject = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await projectsService.getProject(id);
      if (res.success) setProject(res.data);
      else setError(res.message || 'Failed to load project');
    } catch {
      setError('Failed to load project');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchProject(); }, [fetchProject]); // eslint-disable-line react-hooks/set-state-in-effect

  const handleAcceptContract = async () => {
    if (!project) return;
    setActing(true);
    setError('');
    try {
      const res = await projectsService.acceptContract(project._id);
      if (res.success) setProject(res.data);
      else setError(res.message || 'Failed to accept contract');
    } catch {
      setError('Failed to accept contract');
    } finally {
      setActing(false);
    }
  };

  const handleRequestRevision = async () => {
    if (!project || !revisionFor || !revisionFor.notes.trim()) return;
    setActing(true);
    setError('');
    try {
      const res = await projectsService.requestRevision(project._id, {
        milestoneId: revisionFor.milestoneId,
        revisionNotes: revisionFor.notes.trim(),
      });
      if (res.success) {
        setProject(res.data);
        setRevisionFor(null);
      } else {
        setError(res.message || 'Failed to request revision');
      }
    } catch {
      setError('Failed to request revision');
    } finally {
      setActing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !project) {
    return (
      <div className="empty-state">
        <Briefcase className="empty-state-icon" />
        <p className="empty-state-title">{error}</p>
        <button className="btn btn-outline btn-md mt-sm" onClick={() => router.back()}>Go Back</button>
      </div>
    );
  }

  if (!project) return null;

  const milestones = project.milestones ?? [];

  return (
    <div className="flex flex-col gap-md">
      <div className="flex items-center gap-xs">
        <Link href="/client/projects" className="icon-btn" aria-label="Back to projects">
          <ArrowLeft className="w-sm h-sm" />
        </Link>
        <div className="flex items-center gap-xs">
          <h1 className="text-h3 font-bold text-foreground">{project.title}</h1>
          <span className={`badge ${statusBadge[project.status] ?? 'badge'}`}>
            {project.status.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      {error && <div className="form-alert form-alert-error">{error}</div>}

      {project.description && (
        <div className="card-dashboard">
          <h3 className="dashboard-section-title m-0 p-0 border-none">Project brief</h3>
          <p className="whitespace-pre-wrap text-body-small leading-relaxed text-foreground/70">
            {project.description}
          </p>
        </div>
      )}

      {/* Order tracking timeline */}
      <div className="card-dashboard">
        <div className="mb-sm flex items-center justify-between">
          <h3 className="dashboard-section-title m-0 p-0 border-none">Project status</h3>
          <span className={`badge ${statusBadge[project.status] ?? 'badge'}`}>
            {project.status.replace(/_/g, ' ')}
          </span>
        </div>
        <ol className="m-0 flex list-none items-center gap-0 p-0">
          {TRACK_STEPS.map((step, idx) => {
            const currentIndex = project.status === 'closed' ? TRACK_STEPS.length - 1 : TRACK_STEPS.findIndex((s) => s.key === project.status);
            const isReached = idx <= currentIndex;
            const isCurrent = idx === currentIndex;
            return (
              <li key={step.key} className="relative flex flex-1 flex-col items-center">
                {idx > 0 && (
                  <span
                    className={`absolute top-3 right-1/2 h-[2px] w-full -translate-y-1/2 rounded-full ${idx <= currentIndex ? 'bg-primary' : 'bg-border'}`}
                  />
                )}
                <span
                  className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                    isReached ? 'bg-primary text-primary-foreground' : 'bg-surface text-foreground/30 border border-border'
                  } ${isCurrent ? 'ring-4 ring-primary/20' : ''}`}
                >
                  {isReached ? <Check className="h-3 w-3" /> : idx + 1}
                </span>
                <span
                  className={`mt-2xs text-center text-[11px] leading-tight ${isReached ? 'text-foreground' : 'text-foreground/30'}`}
                >
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="card-dashboard">
        <div className="flex items-center justify-between gap-sm mb-xs">
          <span className="text-body-small font-medium text-foreground">Overall Progress</span>
          <span className="text-body-small font-semibold text-foreground">{project.progressPercent}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${project.progressPercent}%` }} />
        </div>
        <p className="mt-xs text-caption text-foreground/50">
          {milestones.filter((m) => m.done).length} of {milestones.length} milestones completed
        </p>
      </div>

      {!project.contractAccepted && (
        <div className="card-dashboard flex flex-col items-start gap-xs sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-body-small font-semibold text-foreground">Contract not yet accepted</p>
            <p className="text-caption text-foreground/50 mt-2xs">
              Accept the contract to officially kick off the project.
            </p>
          </div>
          <button className="btn btn-primary btn-md" onClick={handleAcceptContract} disabled={acting}>
            {acting ? <Loader2 className="w-sm h-sm animate-spin" /> : <FileCheck2 className="w-sm h-sm" />}
            Accept Contract
          </button>
        </div>
      )}

      <div className="card-dashboard">
        <h3 className="dashboard-section-title m-0 p-0 border-none">Milestones</h3>
        {milestones.length === 0 ? (
          <div className="empty-state py-lg">
            <Briefcase className="empty-state-icon" />
            <p className="empty-state-title">No milestones yet</p>
            <p className="empty-state-desc">Your project milestones will appear here.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-xs">
            {milestones.map((milestone, idx) => (
              <div key={`${milestone.title}-${idx}`} className="rounded-lg border border-border p-xs">
                <div className="flex items-center justify-between gap-xs">
                  <div className="flex items-center gap-xs min-w-0">
                    {milestone.done ? (
                      <CheckCircle2 className="w-sm h-sm shrink-0 text-success" />
                    ) : (
                      <XCircle className="w-sm h-sm shrink-0 text-foreground/30" />
                    )}
                    <div className="min-w-0">
                      <p className="text-small font-medium text-foreground truncate">{milestone.title}</p>
                      <p className="text-caption text-foreground/50 mt-2xs">
                        {milestone.dueDate ? `Due ${new Date(milestone.dueDate).toLocaleDateString()}` : 'No due date'}
                        {milestone.revisionRequested ? ' · Revision requested' : ''}
                      </p>
                    </div>
                  </div>
                  {!milestone.done && ['in_progress', 'in_review', 'quoted', 'requested'].includes(project.status) && (
                    <button
                      className="btn btn-outline btn-sm shrink-0"
                      onClick={() => milestone._id && setRevisionFor({ milestoneId: milestone._id, title: milestone.title, notes: '' })}
                      disabled={acting || !milestone._id}
                    >
                      <MessageSquareWarning className="w-sm h-sm" /> Request Revision
                    </button>
                  )}
                </div>
                {milestone.revisionNotes && (
                  <p className="mt-xs text-body-small text-foreground/60 border-t border-border pt-xs">
                    {milestone.revisionNotes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {revisionFor && (
        <div className="modal-overlay" onClick={() => setRevisionFor(null)}>
          <div className="modal-content p-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-h5 font-bold text-foreground mb-2xs">Request Revision</h3>
            <p className="text-caption text-foreground/50 mb-sm">Milestone: {revisionFor.title}</p>
            <label className="form-label">Revision notes</label>
            <textarea
              className="input mb-sm"
              rows={3}
              value={revisionFor.notes}
              onChange={(e) => setRevisionFor({ ...revisionFor, notes: e.target.value })}
              placeholder="Describe what needs to be adjusted..."
            />
            <div className="flex justify-end gap-xs">
              <button className="btn btn-outline btn-sm" onClick={() => setRevisionFor(null)}>Cancel</button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleRequestRevision}
                disabled={acting || !revisionFor.notes.trim()}
              >
                {acting ? <Loader2 className="w-sm h-sm animate-spin" /> : null}
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
