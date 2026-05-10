'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Raffle, Prize, Promotion, PublicRaffleData } from '@/types';

export function useMyRaffles() {
  return useQuery({
    queryKey: ['raffles', 'mine'],
    queryFn: () => api.get<{ raffles: Raffle[] }>('/api/raffles'),
  });
}

export function usePublicRaffle(username: string, slug: string, accessCode?: string) {
  const params = accessCode ? `?code=${accessCode}` : '';
  return useQuery({
    queryKey: ['raffle', username, slug, accessCode],
    queryFn: () => api.get<PublicRaffleData>(`/api/users/${username}/raffles/${slug}${params}`),
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
    retry: (_, error) => {
      // Don't retry on 4xx — wrong code or not found should surface immediately
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as { status: number }).status;
        if (status >= 400 && status < 500) return false;
      }
      return true;
    },
  });
}

export function useCreateRaffle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Raffle>) => api.post<{ raffle: Raffle }>('/api/raffles', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['raffles', 'mine'] }),
  });
}

export function useUpdateRaffle(raffleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Raffle>) =>
      api.patch<{ raffle: Raffle }>(`/api/raffles/${raffleId}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['raffles', 'mine'] }),
  });
}

export function useDeleteRaffle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (raffleId: string) => api.delete(`/api/raffles/${raffleId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['raffles', 'mine'] }),
  });
}

export function usePrizes(raffleId: string) {
  return useQuery({
    queryKey: ['prizes', raffleId],
    queryFn: () => api.get<{ prizes: Prize[] }>(`/api/raffles/${raffleId}/prizes`),
    enabled: !!raffleId,
  });
}

export function useCreatePrize(raffleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Prize>) => api.post(`/api/raffles/${raffleId}/prizes`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['prizes', raffleId] }),
  });
}

export function useUpdatePrize(raffleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ prizeId, data }: { prizeId: string; data: Partial<Prize> }) =>
      api.patch(`/api/raffles/${raffleId}/prizes/${prizeId}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['prizes', raffleId] }),
  });
}

export function useDeletePrize(raffleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (prizeId: string) => api.delete(`/api/raffles/${raffleId}/prizes/${prizeId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['prizes', raffleId] }),
  });
}

export function usePromotions(raffleId: string) {
  return useQuery({
    queryKey: ['promotions', raffleId],
    queryFn: () => api.get<{ promotions: Promotion[] }>(`/api/raffles/${raffleId}/promotions`),
    enabled: !!raffleId,
  });
}

export function useCreatePromotion(raffleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Promotion>) => api.post(`/api/raffles/${raffleId}/promotions`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['promotions', raffleId] }),
  });
}

export function useDeletePromotion(raffleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (promoId: string) => api.delete(`/api/raffles/${raffleId}/promotions/${promoId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['promotions', raffleId] }),
  });
}
