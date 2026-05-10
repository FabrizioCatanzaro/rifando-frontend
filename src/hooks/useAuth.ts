'use client';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import type { User } from '@/types';

export function useAuth() {
  const { user, isLoading, setUser, setLoading } = useAuthStore();

  const { data, isLoading: queryLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => api.get<{ user: User }>('/api/auth/me'),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!queryLoading) {
      setUser(data?.user ?? null);
    }
  }, [data, queryLoading, setUser]);

  useEffect(() => {
    setLoading(queryLoading);
  }, [queryLoading, setLoading]);

  return { user, isLoading: isLoading || queryLoading };
}
