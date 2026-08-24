'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getProposal, acceptProposalQuote, requestProposalChanges,
} from '@/services/proposals';
import type { Proposal } from '@/types';
import {
  ArrowLeft, FileEdit, Loader2, CheckCircle2, MessageSquareWarning,
} from 'lucide-react';

const statusBadge: Record<string, string> = {
  submitted: 'badge-info',
  under_review: 'badge-warning',
  quoted: 'badge-primary',
  accepted: 'badge-success',
  declined: 'badge-destructive',
};

export default function ProposalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [acting, setActing] = useState(false);
  const [showChanges, setShowChanges] = useState(false);
  const [changesNotes, setChangesNotes] = useState('');

  const fetchProposal = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getProposal(id);
      if (res.success) setProposal(res.data);
      else setError(res.message || 'Failed to load proposal');
    } catch {
      setError('Failed to load proposal');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchProposal(); }, [fetchProposal]); // eslint-disable-line react-hooks/set-state-in-effect

  const handleAcceptQuote = async () => {
    if (!proposal) return;
    setActing(true);
    setError('');
    try {
      const res = await acceptProposalQuote(proposal._id);
      if (res.success) setProposal(res.data);
      else setError(res.message || 'Failed to accept quote');
    } catch {
      setError('Failed to accept quote');
    } finally {
      setActing(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!proposal || !changesNotes.trim()) return;
    setActing(true);
    setError('');
    try {
      const res = await requestProposalChanges(proposal._id, { clientResponseNotes: changesNotes.trim() });
      if (res.success) {
        setProposal(res.data);
        setShowChanges(false);
        setChangesNotes('');
      } else {
        setError(res.message || 'Failed to request changes');
      }
    } catch {
      setError('Failed to request changes');
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

  if (error && !proposal) {
    return (
      <div className="empty-state">
        <FileEdit className="empty-state-icon" />
        <p className="empty-state-title">{error}</p>
        <button className="btn btn-outline btn-md mt-sm" onClick={() => router.back()}>Go Back</button>
      </div>
    );
  }

  if (!proposal) return null;

  return (
    <div className="flex flex-col gap-md">
      <div className="flex items-center gap-xs">
        <Link href="/client/proposals" className="icon-btn" aria-label="Back to proposals">
          <ArrowLeft className="w-sm h-sm" />
        </Link>
        <div className="flex items-center gap-xs">
          <h1 className="text-h3 font-bold text-foreground">{proposal.title}</h1>
          <span className={`badge ${statusBadge[proposal.status] ?? 'badge'}`}>
            {proposal.status.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      {error && <div className="form-alert form-alert-error">{error}</div>}

      <div className="card-dashboard flex flex-col gap-sm">
        <p className="text-body-small text-foreground/70 whitespace-pre-wrap">{proposal.description}</p>

        <div className="grid grid-cols-2 gap-xs sm:grid-cols-4 border-t border-border pt-sm">
          {proposal.serviceCategory && (
            <div>
              <p className="text-caption text-foreground/50">Category</p>
              <p className="text-small font-medium text-foreground">{proposal.serviceCategory}</p>
            </div>
          )}
          {proposal.budgetRange && (
            <div>
              <p className="text-caption text-foreground/50">Budget</p>
              <p className="text-small font-medium text-foreground">{proposal.budgetRange}</p>
            </div>
          )}
          {proposal.desiredTimeline && (
            <div>
              <p className="text-caption text-foreground/50">Timeline</p>
              <p className="text-small font-medium text-foreground">{proposal.desiredTimeline}</p>
            </div>
          )}
          <div>
            <p className="text-caption text-foreground/50">Submitted</p>
            <p className="text-small font-medium text-foreground">
              {new Date(proposal.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {proposal.adminNotes && (
          <div className="p-xs rounded-lg bg-surface border border-border">
            <p className="text-caption font-semibold text-foreground/50 mb-2xs">Team Notes</p>
            <p className="text-body-small text-foreground/80">{proposal.adminNotes}</p>
          </div>
        )}

        {proposal.status === 'quoted' && (
          <div className="flex flex-col gap-sm border-t border-border pt-sm sm:flex-row">
            <button
              className="btn btn-primary btn-md"
              onClick={handleAcceptQuote}
              disabled={acting}
            >
              {acting ? <Loader2 className="w-sm h-sm animate-spin" /> : <CheckCircle2 className="w-sm h-sm" />}
              Accept Quote &amp; Start Project
            </button>
            <button
              className="btn btn-outline btn-md"
              onClick={() => setShowChanges(true)}
              disabled={acting}
            >
              <MessageSquareWarning className="w-sm h-sm" />
              Request Changes
            </button>
          </div>
        )}

        {proposal.status === 'accepted' && (
          <p className="text-body-small text-success border-t border-border pt-sm">
            Great news — your project has been created. View it in{" "}
            <Link href="/client/projects" className="font-semibold underline">My Projects</Link>.
          </p>
        )}

        {showChanges && (
          <div className="border-t border-border pt-sm">
            <label className="form-label">Describe the changes you would like</label>
            <textarea
              className="input mb-xs"
              rows={3}
              value={changesNotes}
              onChange={(e) => setChangesNotes(e.target.value)}
              placeholder="Tell us what you'd like adjusted..."
            />
            <div className="flex justify-end gap-xs">
              <button className="btn btn-outline btn-sm" onClick={() => setShowChanges(false)}>Cancel</button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleRequestChanges}
                disabled={acting || !changesNotes.trim()}
              >
                {acting ? <Loader2 className="w-sm h-sm animate-spin" /> : null}
                Submit Request
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
