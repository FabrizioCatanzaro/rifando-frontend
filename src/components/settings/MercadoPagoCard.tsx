'use client';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { useLinkMercadoPago, useMercadoPagoStatus, useUnlinkMercadoPago } from '@/hooks/usePayments';
import { ApiError } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';

const LINK_ERRORS: Record<string, string> = {
  expired: 'El enlace de vinculación venció o se canceló. Probá de nuevo.',
  taken: 'Esa cuenta de Mercado Pago ya está vinculada a otro usuario de Rifando.',
  failed: 'Mercado Pago no pudo completar la vinculación. Probá de nuevo.',
};

export function MercadoPagoCard() {
  const qc = useQueryClient();
  const { confirm } = useConfirm();
  const { data: status, isLoading } = useMercadoPagoStatus();
  const link = useLinkMercadoPago();
  const unlink = useUnlinkMercadoPago();
  const busy = link.isPending || unlink.isPending;

  // La API vuelve de Mercado Pago a esta página con ?mp=linked o ?mp=error&mp_error=...
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const result = params.get('mp');
    if (!result) return;

    if (result === 'linked') {
      toast.success('Mercado Pago vinculado');
      qc.invalidateQueries({ queryKey: ['mercadopago', 'status'] });
    } else {
      toast.error(LINK_ERRORS[params.get('mp_error') ?? ''] ?? LINK_ERRORS.failed);
    }

    params.delete('mp');
    params.delete('mp_error');
    const query = params.toString();
    window.history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
  }, [qc]);

  const handleLink = () => {
    link.mutate(undefined, {
      onError: (err) => toast.error(err instanceof ApiError ? err.message : 'No se pudo iniciar la vinculación'),
    });
  };

  const handleUnlink = async () => {
    const ok = await confirm({
      title: 'Desvincular Mercado Pago',
      description: 'Tus compradores no van a poder pagar con Mercado Pago hasta que vuelvas a vincular tu cuenta.',
      confirmLabel: 'Desvincular',
      destructive: true,
    });
    if (!ok) return;
    unlink.mutate(undefined, {
      onSuccess: () => toast.success('Mercado Pago desvinculado'),
      onError: (err) => toast.error(err instanceof ApiError ? err.message : 'No se pudo desvincular'),
    });
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
      <div>
        <h2 className="font-semibold text-zinc-100">Cobrar con Mercado Pago</h2>
        <p className="text-xs text-zinc-500 mt-1">
          Vinculá tu cuenta y tus compradores pagan online. La plata entra directo en tu Mercado Pago y los números
          se confirman solos. La comisión de Mercado Pago se descuenta de lo que recibís.
        </p>
      </div>

      {isLoading ? (
        <div className="h-9 w-48 rounded-lg bg-zinc-800 animate-pulse" />
      ) : status && !status.configured ? (
        <p className="text-sm text-zinc-500">Mercado Pago todavía no está disponible.</p>
      ) : status?.linked ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-800/50 bg-emerald-950/30 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-emerald-300 min-w-0">
            <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
            <span className="truncate">
              Vinculado{status.linked_at ? ` desde el ${formatDateTime(status.linked_at)}` : ''}
              {status.live_mode === false && <span className="ml-1 text-amber-300">(modo prueba)</span>}
            </span>
          </div>
          <Button
            type="button"
            onClick={handleUnlink}
            disabled={busy}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 h-8 px-3 text-sm shrink-0"
          >
            Desvincular
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <Button type="button" onClick={handleLink} disabled={busy} className="bg-sky-600 hover:bg-sky-500">
            {link.isPending ? 'Abriendo Mercado Pago...' : 'Vincular Mercado Pago'}
          </Button>
          <p className="text-xs text-zinc-500">
            Te llevamos a Mercado Pago para que autorices a Rifando. Después volvés a esta página.
          </p>
        </div>
      )}
    </div>
  );
}
