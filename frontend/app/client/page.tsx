'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { CardSkeleton } from '@/components/Skeleton';
import DashboardStats from '@/components/dashboard/DashboardStats';
import * as projectsService from '@/services/projects';
import * as invoicesService from '@/services/invoices';
import * as proposalsService from '@/services/proposals';
import * as supportService from '@/services/support';
import type { Project, Invoice, Proposal, SupportTicket } from '@/types';
import {
  Briefcase, Receipt, CheckSquare, LifeBuoy, ArrowRight, FileEdit,
} from 'lucide-react';

const projectStatusBadge: Record<string, string> = {
  requested: 'badge-info',
  quoted: 'badge-primary',
  in_progress: 'badge-accent',
  in_review: 'badge-warning',
  completed: 'badge-success',
  closed: 'badge',
};

const invoiceStatusBadge: Record<string, string> = {
  draft: 'badge-info',
  sent: 'badge-primary',
  paid: 'badge-success',
  overdue: 'badge-destructive',
  cancelled: 'badge-warning',
};

const proposalStatusBadge: Record<string, string> = {
  submitted: 'badge-info',
  under_review: 'badge-warning',
  quoted: 'badge-primary',
  accepted: 'badge-success',
  declined: 'badge-destructive',
};

export default function ClientDashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [projectsRes, invoicesRes, proposalsRes, ticketsRes] = await Promise.all([
        projectsService.getProjects({ limit: '5' }),
        invoicesService.getInvoices(),
        proposalsService.getProposals(),
        supportService.getTickets({ limit: '5' }),
      ]);

      if (projectsRes.success) {
        setProjects(projectsRes.data.projects ?? []);
      }
      if (invoicesRes.success) {
        setInvoices(invoicesRes.data.invoices ?? (Array.isArray(invoicesRes.data) ? invoicesRes.data : []));
      }
      if (proposalsRes.success) {
        setProposals(proposalsRes.data.proposals ?? (Array.isArray(proposalsRes.data) ? proposalsRes.data : []));
      }
      if (ticketsRes.success) {
        setTickets(ticketsRes.data.tickets ?? []);
      }
      if (!projectsRes.success && !invoicesRes.success) {
        setError(projectsRes.message || 'Failed to load your dashboard');
      }
    } catch {
      setError('Failed to load your dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]); // eslint-disable-line react-hooks/set-state-in-effect

  if (loading) {
    return (
      <div className="flex flex-col gap-md">
        <div>
          <h1 className="text-h3 font-bold text-foreground">Client Dashboard</h1>
          <p className="mt-4xs text-body-small text-foreground/50">Overview of your projects and account</p>
        </div>
        <CardSkeleton count={4} />
      </div>
    );
  }

  const activeProjects = projects.filter((p) => ['in_progress', 'in_review', 'requested', 'quoted'].includes(p.status)).length;
  const openInvoices = invoices.filter((i) => ['sent', 'overdue', 'draft'].includes(i.status)).length;
  const openTickets = tickets.filter((t) => !['resolved', 'closed'].includes(t.status)).length;
  const activeProposals = proposals.filter((p) => ['submitted', 'under_review', 'quoted'].includes(p.status)).length;

  const statCards = [
    { label: 'Active Projects', value: activeProjects, icon: <Briefcase size={20} /> },
    { label: 'Open Proposals', value: activeProposals, icon: <FileEdit size={20} /> },
    { label: 'Open Invoices', value: openInvoices, icon: <Receipt size={20} /> },
    { label: 'Open Tickets', value: openTickets, icon: <LifeBuoy size={20} /> },
  ];

  return (
    <div className="flex flex-col gap-md">
      <div>
        <h1 className="text-h3 font-bold text-foreground">Client Dashboard</h1>
        <p className="mt-4xs text-body-small text-foreground/50">Overview of your projects and account</p>
      </div>

      {error && <div className="form-alert form-alert-error">{error}</div>}

      <DashboardStats stats={statCards} />

      <div className="grid grid-cols-1 gap-md lg:grid-cols-2">
        <div className="card-dashboard">
          <div className="flex items-center justify-between mb-sm">
            <h3 className="dashboard-section-title m-0 p-0 border-none">Recent Projects</h3>
            <Link href="/client/projects" className="btn btn-ghost btn-sm">
              View All <ArrowRight className="w-3xs h-3xs ml-3xs" />
            </Link>
          </div>
          {projects.length === 0 ? (
            <div className="empty-state py-lg">
              <Briefcase className="empty-state-icon" />
              <p className="empty-state-title">No projects yet</p>
              <p className="empty-state-desc">Once your proposal is approved, your project will appear here.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-xs">
              {projects.map((project) => (
                <Link
                  key={project._id}
                  href={`/client/projects/${project._id}`}
                  className="flex items-center justify-between rounded-lg p-xs transition-colors hover:bg-surface"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-small font-medium text-foreground truncate">{project.title}</p>
                    <div className="flex items-center gap-2xs mt-4xs">
                      <span className={`badge ${projectStatusBadge[project.status] ?? 'badge'}`}>
                        {project.status.replace(/_/g, ' ')}
                      </span>
                      <span className="text-caption text-foreground/50">{project.progressPercent}% complete</span>
                    </div>
                  </div>
                  <div className="progress-bar w-20 ml-sm">
                    <div className="progress-bar-fill" style={{ width: `${project.progressPercent}%` }} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-md">
          <div className="card-dashboard">
            <div className="flex items-center justify-between mb-sm">
              <h3 className="dashboard-section-title m-0 p-0 border-none">Recent Invoices</h3>
              <Link href="/client/invoices" className="btn btn-ghost btn-sm">
                View All <ArrowRight className="w-3xs h-3xs ml-3xs" />
              </Link>
            </div>
            {invoices.length === 0 ? (
              <div className="empty-state py-lg">
                <Receipt className="empty-state-icon" />
                <p className="empty-state-title">No invoices yet</p>
                <p className="empty-state-desc">Your invoices will appear here once generated.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-xs">
                {invoices.slice(0, 5).map((invoice) => (
                  <Link
                    key={invoice._id}
                    href={`/client/invoices/${invoice._id}`}
                    className="flex items-center justify-between rounded-lg p-xs transition-colors hover:bg-surface"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-small font-medium text-foreground">{invoice.invoiceNumber}</p>
                      <p className="text-caption text-foreground/50 mt-4xs">
                        {invoice.currency ?? 'USD'} {invoice.total.toLocaleString()}
                      </p>
                    </div>
                    <span className={`badge ${invoiceStatusBadge[invoice.status] ?? 'badge'}`}>
                      {invoice.status}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="card-dashboard">
            <div className="flex items-center justify-between mb-sm">
              <h3 className="dashboard-section-title m-0 p-0 border-none">Recent Proposals</h3>
              <Link href="/client/proposals" className="btn btn-ghost btn-sm">
                View All <ArrowRight className="w-3xs h-3xs ml-3xs" />
              </Link>
            </div>
            {proposals.length === 0 ? (
              <div className="empty-state py-lg">
                <CheckSquare className="empty-state-icon" />
                <p className="empty-state-title">No proposals yet</p>
                <p className="empty-state-desc">Submit a project proposal to get started.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-xs">
                {proposals.slice(0, 5).map((proposal) => (
                  <Link
                    key={proposal._id}
                    href={`/client/proposals/${proposal._id}`}
                    className="flex items-center justify-between rounded-lg p-xs transition-colors hover:bg-surface"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-small font-medium text-foreground truncate">{proposal.title}</p>
                      <p className="text-caption text-foreground/50 mt-4xs">
                        {new Date(proposal.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`badge ${proposalStatusBadge[proposal.status] ?? 'badge'}`}>
                      {proposal.status.replace(/_/g, ' ')}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
