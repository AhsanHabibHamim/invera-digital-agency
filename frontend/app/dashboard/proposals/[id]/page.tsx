'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getProposal, reviewProposal, approveProposal, deleteProposal } from '@/services/proposals';
import type { Proposal } from '@/types';
import { ArrowLeft, CheckCircle, XCircle, FileEdit, Trash2, ExternalLink } from 'lucide-react';

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    submitted: 'badge-info',
    under_review: 'badge-warning',
    quoted: 'badge-primary',
    accepted: 'badge-success',
    declined: 'badge-destructive',
  };
  return `badge ${map[status] || 'badge'}`;
};

export default function ProposalDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const [showConfirm, setShowConfirm] = useState<'approve' | 'decline' | 'delete' | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await getProposal(id);
        setProposal(res.data);
        setAdminNotes((res.data?.adminNotes || '') as string);
      } catch {
        setError('Failed to load proposal');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id]);

  if (isLoading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner" />
        <p className="text-foreground/50 text-sm">Loading proposal...</p>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="empty-state">
        <FileEdit className="empty-state-icon" />
        <p className="empty-state-title">{error || 'Proposal not found'}</p>
        <button className="btn btn-outline btn-sm" onClick={() => router.back()}>Go Back</button>
      </div>
    );
  }

  const handleReview = async (status: 'under_review' | 'declined') => {
    setActionLoading(status);
    try {
      const res = await reviewProposal(id, { adminNotes, status });
      setProposal(res.data);
      setShowReviewForm(false);
    } catch {
      setError('Failed to update proposal');
    } finally {
      setActionLoading('');
    }
  };

  const handleApprove = async () => {
    setActionLoading('approve');
    setShowConfirm(null);
    try {
      const res = await approveProposal(id);
      setProposal(res.data);
    } catch {
      setError('Failed to approve proposal');
    } finally {
      setActionLoading('');
    }
  };

  const handleDelete = async () => {
    setActionLoading('delete');
    try {
      await deleteProposal(id);
      router.push('/dashboard/proposals');
    } catch {
      setError('Failed to delete proposal');
    } finally {
      setActionLoading('');
    }
  };

  const needsAdminAction = proposal.status === 'submitted';
  const canApprove = proposal.status === 'quoted' || proposal.status === 'under_review';

  return (
    <div>
      <button className="btn btn-ghost btn-sm mb-4" onClick={() => router.back()}>
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {error && <div className="form-alert form-alert-error mb-4">{error}</div>}

      <div className="card-dashboard mb-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold">{proposal.title}</h1>
              <span className={statusBadge(proposal.status)}>{proposal.status.replace('_', ' ')}</span>
            </div>
            <p className="text-foreground/60 text-sm">
              From {typeof proposal.clientId === 'string' ? proposal.clientId : proposal.clientId?.name ?? '—'} · {new Date(proposal.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div className="flex gap-2">
            {needsAdminAction && (
              <button className="btn btn-primary btn-sm" onClick={() => setShowReviewForm(!showReviewForm)}>
                <CheckCircle className="w-4 h-4" /> Review
              </button>
            )}
            {canApprove && (
              <button className="btn btn-primary btn-sm" onClick={() => setShowConfirm('approve')}
                disabled={actionLoading === 'approve'}>
                <CheckCircle className="w-4 h-4" /> {actionLoading === 'approve' ? 'Approving...' : 'Approve & Create Project'}
              </button>
            )}
            <button className="btn btn-ghost btn-icon text-destructive" onClick={() => setShowConfirm('delete')}
              disabled={actionLoading === 'delete'}>
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {showReviewForm && (
          <div className="mb-6 p-4 rounded-lg border border-border bg-surface">
            <h3 className="font-semibold mb-3">Admin Review</h3>
            <label className="form-label">Admin Notes</label>
            <textarea className="input mb-3" value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Add internal notes..." rows={3} />
            <div className="flex gap-2">
              <button className="btn btn-primary btn-sm" onClick={() => handleReview('under_review')}
                disabled={actionLoading === 'under_review'}>
                <CheckCircle className="w-3 h-3" /> Move to Review
              </button>
              <button className="btn btn-destructive btn-sm"
                onClick={() => setShowConfirm('decline')}
                disabled={actionLoading === 'declined'}>
                <XCircle className="w-3 h-3" /> Decline
              </button>
              <button className="btn btn-outline btn-sm" onClick={() => setShowReviewForm(false)}>Cancel</button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <p className="form-label">Service Category</p>
            <p className="font-medium">{proposal.serviceCategory || '—'}</p>
          </div>
          <div>
            <p className="form-label">Budget Range</p>
            <p className="font-medium">{proposal.budgetRange || '—'}</p>
          </div>
          <div>
            <p className="form-label">Desired Timeline</p>
            <p className="font-medium">{proposal.desiredTimeline || '—'}</p>
          </div>
          <div>
            <p className="form-label">Status</p>
            <span className={statusBadge(proposal.status)}>{proposal.status.replace('_', ' ')}</span>
          </div>
        </div>

        <div className="mb-6">
          <p className="form-label">Description</p>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{proposal.description || 'No description provided'}</p>
        </div>

        {proposal.attachments && proposal.attachments.length > 0 && (
          <div className="mb-6">
            <p className="form-label">Attachments</p>
            <div className="flex flex-wrap gap-2">
              {proposal.attachments.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                  className="btn btn-outline btn-sm">
                  <ExternalLink className="w-3 h-3" /> Attachment {i + 1}
                </a>
              ))}
            </div>
          </div>
        )}

        {proposal.quoteId && (
          <div className="mb-6 p-3 rounded-lg bg-surface border border-border">
            <p className="form-label">Quote</p>
            <p className="text-sm">Referenced quote: {typeof proposal.quoteId === 'string' ? proposal.quoteId : proposal.quoteId?._id ?? '—'}</p>
          </div>
        )}
      </div>

      {proposal.adminNotes && (
        <div className="card-dashboard mb-6">
          <p className="form-label">Admin Notes</p>
          <p className="text-sm whitespace-pre-wrap">{proposal.adminNotes}</p>
        </div>
      )}

      {proposal.clientResponseNotes && (
        <div className="card-dashboard mb-6">
          <p className="form-label">Client Response</p>
          <p className="text-sm whitespace-pre-wrap">{proposal.clientResponseNotes}</p>
          {proposal.declineReason && (
            <div className="mt-2 p-2 rounded bg-destructive/10 border border-destructive/20">
              <p className="text-xs font-semibold text-destructive">Decline Reason</p>
              <p className="text-sm">{proposal.declineReason}</p>
            </div>
          )}
        </div>
      )}

      {showConfirm === 'approve' && (
        <ConfirmDialog title="Approve Proposal" message="This will create a project from this proposal. Continue?"
          loading={actionLoading === 'approve'} onConfirm={handleApprove}
          onCancel={() => setShowConfirm(null)} />
      )}
      {showConfirm === 'decline' && (
        <ConfirmDialog title="Decline Proposal" message="Are you sure you want to decline this proposal?"
          loading={actionLoading === 'declined'} onConfirm={() => handleReview('declined')}
          onCancel={() => setShowConfirm(null)} />
      )}
      {showConfirm === 'delete' && (
        <ConfirmDialog title="Delete Proposal" message="This action cannot be undone."
          loading={actionLoading === 'delete'} onConfirm={handleDelete}
          onCancel={() => setShowConfirm(null)} />
      )}
    </div>
  );
}

function ConfirmDialog({ title, message, loading, onConfirm, onCancel }: {
  title: string; message: string; loading: boolean; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content p-6 max-w-sm" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold mb-2">{title}</h3>
        <p className="text-foreground/60 text-sm mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button className="btn btn-outline btn-sm" onClick={onCancel} disabled={loading}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={onConfirm} disabled={loading}>
            {loading ? 'Processing...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
