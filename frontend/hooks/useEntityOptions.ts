'use client';

import { useState, useEffect } from 'react';
import { getUsers } from '@/services/users';
import { getServices } from '@/services/services';
import type { Service, User } from '@/types';

interface PaginatedLike {
  users?: User[];
  data?: User[];
  items?: User[];
}

export function useClients() {
  const [clients, setClients] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getUsers({ role: 'client', limit: '500' })
      .then((res) => {
        if (res.success && !cancelled) {
          const d = res.data as unknown as PaginatedLike;
          setClients(d.users ?? d.data ?? d.items ?? []);
        }
      })
      .catch(() => {
        // handled
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { clients, loading };
}

export function useServiceOptions() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getServices()
      .then((res) => {
        if (res.success && !cancelled) {
          setServices(Array.isArray(res.data) ? res.data : []);
        }
      })
      .catch(() => {
        // handled
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { services, loading };
}

export function useTeamMembers() {
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getUsers({ limit: '500' })
      .then((res) => {
        if (res.success && !cancelled) {
          const d = res.data as unknown as PaginatedLike;
          const all = d.users ?? d.data ?? d.items ?? [];
          setMembers(all.filter((u) => u.role === 'admin' || u.role === 'team' || u.role === 'super_admin'));
        }
      })
      .catch(() => {
        // handled
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { members, loading };
}
