'use client';
import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { RaffleNumber, Purchase, ReserveResult } from '@/types';

/** Refresca todo lo que depende de los números: grilla, compras y estadísticas. */
function invalidateRaffleData(qc: QueryClient, raffleId: string) {
  qc.invalidateQueries({ queryKey: ['numbers', raffleId] });
  qc.invalidateQueries({ queryKey: ['purchases', raffleId] });
  qc.invalidateQueries({ queryKey: ['raffles', 'mine'] });
}

export function usePendingPurchases(raffleId: string) {
  return useQuery({
    queryKey: ['purchases', raffleId],
    queryFn: () => api.get<{ purchases: Purchase[] }>(`/api/raffles/${raffleId}/numbers/purchases`),
    enabled: !!raffleId,
    refetchInterval: 15 * 1000,
  });
}

export function useConfirmPurchase(raffleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ purchaseId, buyer_name }: { purchaseId: string; buyer_name?: string }) =>
      api.post(`/api/raffles/${raffleId}/numbers/purchases/${purchaseId}/confirm`, { buyer_name }),
    onSuccess: () => invalidateRaffleData(qc, raffleId),
  });
}

export function useRejectPurchase(raffleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (purchaseId: string) =>
      api.post(`/api/raffles/${raffleId}/numbers/purchases/${purchaseId}/reject`, {}),
    onSuccess: () => invalidateRaffleData(qc, raffleId),
  });
}

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
    mutationFn: (data: { numbers: number[]; session_id: string; buyer_name?: string; comprobante_url?: string }) =>
      api.post<ReserveResult>(`/api/raffles/${raffleId}/numbers/reserve`, data),
    onSuccess: () => invalidateRaffleData(qc, raffleId),
  });
}

export function useReleaseReservation(raffleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { numbers: number[]; session_id: string }) =>
      api.delete(`/api/raffles/${raffleId}/numbers/reserve`, data),
    onSuccess: () => invalidateRaffleData(qc, raffleId),
  });
}

export function useBulkSell(raffleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { numbers: number[]; buyer_name: string }) =>
      api.post(`/api/raffles/${raffleId}/numbers/bulk-sell`, data),
    onSuccess: () => invalidateRaffleData(qc, raffleId),
  });
}

export function useBulkRelease(raffleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { numbers: number[] }) =>
      api.post(`/api/raffles/${raffleId}/numbers/bulk-release`, data),
    onSuccess: () => invalidateRaffleData(qc, raffleId),
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
    onSuccess: () => invalidateRaffleData(qc, raffleId),
  });
}
