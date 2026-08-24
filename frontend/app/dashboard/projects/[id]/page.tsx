'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import * as projectsService from '@/services/projects';
import { useClients, useServiceOptions, useTeamMembers } from '@/hooks/useEntityOptions';
import { getErrorMessage, isValidObjectId } from '@/lib/utils';
import type { Project, Milestone } from '@/types';
import {
  ArrowLeft, Edit3, Archive, Users, CheckCircle, Circle, Plus, X,
  Loader2, Calendar, User, FileText, CheckSquare, AlertCircle,
} from 'lucide-react';

const statusBadge: Record<string, string> = {
  requested: 'badge-info',
  quoted: 'badge-primary',
  in_progress: 'badge-accent',
  in_review: 'badge-warning',
  completed: 'badge-success',
  closed: 'badge',
};

const statusOptions = ['requested', 'quoted', 'in_progress', 'in_review', 'completed', 'closed'];

function memberName(member: string | { name: string; email?: string }): string {
  return typeof member === 'string' ? member : member.name;
}

export default function ProjectDetailPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const { id } = use(paramsPromise);
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Project>>({});
  const [saving, setSaving] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [newMilestone, setNewMilestone] = useState({ title: '', dueDate: '' });
  const [addingMilestone, setAddingMilestone] = useState(false);
  const [showAssignTeam, setShowAssignTeam] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [assigningTeam, setAssigningTeam] = useState(false);
  const [formError, setFormError] = useState('');
  const { clients } = useClients();
  const { services } = useServiceOptions();
  const { members } = useTeamMembers();

  useEffect(() => {
    async function load() {
      try {
        const res = await projectsService.getProject(id);
        if (res.success) setProject(res.data);
      } catch {
        // handle
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleUpdate = async () => {
    setFormError('');
    if (editData.clientId && !isValidObjectId(editData.clientId as string)) {
      setFormError('Please select a valid client.');
      return;
    }
    if (editData.serviceId && !isValidObjectId(editData.serviceId as string)) {
      setFormError('Please select a valid service.');
      return;
    }
    // Only send the editable fields — the raw project object carries
    // populated docs (client/team/milestones) the API would reject.
    const payload: Partial<Project> & Record<string, unknown> = {};
    if (typeof editData.title === 'string') payload.title = editData.title;
    if (typeof editData.status === 'string') payload.status = editData.status;
    if (typeof editData.progressPercent === 'number') payload.progressPercent = editData.progressPercent;
    if (typeof editData.contractAccepted === 'boolean') payload.contractAccepted = editData.contractAccepted;
    if (typeof editData.clientId === 'string' && editData.clientId) payload.clientId = editData.clientId;
    if (typeof editData.serviceId === 'string' && editData.serviceId) payload.serviceId = editData.serviceId;
    setSaving(true);
    try {
      const res = await projectsService.updateProject(id, payload);
      if (!res.success) {
        setFormError(getErrorMessage(res, 'Failed to update project'));
        return;
      }
      setProject(res.data);
      setEditing(false);
    } catch (err) {
      setFormError(getErrorMessage(err, 'Failed to update project'));
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!confirm('Archive this project?')) return;
    setArchiving(true);
    try {
      await projectsService.archiveProject(id);
      router.push('/dashboard/projects');
    } finally {
      setArchiving(false);
    }
  };

  const handleToggleMilestone = async (milestoneId: string, done: boolean) => {
    try {
      await projectsService.updateMilestone(id, milestoneId, { done });
      const res = await projectsService.getProject(id);
      if (res.success) setProject(res.data);
      else setFormError(getErrorMessage(res, 'Failed to update milestone'));
    } catch (err) {
      setFormError(getErrorMessage(err, 'Failed to update milestone'));
    }
  };

  const handleAddMilestone = async () => {
    if (!newMilestone.title.trim()) return;
    setAddingMilestone(true);
    try {
      await projectsService.addMilestone(id, newMilestone);
      setShowAddMilestone(false);
      setNewMilestone({ title: '', dueDate: '' });
      const res = await projectsService.getProject(id);
      if (res.success) setProject(res.data);
    } catch (err) {
      setFormError(getErrorMessage(err, 'Failed to add milestone'));
    } finally {
      setAddingMilestone(false);
    }
  };

  const handleAssignTeam = async () => {
    if (selectedMembers.length === 0) return;
    setAssigningTeam(true);
    setFormError('');
    try {
      const res = await projectsService.assignTeam(id, { teamMemberIds: selectedMembers });
      if (!res.success) {
        setFormError(getErrorMessage(res, 'Failed to assign team'));
        return;
      }
      setShowAssignTeam(false);
      setSelectedMembers([]);
      const projectRes = await projectsService.getProject(id);
      if (projectRes.success) setProject(projectRes.data);
    } catch (err) {
      setFormError(getErrorMessage(err, 'Failed to assign team'));
    } finally {
      setAssigningTeam(false);
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

  if (!project) {
    return (
      <div className="empty-state">
        <FileText className="empty-state-icon" />
        <p className="empty-state-title">Project not found</p>
        <p className="empty-state-desc">This project does not exist or has been deleted.</p>
        <button className="btn btn-outline btn-md mt-4" onClick={() => router.push('/dashboard/projects')}>
          <ArrowLeft className="w-4 h-4" /> Back to Projects
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button className="btn btn-ghost btn-icon" onClick={() => router.push('/dashboard/projects')}>
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{project.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`badge ${statusBadge[project.status] || 'badge'}`}>
                {project.status.replace(/_/g, ' ')}
              </span>
              {project.contractAccepted && (
                <span className="badge badge-success">Contract Accepted</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-outline btn-sm" onClick={() => { setEditing(!editing); setEditData(project); }}>
            <Edit3 className="w-4 h-4" /> Edit
          </button>
          <button className="btn btn-outline btn-sm" onClick={() => setShowAssignTeam(true)}>
            <Users className="w-4 h-4" /> Assign Team
          </button>
          <button className="btn btn-ghost btn-sm text-destructive" disabled={archiving} onClick={handleArchive}>
            {archiving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
            Archive
          </button>
        </div>
      </div>

      {formError && !editing && (
        <div className="form-alert form-alert-error" role="alert">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card-dashboard">
            <h3 className="dashboard-section-title">Project Info</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-foreground/40" />
                <span className="text-foreground/60">Client:</span>
                <span>{typeof project.clientId === 'string' ? project.clientId : project.clientId?.name}</span>
              </div>
              {project.serviceId && (
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-foreground/40" />
                  <span className="text-foreground/60">Service:</span>
                  <span>{typeof project.serviceId === 'string' ? project.serviceId : project.serviceId?.title}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-foreground/40" />
                <span className="text-foreground/60">Created:</span>
                <span>{new Date(project.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-foreground/40" />
                <span className="text-foreground/60">Updated:</span>
                <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
              </div>
              {project.contractAcceptedAt && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span className="text-foreground/60">Contract accepted:</span>
                  <span>{new Date(project.contractAcceptedAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          <div className="card-dashboard">
            <h3 className="dashboard-section-title">Progress</h3>
            <div className="flex items-center gap-3">
              <div className="progress-bar flex-1">
                <div className="progress-bar-fill" style={{ width: `${project.progressPercent}%` }} />
              </div>
              <span className="text-lg font-bold text-foreground">{project.progressPercent}%</span>
            </div>
          </div>

          {editing && (
            <div className="card-dashboard">
              <h3 className="dashboard-section-title">Edit Project</h3>
              {formError && (
                <div className="form-alert form-alert-error mb-4" role="alert">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="col-span-2">
                  <label className="form-label">Title</label>
                  <input className="input" value={editData.title ?? ''} onChange={(e) => setEditData({ ...editData, title: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Client</label>
                  <select
                    className="input"
                    value={typeof editData.clientId === 'string' ? editData.clientId : editData.clientId?._id ?? ''}
                    onChange={(e) => setEditData({ ...editData, clientId: e.target.value })}
                  >
                    <option value="">Select a client...</option>
                    {clients.map((c) => (
                      <option key={c._id} value={c._id}>{c.name}{c.company ? ` — ${c.company}` : ''}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Service</label>
                  <select
                    className="input"
                    value={typeof editData.serviceId === 'string' ? editData.serviceId : editData.serviceId?._id ?? ''}
                    onChange={(e) => setEditData({ ...editData, serviceId: e.target.value })}
                  >
                    <option value="">Select a service (optional)...</option>
                    {services.map((s) => (
                      <option key={s._id} value={s._id}>{s.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Status</label>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <select className="input" value={editData.status ?? project.status} onChange={(e) => setEditData({ ...editData, status: e.target.value as any })}>
                    {statusOptions.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Progress %</label>
                  <input className="input" type="number" min={0} max={100} value={editData.progressPercent ?? project.progressPercent} onChange={(e) => setEditData({ ...editData, progressPercent: Number(e.target.value) })} />
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={editData.contractAccepted ?? project.contractAccepted}
                    onChange={(e) => setEditData({ ...editData, contractAccepted: e.target.checked })}
                  />
                  <label className="checkbox-label">Contract Accepted</label>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button className="btn btn-outline btn-sm" onClick={() => setEditing(false)}>Cancel</button>
                <button className="btn btn-primary btn-sm" disabled={saving} onClick={handleUpdate}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Save
                </button>
              </div>
            </div>
          )}

          <div className="card-dashboard">
            <div className="flex items-center justify-between mb-4">
              <h3 className="dashboard-section-title !mb-0 !pb-0 !border-0">Milestones</h3>
              <button className="btn btn-outline btn-sm" onClick={() => setShowAddMilestone(true)}>
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
            {(!project.milestones || project.milestones.length === 0) ? (
              <div className="empty-state !py-8">
                <CheckSquare className="empty-state-icon" />
                <p className="empty-state-desc">No milestones defined yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {project.milestones.map((m, i) => (
                  <div key={m._id ?? i} className="flex items-center gap-3 p-3 rounded-lg bg-surface text-sm">
                    <button
                      onClick={() => m._id && handleToggleMilestone(m._id, !m.done)}
                      disabled={!m._id}
                      aria-label={m.done ? 'Mark milestone incomplete' : 'Mark milestone complete'}
                    >
                      {m.done
                        ? <CheckCircle className="w-5 h-5 text-success" />
                        : <Circle className="w-5 h-5 text-foreground/30" />}
                    </button>
                    <div className="flex-1">
                      <span className={m.done ? 'line-through text-foreground/40' : ''}>{m.title}</span>
                      {m.dueDate && (
                        <span className="ml-2 text-xs text-foreground/40">
                          Due: {new Date(m.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {m.revisionRequested && (
                      <span className="badge badge-warning text-xs">Revision</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {showAddMilestone && (
            <div className="modal-overlay" onClick={() => setShowAddMilestone(false)}>
              <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-foreground">Add Milestone</h3>
                  <button className="btn btn-ghost btn-icon" onClick={() => setShowAddMilestone(false)}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="form-label">Title *</label>
                    <input className="input" value={newMilestone.title} onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })} />
                  </div>
                  <div>
                    <label className="form-label">Due Date</label>
                    <input className="input" type="date" value={newMilestone.dueDate} onChange={(e) => setNewMilestone({ ...newMilestone, dueDate: e.target.value })} />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button className="btn btn-outline btn-sm" onClick={() => setShowAddMilestone(false)}>Cancel</button>
                  <button className="btn btn-primary btn-sm" disabled={addingMilestone || !newMilestone.title.trim()} onClick={handleAddMilestone}>
                    {addingMilestone ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}

          {showAssignTeam && (
            <div className="modal-overlay" onClick={() => setShowAssignTeam(false)}>
              <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-foreground">Assign Team Members</h3>
                  <button className="btn btn-ghost btn-icon" onClick={() => setShowAssignTeam(false)}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <label className="form-label">Assign Team Members</label>
                  {members.length === 0 ? (
                    <p className="text-sm text-foreground/50">No staff accounts available.</p>
                  ) : (
                    <div className="space-y-1 max-h-48 overflow-auto pr-1">
                      {members.map((m) => (
                        <label key={m._id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-surface cursor-pointer text-sm">
                          <input
                            type="checkbox"
                            className="checkbox"
                            checked={selectedMembers.includes(m._id)}
                            onChange={(e) =>
                              setSelectedMembers((prev) =>
                                e.target.checked ? [...prev, m._id] : prev.filter((x) => x !== m._id)
                              )
                            }
                          />
                          <span>{m.name}</span>
                          <span className="text-xs text-foreground/40">{m.role}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                {formError && (
                  <div className="form-alert form-alert-error col-span-2" role="alert">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}
                <div className="flex justify-end gap-3 mt-6 col-span-2">
                  <button className="btn btn-outline btn-sm" onClick={() => setShowAssignTeam(false)}>Cancel</button>
                  <button className="btn btn-primary btn-sm" disabled={assigningTeam || selectedMembers.length === 0} onClick={handleAssignTeam}>
                    {assigningTeam ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Assign
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card-dashboard">
            <h3 className="dashboard-section-title">Status</h3>
            <span className={`badge ${statusBadge[project.status] || 'badge'}`}>
              {project.status.replace(/_/g, ' ')}
            </span>
          </div>

          <div className="card-dashboard">
            <h3 className="dashboard-section-title flex items-center gap-1"><Users className="w-4 h-4" /> Team Members</h3>
            {(!project.assignedTeam || project.assignedTeam.length === 0) ? (
              <div className="empty-state !py-6">
                <User className="empty-state-icon" />
                <p className="empty-state-desc">No team members assigned.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {project.assignedTeam.map((member, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm p-2 rounded-lg bg-surface">
                    <div className="avatar avatar-sm">
                      {memberName(member).charAt(0).toUpperCase()}
                    </div>
                    <span>{memberName(member)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card-dashboard">
            <h3 className="dashboard-section-title">Contract</h3>
            <div className="flex items-center gap-2">
              {project.contractAccepted ? (
                <>
                  <CheckCircle className="w-5 h-5 text-success" />
                  <span className="text-sm font-medium text-success">Accepted</span>
                </>
              ) : (
                <>
                  <Circle className="w-5 h-5 text-foreground/30" />
                  <span className="text-sm text-foreground/60">Pending</span>
                </>
              )}
            </div>
            {project.contractAcceptedAt && (
              <p className="text-xs text-foreground/40 mt-2">
                Accepted on {new Date(project.contractAcceptedAt).toLocaleDateString()}
              </p>
            )}
          </div>

          <div className="card-dashboard">
            <h3 className="dashboard-section-title">Timeline</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-foreground/60">Created</span>
                <span>{new Date(project.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground/60">Last Updated</span>
                <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
