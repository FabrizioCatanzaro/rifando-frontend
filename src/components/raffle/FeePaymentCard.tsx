'use client';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, Clock, Copy, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFeePayment, useSubmitFeePayment } from '@/hooks/useFees';
import { api, ApiError } from '@/lib/api';
import { formatFeePercent } from '@/lib/fees';
import { formatCurrency } from '@/lib/utils';

const MAX_BYTES = 5 * 1024 * 1024;

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Comisión de Rifando por ventas sin Mercado Pago.
 * Se paga antes de finalizar o sortear: el rifante transfiere y sube el comprobante.
 */
export function FeePaymentCard({ raffleId }: { raffleId: string }) {
  const { data } = useFeePayment(raffleId);
  const submit = useSubmitFeePayment(raffleId);
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);

  if (!data || data.due <= 0) return null;

  const onSend = async () => {
    if (!file) return;
    setSending(true);
    try {
      const { url } = await api.post<{ url: string }>('/api/upload/comprobante', { data: await toBase64(file) });
      await submit.mutateAsync(url);
      setFile(null);
      toast.success('Comprobante enviado. Te avisamos cuando se apruebe.');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'No se pudo enviar el comprobante');
    } finally {
      setSending(false);
    }
  };

  const onPick = (f: File | undefined) => {
    if (!f) return;
    if (!f.type.startsWith('image/') && f.type !== 'application/pdf') return toast.error('Subí una imagen o un PDF');
    if (f.size > MAX_BYTES) return toast.error('El archivo supera los 5 MB');
    setFile(f);
  };

  const settled = data.remaining <= 0;

  return (
    <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="space-y-1">
        <h3 className="font-semibold text-zinc-100">Comisión de Rifando</h3>
        <p className="text-sm text-zinc-400">
          Las ventas confirmadas a mano pagan {formatFeePercent(data.fee_percent)} de comisión antes de finalizar la rifa.
          Las ventas con Mercado Pago ya la pagaron en cada cobro.
        </p>
      </div>

      <dl className="space-y-1.5 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-zinc-400">Ventas sin Mercado Pago</dt>
          <dd className="tabular-nums text-zinc-200">{formatCurrency(data.manual_revenue)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-zinc-400">Comisión ({formatFeePercent(data.fee_percent)})</dt>
          <dd className="tabular-nums text-zinc-200">{formatCurrency(data.due)}</dd>
        </div>
        {data.paid > 0 && (
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-400">Ya pagado</dt>
            <dd className="tabular-nums text-emerald-300">−{formatCurrency(data.paid)}</dd>
          </div>
        )}
        <div className="flex justify-between gap-4 border-t border-zinc-800 pt-2 font-semibold">
          <dt className="text-zinc-100">A pagar</dt>
          <dd className="tabular-nums text-zinc-50">{formatCurrency(data.remaining)}</dd>
        </div>
      </dl>

      {settled ? (
        <p className="flex items-center gap-2 text-sm text-emerald-300">
          <CheckCircle2 className="h-4 w-4" /> Comisión pagada. Ya podés finalizar la rifa.
        </p>
      ) : data.pending_payment ? (
        <p className="flex items-center gap-2 text-sm text-amber-300">
          <Clock className="h-4 w-4" /> Comprobante de {formatCurrency(data.pending_payment.amount)} en revisión.
        </p>
      ) : !data.account ? (
        <p className="text-sm text-zinc-400">Rifando todavía no configuró su cuenta de cobro. Escribinos desde Contacto.</p>
      ) : (
        <div className="space-y-3">
          <div className="space-y-1 rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-sm">
            <p className="text-zinc-400">Transferí {formatCurrency(data.remaining)} a:</p>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(data.account!.alias);
                toast.success('Alias copiado');
              }}
              className="flex items-center gap-2 font-mono text-zinc-100 hover:text-violet-300"
            >
              {data.account.alias} <Copy className="h-3.5 w-3.5" />
            </button>
            {data.account.holder && <p className="text-zinc-400">Titular: {data.account.holder}</p>}
            {data.account.bank && <p className="text-zinc-400">Entidad: {data.account.bank}</p>}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => onPick(e.target.files?.[0])}
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="gap-1.5 border-zinc-700"
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="h-4 w-4" /> {file ? file.name : 'Elegir comprobante'}
            </Button>
            <Button
              type="button"
              className="bg-violet-600 hover:bg-violet-500 sm:flex-1"
              disabled={!file || sending}
              onClick={onSend}
            >
              {sending ? 'Enviando...' : 'Enviar comprobante'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
