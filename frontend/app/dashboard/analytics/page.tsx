'use client';

import { useState, useEffect, useCallback } from 'react';
import { getDashboard, getTeamWorkload } from '@/services/analytics';
import type { DashboardStats, TeamWorkload } from '@/types';
import {
  Users, Target, Briefcase, DollarSign, CheckSquare,
  Loader2,
} from 'lucide-react';

export default function AnalyticsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [workload, setWorkload] = useState<TeamWorkload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, workloadRes] = await Promise.all([
        getDashboard(),
        getTeamWorkload(),
      ]);
      if (statsRes.success) {
        setStats(statsRes.data);
      }
      if (workloadRes.success) {
        setWorkload(Array.isArray(workloadRes.data) ? workloadRes.data : []);
      }
    } catch {
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]); // eslint-disable-line react-hooks/set-state-in-effect

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <div className="card p-8 text-center">
          <p className="text-destructive mb-2">{error}</p>
          <button className="btn btn-primary btn-sm" onClick={fetchData}>Retry</button>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Projects', value: stats?.totalProjects ?? 0, icon: Briefcase, color: 'text-purple-500' },
    { label: 'Active Projects', value: stats?.activeProjects ?? 0, icon: CheckSquare, color: 'text-blue-500' },
    { label: 'Total Leads', value: stats?.totalLeads ?? 0, icon: Target, color: 'text-green-500' },
    { label: 'Clients', value: stats?.totalClients ?? 0, icon: Users, color: 'text-orange-500' },
    { label: 'Team Members', value: stats?.teamCount ?? 0, icon: Users, color: 'text-teal-500' },
    { label: 'Total Revenue', value: `$${((stats?.totalRevenue ?? 0)).toLocaleString()}`, icon: DollarSign, color: 'text-emerald-500' },
    { label: 'Outstanding Revenue', value: `$${((stats?.outstandingRevenue ?? 0)).toLocaleString()}`, icon: DollarSign, color: 'text-red-500' },
    { label: 'Lead Conversion', value: `${stats?.leadConversion ?? 0}%`, icon: Target, color: 'text-violet-500' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="mt-1 text-sm text-neutral-500">Dashboard overview and team workload</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="card-dashboard">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-foreground/60">{card.label}</p>
                <Icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <p className="text-2xl font-bold text-foreground">{card.value}</p>
            </div>
          );
        })}
      </div>

      <div>
        <h2 className="text-lg font-bold text-foreground mb-4">Team Workload</h2>
        {workload.length === 0 ? (
          <div className="card p-8 text-center text-foreground/40">
            No workload data available
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workload.map((member) => {
              return (
                <div key={member.userId} className="card-dashboard">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-foreground">{member.name}</span>
                    <span className="text-sm text-foreground/60">
                      {member.projectCount} active project{member.projectCount === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-foreground/40">
                    <span>{member.email}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
