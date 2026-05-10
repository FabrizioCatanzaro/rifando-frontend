'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { RaffleNumber } from '@/types';

export function useNumbers(raffleId: string) {
  return useQuery({
    queryKey: ['numbers', raffleId],
    queryFn: () => api.get<{ numbers: RaffleNumber[] }>(`/api/raffles/${raffleId}/numbers`),
    refetchInterval: 15 * 1000,
  });
}

export function useReserveNumbers(raffleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { numbers: number[]; session_id: string; buyer_name?: string }) =>
      api.post<{ reserved: number[]; failed: number[]; expires_at: string }>(
        `/api/raffles/${raffleId}/numbers/reserve`,
        data
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['numbers', raffleId] }),
  });
}

export function useReleaseReservation(raffleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { numbers: number[]; session_id: string }) =>
      api.delete(`/api/raffles/${raffleId}/numbers/reserve`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['numbers', raffleId] }),
  });
}

export function useBulkSell(raffleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { numbers: number[]; buyer_name: string }) =>
      api.post(`/api/raffles/${raffleId}/numbers/bulk-sell`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['numbers', raffleId] }),
  });
}

export function useBulkRelease(raffleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { numbers: number[] }) =>
      api.post(`/api/raffles/${raffleId}/numbers/bulk-release`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['numbers', raffleId] }),
  });
}

export function useSellNumber(raffleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      number,
      buyer_name,
      buyer_phone,
    }: {
      number: number;
      buyer_name: string;
      buyer_phone?: string;
    }) =>
      api.patch(`/api/raffles/${raffleId}/numbers/${number}/sell`, { buyer_name, buyer_phone }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['numbers', raffleId] }),
  });
}
