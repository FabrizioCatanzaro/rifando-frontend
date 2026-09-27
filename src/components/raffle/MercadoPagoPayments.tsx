'use client';
import { useMercadoPagoPayments } from '@/hooks/usePayments';
import { cn, formatCurrency, formatDateTime } from '@/lib/utils';
import type { MercadoPagoPayment } from '@/types';

const STATUS_LABEL: Record<string, string> = {
  approved: 'Aprobado',
  rejected: 'Rechazado',
  cancelled: 'Cancelado',
  refunded: 'Devuelto',
  charged_back: 'Contracargo',
  in_process: 'En revisión',
  pending: 'Pendiente',
};

/** Qué hizo Rifando con el pago. Solo `confirmed` no requiere acción del rifante. */
const OUTCOME_NOTE: Record<NonNullable<MercadoPagoPayment['outcome']>, string | null> = {
  confirmed: null,
  late: 'La reserva ya no estaba vigente. Asigná números a mano o devolvé el dinero.',
  amount_mismatch: 'El monto no cubre el total. La compra sigue pendiente.',
  duplicate: 'Pago doble: la compra ya estaba confirmada. Devolvé el dinero.',
};

function statusClass(status: string) {
  if (status === 'approved') return 'bg-emerald-950/40 border-emerald-700/50 text-emerald-300';
  if (status === 'refunded' || status === 'charged_back') return 'bg-red-950/40 border-red-700/50 text-red-300';
  return 'bg-zinc-800 border-zinc-700 text-zinc-300';
}

/** Historial de pagos de Mercado Pago de la rifa. No se muestra si no hay pagos. */
export function MercadoPagoPayments({ raffleId }: { raffleId: string }) {
  const { data: payments } = useMercadoPagoPayments(raffleId);
  if (!payments || payments.length === 0) return null;

  const approved = payments.filter((p) => p.status === 'approved' && p.outcome === 'confirmed');
  const net = approved.reduce((sum, p) => sum + (p.net_amount ?? p.amount), 0);

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h3 className="font-semibold text-zinc-100">Pagos con Mercado Pago</h3>
          <p className="text-xs text-zinc-500">Neto acreditado en tu cuenta: {formatCurrency(net)}</p>
        </div>
      </div>

      <div className="space-y-2">
        {payments.map((p) => {
          const note =
            p.status === 'refunded' || p.status === 'charged_back'
              ? 'Mercado Pago devolvió el dinero. Los números siguen vendidos: liberalos si corresponde.'
              : p.outcome
                ? OUTCOME_NOTE[p.outcome]
                : null;
          return (
            <div key={p.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 space-y-1.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-100 truncate">{p.buyer_name}</p>
                  <p className="text-xs text-zinc-500">
                    {p.quantity} número{p.quantity !== 1 ? 's' : ''} · {formatDateTime(p.date_approved ?? p.created_at)}
                    {!p.live_mode && ' · prueba'}
                  </p>
                </div>
                <div className="text-right shrink-0 space-y-1">
                  <p className="text-sm font-semibold text-zinc-100">{formatCurrency(p.amount)}</p>
                  <span className={cn('inline-block px-2 py-0.5 rounded-full border text-[11px]', statusClass(p.status))}>
                    {STATUS_LABEL[p.status] ?? p.status}
                  </span>
                </div>
              </div>
              {p.fee_amount !== null && p.net_amount !== null && (
                <p className="text-xs text-zinc-500">
                  Comisión {formatCurrency(p.fee_amount)} · Neto {formatCurrency(p.net_amount)} · Pago N° {p.mp_payment_id}
                </p>
              )}
              {note && <p className="text-xs text-amber-300">{note}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
