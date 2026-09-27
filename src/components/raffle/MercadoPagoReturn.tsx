'use client';
import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Clock, CreditCard, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { createMercadoPagoCheckout, getMercadoPagoCheckoutStatus } from '@/hooks/usePayments';
import { ApiError } from '@/lib/api';
import { clearPendingCheckout, loadPendingCheckout, type PendingCheckout } from '@/lib/mpCheckout';
import { formatCurrency } from '@/lib/utils';
import type { MercadoPagoCheckoutStatus } from '@/types';

const POLL_MS = 3000;
const MAX_ATTEMPTS = 10; // ~30 segundos esperando el webhook

type View =
  | { kind: 'loading' }
  | { kind: 'unknown' }
  | { kind: 'status'; status: MercadoPagoCheckoutStatus; pending: PendingCheckout; waitedOut: boolean; checkedAt: number };

/** Quita los parámetros que agrega Mercado Pago a la URL. Conserva ?code= de rifas privadas. */
function cleanUrl() {
  const params = new URLSearchParams(window.location.search);
  for (const key of [...params.keys()]) {
    if (key !== 'code') params.delete(key);
  }
  const query = params.toString();
  window.history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Pantalla del comprador al volver de Mercado Pago (?mp_purchase=...).
 * Consulta el estado de la compra hasta que se confirma o hasta ~30 s.
 */
export function MercadoPagoReturn({ raffleId }: { raffleId: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>({ kind: 'loading' });
  const [retrying, setRetrying] = useState(false);
  // Parámetros de retorno leídos una sola vez. El ref sobrevive al doble efecto de React en desarrollo.
  const returnRef = useRef<{ purchaseId: string; paymentId: string | null } | null | undefined>(undefined);

  useEffect(() => {
    if (returnRef.current === undefined) {
      const params = new URLSearchParams(window.location.search);
      const purchaseParam = params.get('mp_purchase');
      const rawPaymentId = params.get('payment_id') ?? params.get('collection_id');
      returnRef.current = purchaseParam
        ? { purchaseId: purchaseParam, paymentId: rawPaymentId && /^\d+$/.test(rawPaymentId) ? rawPaymentId : null }
        : null;
      if (purchaseParam) cleanUrl();
    }
    if (!returnRef.current) return;

    const { purchaseId, paymentId } = returnRef.current;
    const pending = loadPendingCheckout(purchaseId);
    setOpen(true);

    if (!pending || pending.raffleId !== raffleId) {
      setView({ kind: 'unknown' });
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const poll = async (attempt: number) => {
      try {
        const status = await getMercadoPagoCheckoutStatus(raffleId, pending.purchaseId, pending.sessionId, paymentId);
        if (cancelled) return;

        const settled =
          status.purchase_status !== 'pending' || status.payment_status === 'rejected' || !paymentId;
        const waitedOut = attempt + 1 >= MAX_ATTEMPTS;
        setView({ kind: 'status', status, pending, waitedOut: waitedOut && !settled, checkedAt: Date.now() });

        if (status.purchase_status === 'confirmed') {
          clearPendingCheckout(pending.purchaseId);
          qc.invalidateQueries({ queryKey: ['numbers', raffleId] });
        }
        if (!settled && !waitedOut) timer = setTimeout(() => poll(attempt + 1), POLL_MS);
      } catch {
        if (!cancelled) setView({ kind: 'unknown' });
      }
    };
    poll(0);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [raffleId, qc]);

  const retryPayment = async (pending: PendingCheckout) => {
    setRetrying(true);
    try {
      const checkout = await createMercadoPagoCheckout(raffleId, pending.purchaseId, pending.sessionId);
      window.location.assign(checkout.init_point);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'No se pudo abrir Mercado Pago. Probá de nuevo.');
      setRetrying(false);
    }
  };

  let icon = <Clock className="h-7 w-7 text-sky-400" />;
  let title = 'Consultando tu pago...';
  let body: React.ReactNode = null;
  let action: React.ReactNode = null;

  if (view.kind === 'unknown') {
    title = 'Volviste de Mercado Pago';
    body = 'Si completaste el pago, tus números se confirman solos y el organizador recibe el aviso.';
  } else if (view.kind === 'status') {
    const { status, pending, waitedOut, checkedAt } = view;
    const canRetry =
      status.purchase_status === 'pending' && !!status.expires_at && new Date(status.expires_at).getTime() > checkedAt;

    if (status.purchase_status === 'confirmed') {
      icon = <CheckCircle2 className="h-7 w-7 text-green-400" />;
      title = '¡Pago aprobado!';
      body = (
        <>
          Compraste {status.numbers.length === 1 ? 'el número' : 'los números'}{' '}
          <strong className="text-zinc-200">{status.numbers.join(', ')}</strong> por{' '}
          <strong className="text-zinc-200">{formatCurrency(status.total)}</strong>. Ya figuran como vendidos.
        </>
      );
    } else if (status.purchase_status !== 'pending') {
      icon = <XCircle className="h-7 w-7 text-amber-400" />;
      title = 'Tu reserva ya no está vigente';
      body = 'Si llegaste a pagar, el organizador recibió el aviso y se va a comunicar con vos.';
    } else if (status.payment_status === 'rejected') {
      icon = <XCircle className="h-7 w-7 text-red-400" />;
      title = 'El pago fue rechazado';
      body = canRetry
        ? `Tus números siguen reservados hasta las ${formatTime(status.expires_at!)}. Podés probar con otro medio de pago.`
        : 'La reserva está por vencer. Elegí los números de nuevo.';
    } else if (waitedOut) {
      title = 'Estamos confirmando tu pago';
      body = 'Mercado Pago todavía no nos avisó. Si pagaste, tus números se confirman solos en unos minutos.';
    } else if (view.status.payment_status === null && !canRetry) {
      title = 'No completaste el pago';
      body = 'La reserva está por vencer. Elegí los números de nuevo.';
    } else if (view.status.payment_status === null) {
      title = 'No completaste el pago';
      body = `Tus números siguen reservados hasta las ${formatTime(status.expires_at!)}.`;
    }

    if (canRetry && (status.payment_status === 'rejected' || status.payment_status === null) && !waitedOut) {
      action = (
        <Button
          onClick={() => retryPayment(pending)}
          disabled={retrying}
          className="w-full bg-sky-600 hover:bg-sky-500 text-white gap-2"
          size="lg"
        >
          <CreditCard className="h-5 w-5" />
          {retrying ? 'Abriendo Mercado Pago...' : 'Pagar con Mercado Pago'}
        </Button>
      );
    }
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && setOpen(false)}>
      <SheetContent side="bottom" className="rounded-t-2xl px-4 pb-10 pt-6 sm:px-0 sm:pb-12">
        <div className="mx-auto w-full max-w-md space-y-5 text-center">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-zinc-900 border border-zinc-700 mx-auto">
            {icon}
          </div>
          <SheetHeader className="items-center">
            <SheetTitle>{title}</SheetTitle>
            {body && <SheetDescription className="text-center">{body}</SheetDescription>}
          </SheetHeader>
          {action}
          <Button onClick={() => setOpen(false)} variant="outline" className="w-full border-zinc-700">
            Cerrar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
