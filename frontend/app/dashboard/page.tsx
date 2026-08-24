'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { CardSkeleton } from '@/components/Skeleton';
import DashboardStats from '@/components/dashboard/DashboardStats';
import RecentActivity from '@/components/dashboard/RecentActivity';
import * as tasksService from '@/services/tasks';
import * as projectsService from '@/services/projects';
import type {
  DashboardStats as DashboardStatsType, TeamWorkload, ActivityLog, Task, Project,
} from '@/types';
import {
  Briefcase, Target, DollarSign, Users, TrendingUp, Clock, Percent, User, CheckSquare,
} from 'lucide-react';

const projectStatusLabels: Record<string, string> = {
  requested: 'Requested',
  quoted: 'Quoted',
  in_progress: 'In Progress',
  in_review: 'In Review',
  completed: 'Completed',
  closed: 'Closed',
};

const taskStatusBadge: Record<string, string> = {
  todo: 'badge-info',
  in_progress: 'badge-warning',
  in_review: 'badge-primary',
  done: 'badge-success',
  cancelled: 'badge',
};

const projectStatusBadge: Record<string, string> = {
  requested: 'badge-info',
  quoted: 'badge-primary',
  in_progress: 'badge-accent',
  in_review: 'badge-warning',
  completed: 'badge-success',
  closed: 'badge',
};

export default function DashboardPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  if (!user || !isAdmin) {
    return <TeamDashboard userId={user?.id ?? user?._id ?? ''} />;
  }

  return <AdminDashboard />;
}

