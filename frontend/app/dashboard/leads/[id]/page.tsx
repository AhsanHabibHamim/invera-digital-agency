'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import * as leadsService from '@/services/leads';
import type { Lead } from '@/types';
import {
  ArrowLeft, Mail, Phone, Globe,
  MessageSquare, Paperclip, Tag, Clock, User, DollarSign, Target, Calendar,
  Edit3, Trash2, UserPlus, Loader2, Plus, Send, FileText, ExternalLink, Link,
} from 'lucide-react';

const statusBadge: Record<string, string> = {
  new: 'badge-info', contacted: 'badge-primary', qualified: 'badge-accent',
  proposal: 'badge-warning', negotiation: 'badge', won: 'badge-success', lost: 'badge-destructive',
};

const statusOptions = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];
const priorityOptions = ['low', 'medium', 'high', 'urgent'];

export default function LeadDetailPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const { id } = use(paramsPromise);
  const router = useRouter();

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Lead>>({});
  const [saving, setSaving] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [commType, setCommType] = useState<'call' | 'email' | 'meeting' | 'note'>('note');
  const [commContent, setCommContent] = useState('');
  const [addingComm, setAddingComm] = useState(false);
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await leadsService.getLead(id);
        if (res.success) setLead(res.data);
      } catch {
        // handle
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleUpdate = async () => {
    setSaving(true);
    try {
      const res = await leadsService.updateLead(id, editData);
      if (res.success) setLead(res.data);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this lead?')) return;
    await leadsService.deleteLead(id);
    router.push('/dashboard/leads');
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setSendingReply(true);
    try {
      const res = await leadsService.replyToLead(id, { message: replyText });
      if (res.success) setLead(res.data);
      setReplyText('');
    } finally {
      setSendingReply(false);
    }
  };

  const handleAddCommunication = async () => {
    if (!commContent.trim()) return;
    setAddingComm(true);
    try {
      const res = await leadsService.addLeadCommunication(id, { type: commType, content: commContent });
      if (res.success) setLead(res.data);
      setCommContent('');
    } finally {
      setAddingComm(false);
    }
  };

  const handleConvert = async () => {
    const title = prompt('Enter project title:');
    if (!title) return;
    setConverting(true);
    try {
      await leadsService.convertLead(id);
      router.push('/dashboard/projects');
    } finally {
      setConverting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-8 w-48 rounded" />
        <div className="skeleton h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="empty-state">
        <FileText className="empty-state-icon" />
        <p className="empty-state-title">Lead not found</p>
        <p className="empty-state-desc">This lead does not exist or has been deleted.</p>
        <button className="btn btn-outline btn-md mt-4" onClick={() => router.push('/dashboard/leads')}>
          <ArrowLeft className="w-4 h-4" /> Back to Leads
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button className="btn btn-ghost btn-icon" onClick={() => router.push('/dashboard/leads')}>
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{lead.contactName}</h1>
            <p className="text-sm text-neutral-500">{lead.leadId}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-outline btn-sm" onClick={() => { setEditing(!editing); setEditData(lead); }}>
            <Edit3 className="w-4 h-4" /> Edit
          </button>
          <button className="btn btn-primary btn-sm" disabled={converting} onClick={handleConvert}>
            {converting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            Convert to Client
          </button>
          <button className="btn btn-ghost btn-icon text-destructive" onClick={handleDelete}>
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card-dashboard">
            <h3 className="dashboard-section-title">Contact Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-foreground/40" />
                <a href={`mailto:${lead.email}`} className="text-primary hover:underline">{lead.email}</a>
              </div>
              {lead.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-foreground/40" />
                  <a href={`tel:${lead.phone}`} className="hover:underline">{lead.phone}</a>
                </div>
              )}
              {lead.company && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-foreground/40" />
                  <span>{lead.company}</span>
                </div>
              )}
              {lead.website && (
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="w-4 h-4 text-foreground/40" />
                  <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{lead.website}</a>
                </div>
              )}
            </div>
            {(lead.facebook || lead.instagram || lead.linkedin || lead.twitter || lead.youtube) && (
              <div className="flex flex-wrap gap-2 mt-4">
                {lead.facebook && <a href={lead.facebook} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm"><Globe className="w-4 h-4" /><span className="text-xs">FB</span></a>}
                {lead.instagram && <a href={lead.instagram} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm"><Globe className="w-4 h-4" /><span className="text-xs">IG</span></a>}
                {lead.linkedin && <a href={lead.linkedin} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm"><Link className="w-4 h-4" /><span className="text-xs">IN</span></a>}
                {lead.twitter && <a href={lead.twitter} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm"><Globe className="w-4 h-4" /><span className="text-xs">X</span></a>}
                {lead.youtube && <a href={lead.youtube} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm"><Globe className="w-4 h-4" /><span className="text-xs">YT</span></a>}
              </div>
            )}
          </div>

          {editing && (
            <div className="card-dashboard">
              <h3 className="dashboard-section-title">Edit Lead</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="col-span-2">
                  <label className="form-label">Contact Name</label>
                  <input className="input" value={editData.contactName ?? ''} onChange={(e) => setEditData({ ...editData, contactName: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Email</label>
                  <input className="input" value={editData.email ?? ''} onChange={(e) => setEditData({ ...editData, email: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Phone</label>
                  <input className="input" value={editData.phone ?? ''} onChange={(e) => setEditData({ ...editData, phone: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Company</label>
                  <input className="input" value={editData.company ?? ''} onChange={(e) => setEditData({ ...editData, company: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Website</label>
                  <input className="input" value={editData.website ?? ''} onChange={(e) => setEditData({ ...editData, website: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Status</label>
                  <select className="input" value={editData.status ?? lead.status} onChange={(e) => setEditData({ ...editData, status: e.target.value })}>
                    {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Priority</label>
                  <select className="input" value={editData.priority ?? lead.priority} onChange={(e) => setEditData({ ...editData, priority: e.target.value })}>
                    {priorityOptions.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button className="btn btn-outline btn-sm" onClick={() => setEditing(false)}>Cancel</button>
                <button className="btn btn-primary btn-sm" disabled={saving} onClick={handleUpdate}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Save Changes
                </button>
              </div>
            </div>
          )}

          <div className="card-dashboard">
            <h3 className="dashboard-section-title">Communication History</h3>
            {(!lead.communicationHistory || lead.communicationHistory.length === 0) ? (
              <div className="empty-state !py-8">
                <Clock className="empty-state-icon" />
                <p className="empty-state-desc">No communication history yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lead.communicationHistory.map((c, i) => (
                  <div key={i} className="flex gap-3 text-sm border-b border-border pb-3 last:border-0">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      {c.type === 'call' ? <Phone className="w-4 h-4 text-primary" /> :
                       c.type === 'email' ? <Mail className="w-4 h-4 text-primary" /> :
                       c.type === 'meeting' ? <User className="w-4 h-4 text-primary" /> :
                       <MessageSquare className="w-4 h-4 text-primary" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="badge badge-primary">{c.type}</span>
                        <span className="text-xs text-foreground/40">{new Date(c.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="mt-1 text-foreground/80">{c.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4">
              <div className="flex gap-2 mb-2">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <select className="input w-auto text-sm" value={commType} onChange={(e) => setCommType(e.target.value as any)}>
                  <option value="note">Note</option>
                  <option value="call">Call</option>
                  <option value="email">Email</option>
                  <option value="meeting">Meeting</option>
                </select>
              </div>
              <div className="flex gap-2">
                <textarea
                  className="input flex-1"
                  rows={2}
                  placeholder="Add communication entry..."
                  value={commContent}
                  onChange={(e) => setCommContent(e.target.value)}
                />
                <button className="btn btn-primary btn-sm self-end" disabled={addingComm || !commContent.trim()} onClick={handleAddCommunication}>
                  {addingComm ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="card-dashboard">
            <h3 className="dashboard-section-title flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> Replies
            </h3>
            {(!lead.replies || lead.replies.length === 0) ? (
              <div className="empty-state !py-8">
                <MessageSquare className="empty-state-icon" />
                <p className="empty-state-desc">No replies yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lead.replies.map((r, i) => (
                  <div key={i} className="flex gap-3 text-sm border-b border-border pb-3 last:border-0">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                      <MessageSquare className="w-4 h-4 text-accent" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-foreground/40">{typeof r.repliedBy === 'string' ? r.repliedBy : r.repliedBy?.name}</span>
                        <span className="text-xs text-foreground/40">{new Date(r.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="mt-1 text-foreground/80">{r.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2 mt-4">
              <textarea
                className="input flex-1"
                rows={2}
                placeholder="Write a reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
              />
              <button className="btn btn-primary btn-sm self-end" disabled={sendingReply || !replyText.trim()} onClick={handleReply}>
                {sendingReply ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="card-dashboard">
            <h3 className="dashboard-section-title flex items-center gap-2">
              <Paperclip className="w-4 h-4" /> File Attachments
            </h3>
            {(!lead.files || lead.files.length === 0) ? (
              <div className="empty-state !py-8">
                <Paperclip className="empty-state-icon" />
                <p className="empty-state-desc">No files attached.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {lead.files.map((f, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-surface text-sm">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-foreground/40" />
                      <span>{f.fileName}</span>
                    </div>
                    <a href={f.fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-icon">
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card-dashboard">
            <h3 className="dashboard-section-title">Status</h3>
            <div className="flex flex-wrap gap-2">
              <span className={`badge ${statusBadge[lead.status] || 'badge'}`}>{lead.status}</span>
              <span className={`badge ${
                lead.priority === 'urgent' ? 'badge-destructive' :
                lead.priority === 'high' ? 'badge-warning' :
                lead.priority === 'medium' ? 'badge-info' : ''
              }`}>{lead.priority}</span>
            </div>
          </div>

          <div className="card-dashboard">
            <h3 className="dashboard-section-title">Deal Info</h3>
            <div className="space-y-3 text-sm">
              {lead.estimatedDealValue != null && (
                <div className="flex items-center justify-between">
                  <span className="text-foreground/60 flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" /> Value</span>
                  <span className="font-semibold">{lead.currency || '$'}{lead.estimatedDealValue.toLocaleString()}</span>
                </div>
              )}
              {lead.probability != null && (
                <div className="flex items-center justify-between">
                  <span className="text-foreground/60 flex items-center gap-1"><Target className="w-3.5 h-3.5" /> Probability</span>
                  <span className="font-semibold">{lead.probability}%</span>
                </div>
              )}
              {lead.expectedCloseDate && (
                <div className="flex items-center justify-between">
                  <span className="text-foreground/60 flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Expected Close</span>
                  <span className="font-semibold">{new Date(lead.expectedCloseDate).toLocaleDateString()}</span>
                </div>
              )}
              {lead.source && (
                <div className="flex items-center justify-between">
                  <span className="text-foreground/60">Source</span>
                  <span>{lead.source}</span>
                </div>
              )}
            </div>
          </div>

          {lead.tags && lead.tags.length > 0 && (
            <div className="card-dashboard">
              <h3 className="dashboard-section-title flex items-center gap-1"><Tag className="w-4 h-4" /> Tags</h3>
              <div className="flex flex-wrap gap-1.5">
                {lead.tags.map((t, i) => <span key={i} className="badge">{t}</span>)}
              </div>
            </div>
          )}

          <div className="card-dashboard">
            <h3 className="dashboard-section-title">Lead Score</h3>
            <div className="text-center">
              <span className="text-3xl font-bold text-primary">{lead.leadScore ?? '—'}</span>
              <p className="text-xs text-foreground/40 mt-1">Lead Score</p>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-foreground/60">Decision Maker</span>
                <span>{lead.decisionMaker ? 'Yes' : 'No'}</span>
              </div>
              {lead.country && <div className="flex justify-between"><span className="text-foreground/60">Country</span><span>{lead.country}</span></div>}
              {lead.industry && <div className="flex justify-between"><span className="text-foreground/60">Industry</span><span>{lead.industry}</span></div>}
            </div>
          </div>

          <div className="card-dashboard">
            <h3 className="dashboard-section-title">Activity</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-foreground/60">Created</span>
                <span>{new Date(lead.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground/60">Last Contact</span>
                <span>{lead.lastContactDate ? new Date(lead.lastContactDate).toLocaleDateString() : '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground/60">Next Follow-up</span>
                <span>{lead.nextFollowUp ? new Date(lead.nextFollowUp).toLocaleDateString() : '—'}</span>
              </div>
              {lead.assignedTo && (
                <div className="flex justify-between">
                  <span className="text-foreground/60">Assigned To</span>
                  <span>{typeof lead.assignedTo === 'string' ? lead.assignedTo : lead.assignedTo?.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
