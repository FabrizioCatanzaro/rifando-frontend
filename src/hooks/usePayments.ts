'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  MercadoPagoCheckout,
  MercadoPagoCheckoutStatus,
  MercadoPagoPayment,
  MercadoPagoStatus,
} from '@/types';

const STATUS_KEY = ['mercadopago', 'status'];

/** Rifante: estado de la vinculación. */
export function useMercadoPagoStatus() {
  return useQuery({
    queryKey: STATUS_KEY,
    queryFn: () => api.get<MercadoPagoStatus>('/api/payments/mp/status'),
  });
}

/** Rifante: pide la URL de autorización y redirige a Mercado Pago. */
export function useLinkMercadoPago() {
  return useMutation({
    mutationFn: () => api.post<{ url: string }>('/api/payments/mp/link', {}),
    onSuccess: ({ url }) => {
      window.location.assign(url);
    },
  });
}

export function useUnlinkMercadoPago() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post('/api/payments/mp/unlink', {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: STATUS_KEY }),
  });
}

/** Rifante: pagos recibidos por Mercado Pago en una rifa. */
export function useMercadoPagoPayments(raffleId: string) {
  return useQuery({
    queryKey: ['mercadopago', 'payments', raffleId],
    queryFn: () => api.get<MercadoPagoPayment[]>(`/api/payments/mp/payments?raffle_id=${raffleId}`),
    enabled: !!raffleId,
    refetchInterval: 30 * 1000,
  });
}

/** Comprador: crea (o reutiliza) el pago de su compra. */
export function createMercadoPagoCheckout(raffleId: string, purchaseId: string, sessionId: string) {
  return api.post<MercadoPagoCheckout>(
    `/api/raffles/${raffleId}/purchases/${purchaseId}/mercadopago`,
    { session_id: sessionId }
  );
}

/** Comprador: estado de su compra al volver de Mercado Pago. */
export function getMercadoPagoCheckoutStatus(
  raffleId: string,
  purchaseId: string,
  sessionId: string,
  paymentId?: string | null
) {
  const params = new URLSearchParams({ session_id: sessionId });
  if (paymentId) params.set('payment_id', paymentId);
  return api.get<MercadoPagoCheckoutStatus>(
    `/api/raffles/${raffleId}/purchases/${purchaseId}/mercadopago?${params.toString()}`
  );
}
