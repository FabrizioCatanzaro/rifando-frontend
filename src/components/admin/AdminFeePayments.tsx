'use client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { useAdminFeePayments, useReviewFeePayment } from '@/hooks/useFees';
import { ApiError } from '@/lib/api';
import { formatFeePercent } from '@/lib/fees';
import { comprobanteThumbUrl, formatCurrency, formatDateTime } from '@/lib/utils';
import type { FeePayment } from '@/types';

const STATUS: Record<FeePayment['status'], { label: string; className: string }> = {
  pending: { label: 'Pendiente', className: 'border-amber-700/50 text-amber-300' },
  approved: { label: 'Aprobado', className: 'border-emerald-700/50 text-emerald-300' },
  rejected: { label: 'Rechazado', className: 'border-red-800/50 text-red-300' },
};

/** Admin: comprobantes de la comisión de Rifando por ventas sin Mercado Pago. */
export function AdminFeePayments() {
  const { confirm } = useConfirm();
  const { data, isLoading } = useAdminFeePayments();
  const review = useReviewFeePayment();

  const onReview = async (id: string, decision: 'approve' | 'reject') => {
    if (decision === 'reject') {
      const ok = await confirm({
        title: '¿Rechazar este comprobante?',
        description: 'El rifante podrá enviar uno nuevo.',
        confirmLabel: 'Rechazar',
        destructive: true,
      });
      if (!ok) return;
    }
    try {
      await review.mutateAsync({ id, decision });
      toast.success(decision === 'approve' ? 'Comisión aprobada' : 'Comprobante rechazado');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Error al revisar el pago');
    }
  };

  const payments = data?.payments ?? [];

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold text-zinc-50">Comisiones de ventas manuales</h2>
        <p className="text-sm text-zinc-400">Pagos que habilitan finalizar una rifa con ventas sin Mercado Pago.</p>
      </div>

      {isLoading ? (
        <p className="py-8 text-center text-zinc-500">Cargando...</p>
      ) : payments.length === 0 ? (
        <p className="py-8 text-center text-zinc-500">No hay pagos de comisión todavía.</p>
      ) : (
        payments.map((p) => (
          <div key={p.id} className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate font-semibold text-zinc-100">{p.raffle_title}</p>
                <p className="text-sm text-zinc-400">{p.owner_username} ({p.owner_email})</p>
                <p className="text-sm text-zinc-300">
                  {formatCurrency(p.amount)} de comisión ({formatFeePercent(p.fee_percent)} sobre {formatCurrency(p.base_amount)})
                </p>
                <p className="text-xs text-zinc-500">{formatDateTime(p.created_at)}</p>
              </div>
              <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs ${STATUS[p.status].className}`}>
                {STATUS[p.status].label}
              </span>
            </div>
            {p.status === 'pending' && (
              <>
                <a href={p.comprobante_url} target="_blank" rel="noopener noreferrer" className="block">
                  <img
                    src={comprobanteThumbUrl(p.comprobante_url)}
                    alt="Comprobante"
                    className="max-h-64 w-full rounded-lg bg-zinc-800 object-contain"
                  />
                </a>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-green-600 hover:bg-green-500"
                    disabled={review.isPending}
                    onClick={() => onReview(p.id, 'approve')}
                  >
                    Aprobar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 border-zinc-700 text-zinc-400"
                    disabled={review.isPending}
                    onClick={() => onReview(p.id, 'reject')}
                  >
                    Rechazar
                  </Button>
                </div>
              </>
            )}
          </div>
        ))
      )}
    </section>
  );
}
