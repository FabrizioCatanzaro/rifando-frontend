'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { useAdminDrawPayments, useApproveDrawPayment, useRejectDrawPayment } from '@/hooks/useRaffle';
import { ApiError } from '@/lib/api';
import { comprobanteThumbUrl, formatDate } from '@/lib/utils';
import { useConfirm } from '@/components/ui/confirm-dialog';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  rejected: 'Rechazado',
};

const STATUS_CLASSES: Record<string, string> = {
  pending: 'bg-amber-950/40 text-amber-400 border-amber-700/50',
  approved: 'bg-green-950/40 text-green-400 border-green-700/50',
  rejected: 'bg-red-950/40 text-red-400 border-red-700/50',
};

export default function AdminPage() {
  const { confirm } = useConfirm();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    if (!isLoading && !user?.is_admin) {
      router.replace('/dashboard');
    }
  }, [user, isLoading, router]);

  const { data, isLoading: paymentsLoading } = useAdminDrawPayments();
  const approve = useApproveDrawPayment();
  const reject = useRejectDrawPayment();

  const handleApprove = async (paymentId: string) => {
    try {
      await approve.mutateAsync(paymentId);
      toast.success('Pago aprobado. El sorteo está habilitado.');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Error al aprobar');
    }
  };

  const handleReject = async (paymentId: string) => {
    const ok = await confirm({
      title: '¿Rechazar este comprobante?',
      description: 'El rifante podrá enviar uno nuevo.',
      confirmLabel: 'Rechazar',
      destructive: true,
    });
    if (!ok) return;
    try {
      await reject.mutateAsync(paymentId);
      toast.success('Comprobante rechazado.');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Error al rechazar');
    }
  };

  if (isLoading || !user?.is_admin) return null;

  const payments = data?.payments ?? [];
  const pending = payments.filter((p) => p.status === 'pending');
  const rest = payments.filter((p) => p.status !== 'pending');

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-50">Panel de administración</h1>
        <p className="text-sm text-zinc-400 mt-0.5">Comprobantes de sorteo</p>
      </div>

      {paymentsLoading ? (
        <div className="text-center py-16 text-zinc-500">Cargando...</div>
      ) : payments.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">
          <p className="text-3xl mb-3">📭</p>
          <p>No hay comprobantes enviados todavía.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {pending.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wide">Pendientes ({pending.length})</h2>
              {pending.map((p) => (
                <div key={p.id} className="bg-zinc-900 border border-amber-700/30 rounded-xl p-4 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-zinc-100 truncate">{p.raffle_title}</p>
                      <p className="text-sm text-zinc-400">{p.owner_username} · {p.owner_email}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{formatDate(p.created_at)}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${STATUS_CLASSES[p.status]}`}>
                      {STATUS_LABELS[p.status]}
                    </span>
                  </div>
                  <a
                    href={p.comprobante_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={comprobanteThumbUrl(p.comprobante_url)}
                      alt="Comprobante"
                      className="w-full max-h-64 object-contain rounded-lg bg-zinc-800 hover:opacity-90 transition-opacity cursor-pointer"
                    />
                  </a>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-500 flex-1"
                      onClick={() => handleApprove(p.id)}
                      disabled={approve.isPending}
                    >
                      ✅ Aprobar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-zinc-700 text-zinc-400 flex-1"
                      onClick={() => handleReject(p.id)}
                      disabled={reject.isPending}
                    >
                      ✗ Rechazar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {rest.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">Historial</h2>
              {rest.map((p) => (
                <div key={p.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-zinc-100 truncate">{p.raffle_title}</p>
                      <p className="text-sm text-zinc-400">{p.owner_username} · {p.owner_email}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{formatDate(p.created_at)}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${STATUS_CLASSES[p.status]}`}>
                      {STATUS_LABELS[p.status]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
