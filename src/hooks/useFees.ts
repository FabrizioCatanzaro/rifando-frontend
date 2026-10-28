'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { AdminFeePayment, FeeConfig, FeePayment, FeePaymentInfo } from '@/types';

/** Porcentajes vigentes para la calculadora de precio. */
export function useFeeConfig() {
  return useQuery({
    queryKey: ['fees', 'config'],
    queryFn: () => api.get<FeeConfig>('/api/fees'),
    staleTime: 10 * 60 * 1000,
  });
}

/** Rifante: comisión de Rifando por ventas sin Mercado Pago. */
export function useFeePayment(raffleId: string, enabled = true) {
  return useQuery({
    queryKey: ['fee-payment', raffleId],
    queryFn: () => api.get<FeePaymentInfo>(`/api/raffles/${raffleId}/fee-payment`),
    enabled: enabled && !!raffleId,
  });
}

export function useSubmitFeePayment(raffleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (comprobante_url: string) =>
      api.post<{ payment: FeePayment }>(`/api/raffles/${raffleId}/fee-payment`, { comprobante_url }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fee-payment', raffleId] }),
  });
}

/** Admin: pagos de comisión para revisar. */
export function useAdminFeePayments() {
  return useQuery({
    queryKey: ['admin', 'fee-payments'],
    queryFn: () => api.get<{ payments: AdminFeePayment[] }>('/api/admin/fee-payments'),
  });
}

export function useReviewFeePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: 'approve' | 'reject' }) =>
      api.patch(`/api/admin/fee-payments/${id}/${decision}`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'fee-payments'] }),
  });
}
