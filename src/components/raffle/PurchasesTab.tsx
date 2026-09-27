'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Clock, Infinity as InfinityIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePendingPurchases, useConfirmPurchase, useRejectPurchase } from '@/hooks/useNumbers';
import { ApiError } from '@/lib/api';
import { comprobanteThumbUrl, formatCurrency, isPdfUrl } from '@/lib/utils';
import type { ConfirmationMethod, Purchase } from '@/types';

/** Minutos que faltan para que venza la reserva. */
function minutesLeft(expiresAt: string, now: number): number {
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - now) / 60000));
}

function PurchaseCard({
  purchase,
  raffleId,
  now,
  confirmationMethod,
}: {
  purchase: Purchase;
  raffleId: string;
  now: number;
  confirmationMethod?: ConfirmationMethod;
}) {
  const [name, setName] = useState(purchase.buyer_name);
  const [confirmingReject, setConfirmingReject] = useState(false);
  const confirm = useConfirmPurchase(raffleId);
  const reject = useRejectPurchase(raffleId);
  const busy = confirm.isPending || reject.isPending;

  const handleConfirm = async () => {
    if (!name.trim()) return;
    try {
      await confirm.mutateAsync({ purchaseId: purchase.id, buyer_name: name.trim() });
      toast.success(`Venta confirmada: ${purchase.numbers.length} número${purchase.numbers.length !== 1 ? 's' : ''}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Error al confirmar la reserva');
    }
  };

  const handleReject = async () => {
    if (!confirmingReject) {
      setConfirmingReject(true);
      return;
    }
    try {
      await reject.mutateAsync(purchase.id);
      toast.success('Reserva rechazada. Los números quedaron libres.');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Error al rechazar la reserva');
    } finally {
      setConfirmingReject(false);
    }
  };

  return (
    <div className="bg-zinc-900 border border-amber-700/30 rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-zinc-500 mb-1">Comprador</p>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-zinc-950 border-zinc-700 h-8 text-sm"
          />
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-zinc-500">Total</p>
          <p className="font-semibold text-zinc-100">{formatCurrency(purchase.total)}</p>
          {purchase.promotion_label && (
            <p className="text-[11px] text-violet-400">{purchase.promotion_label}</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {purchase.numbers.map((n) => (
          <span
            key={n}
            className="inline-flex items-center justify-center min-w-10 h-10 px-2 rounded-lg text-xs font-semibold bg-amber-950/40 border border-amber-700/50 text-amber-400"
          >
            {n}
          </span>
        ))}
      </div>

      {purchase.comprobante_url ? (
        <a
          href={purchase.comprobante_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-950 p-2 hover:border-violet-500 transition-colors"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={comprobanteThumbUrl(purchase.comprobante_url)}
            alt="Comprobante"
            className="h-14 w-14 rounded object-cover bg-zinc-800"
          />
          <div className="text-sm">
            <p className="text-zinc-100 font-medium">
              Ver comprobante{isPdfUrl(purchase.comprobante_url) ? ' (PDF)' : ''}
            </p>
            <p className="text-xs text-zinc-500">Se abre en una pestaña nueva</p>
          </div>
        </a>
      ) : (
        <p className="text-xs text-zinc-500">
          {confirmationMethod === 'mercadopago'
            ? 'El comprador está pagando con Mercado Pago. Se confirma sola al acreditarse el pago.'
            : 'Sin comprobante. El comprador te contacta por WhatsApp.'}
        </p>
      )}

      <p className="flex items-center gap-1.5 text-xs text-zinc-500">
        {purchase.expires_at ? (
          <>
            <Clock className="h-3.5 w-3.5" />
            Vence en {minutesLeft(purchase.expires_at, now)} min si no la confirmás
          </>
        ) : (
          <>
            <InfinityIcon className="h-3.5 w-3.5" />
            No vence: espera tu confirmación
          </>
        )}
      </p>

      <div className="flex gap-2 pt-1">
        <Button
          size="sm"
          className="bg-green-600 hover:bg-green-500 flex-1"
          onClick={handleConfirm}
          disabled={!name.trim() || busy}
        >
          ✅ Confirmar venta
        </Button>
        <Button
          size="sm"
          variant="outline"
          className={confirmingReject ? 'border-red-700 text-red-400' : 'border-zinc-700 text-zinc-400'}
          onClick={handleReject}
          onBlur={() => setConfirmingReject(false)}
          disabled={busy}
        >
          {confirmingReject ? '¿Rechazar? Tocá de nuevo' : '🗑 Rechazar'}
        </Button>
      </div>
    </div>
  );
}

export function PurchasesTab({
  raffleId,
  confirmationMethod,
}: {
  raffleId: string;
  confirmationMethod?: ConfirmationMethod;
}) {
  const { data, isLoading } = usePendingPurchases(raffleId);
  const [now, setNow] = useState(() => Date.now());

  // Actualiza la cuenta regresiva cada 30 segundos.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30 * 1000);
    return () => clearInterval(timer);
  }, []);

  const purchases = data?.purchases ?? [];

  if (isLoading) return <p className="text-sm text-zinc-500 py-8 text-center">Cargando reservas…</p>;

  if (purchases.length === 0) {
    return (
      <div className="text-center py-16 text-zinc-500">
        <p className="text-3xl mb-3">⏳</p>
        <p>No hay reservas pendientes.</p>
        <p className="text-xs mt-1">
          Las reservas sin comprobante vencen a los 30 minutos. Las que tienen comprobante esperan tu decisión.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-zinc-500">
        Revisá el pago y confirmá cada reserva. Al rechazarla, los números vuelven a estar libres.
      </p>
      {purchases.map((p) => (
        <PurchaseCard key={p.id} purchase={p} raffleId={raffleId} now={now} confirmationMethod={confirmationMethod} />
      ))}
    </div>
  );
}
