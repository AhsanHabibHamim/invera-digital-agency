'use client';

import { useState, useEffect, useCallback } from 'react';
import DataTable, { type Column } from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import * as reviewsService from '@/services/reviews';
import type { Review } from '@/types';
import { Star, CheckCircle } from 'lucide-react';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvedFilter, setApprovedFilter] = useState('');

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (approvedFilter) params.approved = approvedFilter;
      const res = await reviewsService.getAdminReviews(params);
      if (res.success) {
        setReviews(Array.isArray(res.data) ? res.data : []);
      }
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, [approvedFilter]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]); // eslint-disable-line react-hooks/set-state-in-effect

  const handleApprove = async (r: Review) => {
    await reviewsService.approveReview(r._id);
    fetchReviews();
  };

  const StarRating = ({ rating }: { rating: number }) => (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-foreground/20'}`} />
      ))}
    </span>
  );

  const columns: Column<Review>[] = [
    {
      key: 'clientId',
      label: 'Client',
      render: (r) => (
        <span className="font-medium text-foreground">
          {typeof r.clientId === 'string' ? r.clientId : r.clientId?.name ?? '—'}
        </span>
      ),
    },
    {
      key: 'projectId',
      label: 'Project',
      render: (r) => (
        <span className="text-sm text-foreground/70">
          {typeof r.projectId === 'string' ? r.projectId : r.projectId?.title ?? '—'}
        </span>
      ),
    },
    {
      key: 'rating',
      label: 'Rating',
      render: (r) => <StarRating rating={r.rating} />,
    },
    {
      key: 'comment',
      label: 'Comment',
      render: (r) => (
        <span className="text-sm text-foreground/70 truncate max-w-[200px] block">
          {r.comment || <span className="text-foreground/40">—</span>}
        </span>
      ),
    },
    {
      key: 'approved',
      label: 'Approved',
      render: (r) => (
        <Badge variant={r.approved ? 'success' : 'warning'}>
          {r.approved ? 'Approved' : 'Pending'}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (r) => new Date(r.createdAt).toLocaleDateString(),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <div className="flex items-center gap-2">
          {!r.approved && (
            <button
              className="btn btn-ghost btn-sm text-success"
              onClick={(e) => { e.stopPropagation(); handleApprove(r); }}
              title="Approve"
            >
              <CheckCircle className="w-4 h-4" /> Approve
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reviews</h1>
        <p className="mt-1 text-sm text-neutral-500">Approve and manage client reviews</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          className="input w-auto"
          value={approvedFilter}
          onChange={(e) => setApprovedFilter(e.target.value)}
        >
          <option value="">All Reviews</option>
          <option value="true">Approved</option>
          <option value="false">Pending</option>
        </select>
      </div>

      <DataTable<Review>
        columns={columns}
        data={reviews}
        total={reviews.length}
        page={1}
        totalPages={1}
        isLoading={loading}
        emptyMessage="No reviews found"
        keyExtractor={(r) => r._id}
      />
    </div>
  );
}
