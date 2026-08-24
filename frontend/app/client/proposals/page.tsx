'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { getProposals } from '@/services/proposals';
import type { Proposal } from '@/types';
import { FileEdit, Plus } from 'lucide-react';

const statusBadge: Record<string, string> = {
  submitted: 'badge-info',
  under_review: 'badge-warning',
  quoted: 'badge-primary',
  accepted: 'badge-success',
  declined: 'badge-destructive',
};

const statusHint: Record<string, string> = {
  submitted: 'Submitted — our team will review it shortly.',
  under_review: 'Under review — our team is evaluating your proposal.',
  quoted: 'Quoted — review the quote and accept to get started.',
  accepted: 'Accepted — a project has been created for you.',
  declined: 'Declined — we are unable to take this on right now.',
};

export default function ClientProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProposals = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getProposals();
      if (res.success && res.data) {
        setProposals(res.data.proposals ?? (Array.isArray(res.data) ? (res.data as unknown as Proposal[]) : []));
      } else if (!res.success) {
        setError(res.message || 'Failed to load proposals');
      }
    } catch {
      setError('Failed to load proposals');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProposals(); }, [fetchProposals]); // eslint-disable-line react-hooks/set-state-in-effect

  return (
    <div className="flex flex-col gap-md">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h3 font-bold text-foreground">My Proposals</h1>
          <p className="mt-4xs text-body-small text-foreground/50">Track the status of your project proposals</p>
        </div>
        <Link href="/client/proposals/new" className="btn btn-primary btn-md">
          <Plus className="w-sm h-sm" /> New Proposal
        </Link>
      </div>

      {error && <div className="form-alert form-alert-error">{error}</div>}

      {loading ? (
        <div className="grid grid-cols-1 gap-md lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card-dashboard">
              <div className="skeleton h-5 w-2/3 mb-xs" />
              <div className="skeleton h-4 w-full mb-xs" />
              <div className="skeleton h-8 w-24" />
            </div>
          ))}
        </div>
      ) : proposals.length === 0 ? (
        <div className="empty-state">
          <FileEdit className="empty-state-icon" />
          <p className="empty-state-title">No proposals yet</p>
          <p className="empty-state-desc">Submit a proposal and our team will get back to you.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-md lg:grid-cols-2">
          {proposals.map((proposal) => (
            <Link
              key={proposal._id}
              href={`/client/proposals/${proposal._id}`}
              className="card-dashboard flex flex-col gap-sm transition-transform hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between gap-xs">
                <h3 className="text-small font-semibold text-foreground leading-snug">{proposal.title}</h3>
                <span className={`badge shrink-0 ${statusBadge[proposal.status] ?? 'badge'}`}>
                  {proposal.status.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-body-small text-foreground/60 line-clamp-2">{proposal.description}</p>
              <div className="mt-auto flex flex-col gap-3xs border-t border-border pt-xs">
                <p className="text-caption text-foreground/50">{statusHint[proposal.status] ?? ''}</p>
                <div className="flex items-center justify-between">
                  {proposal.budgetRange && (
                    <span className="text-caption text-foreground/60">Budget: {proposal.budgetRange}</span>
                  )}
                  <span className="text-caption text-foreground/40">
                    {new Date(proposal.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