function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStatsType | null>(null);
  const [workload, setWorkload] = useState<TeamWorkload[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [dashboardRes, workloadRes, activityRes] = await Promise.all([
        api.get<DashboardStatsType>('/analytics/dashboard'),
        api.get<TeamWorkload[]>('/analytics/team-workload'),
        api.get<{ logs: ActivityLog[] }>('/activity-log', { page: '1', limit: '8' }),
      ]);
      if (dashboardRes.success) setStats(dashboardRes.data);
      if (workloadRes.success) setWorkload(Array.isArray(workloadRes.data) ? workloadRes.data : []);
      if (activityRes.success) setActivities(activityRes.data.logs ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]); // eslint-disable-line react-hooks/set-state-in-effect

  if (loading) {
    return (
      <div className="flex flex-col gap-md">
        <div>
          <h1 className="text-h3 font-bold text-foreground">Dashboard</h1>
          <p className="mt-4xs text-body-small text-foreground/50">Overview of your agency</p>
        </div>
        <CardSkeleton count={6} />
      </div>
    );
  }

  const statCards = stats
    ? [
        { label: 'Total Projects', value: stats.totalProjects, icon: <Briefcase size={20} /> },
        { label: 'Active Projects', value: stats.activeProjects, icon: <TrendingUp size={20} /> },
        { label: 'Total Revenue', value: `$${(stats.totalRevenue ?? 0).toLocaleString()}`, icon: <DollarSign size={20} /> },
        { label: 'Outstanding Revenue', value: `$${(stats.outstandingRevenue ?? 0).toLocaleString()}`, icon: <Clock size={20} /> },
        { label: 'Total Leads', value: stats.totalLeads, icon: <Target size={20} /> },
        { label: 'Clients', value: stats.totalClients, icon: <Users size={20} /> },
        { label: 'Team Members', value: stats.teamCount, icon: <User size={20} /> },
        { label: 'Lead Conversion', value: `${stats.leadConversion ?? 0}%`, icon: <Percent size={20} /> },
      ]
    : [];

  const totalByStatus = (stats?.projectsByStatus ?? []).reduce<Record<string, number>>((acc, s) => {
    acc[s._id] = s.count;
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-md">
      <div>
        <h1 className="text-h3 font-bold text-foreground">Dashboard</h1>
        <p className="mt-4xs text-body-small text-foreground/50">Overview of your agency</p>
      </div>

      {statCards.length > 0 && <DashboardStats stats={statCards} />}

      <div className="grid grid-cols-1 gap-md lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentActivity activities={activities} />
        </div>

        <div className="flex flex-col gap-md">
          <div className="card-dashboard">
            <h3 className="dashboard-section-title">Projects by Status</h3>
            {Object.keys(totalByStatus).length === 0 ? (
              <div className="empty-state">
                <Briefcase className="empty-state-icon" />
                <p className="empty-state-title">No projects</p>
                <p className="empty-state-desc">Project status distribution will appear here.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-sm">
                {Object.entries(totalByStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between text-body-small">
                    <span className="font-medium text-foreground">
                      {projectStatusLabels[status] ?? status.replace(/_/g, ' ')}
                    </span>
                    <span className="badge badge-primary">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card-dashboard">
            <h3 className="dashboard-section-title">Team Workload</h3>
            {workload.length === 0 ? (
              <div className="empty-state">
                <User className="empty-state-icon" />
                <p className="empty-state-title">No workload data</p>
                <p className="empty-state-desc">Team workload distribution will appear here.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-sm">
                {workload.map((member) => (
                  <div key={member.userId} className="flex flex-col gap-3xs">
                    <div className="flex items-center justify-between text-body-small">
                      <span className="font-medium text-foreground">{member.name}</span>
                      <span className="text-caption text-foreground/50">
                        {member.projectCount} active project{member.projectCount === 1 ? '' : 's'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TeamDashboard({ userId }: { userId: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tasksRes, projectsRes] = await Promise.all([
        tasksService.getTasks(userId ? { assignedTo: userId, limit: '10' } : { limit: '10' }),
        projectsService.getProjects({ limit: '5' }),
      ]);
      if (tasksRes.success) setTasks(tasksRes.data.tasks ?? []);
      if (projectsRes.success) setProjects(projectsRes.data.projects ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchData(); }, [fetchData]); // eslint-disable-line react-hooks/set-state-in-effect

  if (loading) {
    return (
      <div className="flex flex-col gap-md">
        <div>
          <h1 className="text-h3 font-bold text-foreground">Dashboard</h1>
          <p className="mt-4xs text-body-small text-foreground/50">Your tasks and projects</p>
        </div>
        <CardSkeleton count={4} />
      </div>
    );
  }

  const openTasks = tasks.filter((t) => !['done', 'cancelled'].includes(t.status));
  const activeProjects = projects.filter((p) => ['in_progress', 'in_review'].includes(p.status));

  return (
    <div className="flex flex-col gap-md">
      <div>
        <h1 className="text-h3 font-bold text-foreground">Dashboard</h1>
        <p className="mt-4xs text-body-small text-foreground/50">Your tasks and projects</p>
      </div>

      <DashboardStats
        stats={[
          { label: 'Open Tasks', value: openTasks.length, icon: <CheckSquare size={20} /> },
          { label: 'Active Projects', value: activeProjects.length, icon: <Briefcase size={20} /> },
        ]}
      />

      <div className="grid grid-cols-1 gap-md lg:grid-cols-2">
        <div className="card-dashboard">
          <div className="flex items-center justify-between mb-sm">
            <h3 className="dashboard-section-title m-0 p-0 border-none">My Tasks</h3>
            <Link href="/dashboard/tasks" className="btn btn-ghost btn-sm">View All</Link>
          </div>
          {tasks.length === 0 ? (
            <div className="empty-state py-lg">
              <CheckSquare className="empty-state-icon" />
              <p className="empty-state-title">No tasks yet</p>
              <p className="empty-state-desc">Tasks assigned to you will appear here.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-xs">
              {tasks.slice(0, 10).map((task) => (
                <Link
                  key={task._id}
                  href="/dashboard/tasks"
                  className="flex items-center justify-between rounded-lg p-xs transition-colors hover:bg-surface"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-small font-medium text-foreground truncate">{task.title}</p>
                    <p className="text-caption text-foreground/50 mt-4xs">
                      {task.projectId ? `Project: ${task.projectId}` : 'No project'}
                    </p>
                  </div>
                  <span className={`badge shrink-0 ml-xs ${taskStatusBadge[task.status] ?? 'badge'}`}>
                    {task.status.replace(/_/g, ' ')}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="card-dashboard">
          <div className="flex items-center justify-between mb-sm">
            <h3 className="dashboard-section-title m-0 p-0 border-none">My Projects</h3>
            <Link href="/dashboard/projects" className="btn btn-ghost btn-sm">View All</Link>
          </div>
          {projects.length === 0 ? (
            <div className="empty-state py-lg">
              <Briefcase className="empty-state-icon" />
              <p className="empty-state-title">No projects yet</p>
              <p className="empty-state-desc">Projects you are assigned to will appear here.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-xs">
              {projects.map((project) => (
                <Link
                  key={project._id}
                  href="/dashboard/projects"
                  className="flex items-center justify-between rounded-lg p-xs transition-colors hover:bg-surface"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-small font-medium text-foreground truncate">{project.title}</p>
                    <div className="progress-bar w-24 mt-2xs">
                      <div className="progress-bar-fill" style={{ width: `${project.progressPercent}%` }} />
                    </div>
                  </div>
                  <span className={`badge shrink-0 ml-xs ${projectStatusBadge[project.status] ?? 'badge'}`}>
                    {project.status.replace(/_/g, ' ')}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
