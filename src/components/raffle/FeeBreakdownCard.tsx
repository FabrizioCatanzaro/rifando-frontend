import { feeBreakdown, formatFeePercent } from '@/lib/fees';
import { cn, formatCurrency } from '@/lib/utils';
import type { ConfirmationMethod } from '@/types';

interface FeeBreakdownCardProps {
  price: number;
  totalNumbers: number;
  method: ConfirmationMethod;
  appFeePercent: number;
  mercadoPagoFeePercent: number;
  className?: string;
}

/** Desglose de lo que recibe el rifante si vende todos los números. */
export function FeeBreakdownCard({
  price,
  totalNumbers,
  method,
  appFeePercent,
  mercadoPagoFeePercent,
  className,
}: FeeBreakdownCardProps) {
  const rates = { appFeePercent, mercadoPagoFeePercent, method };
  const b = feeBreakdown(price, totalNumbers, rates);
  const isMp = method === 'mercadopago';

  return (
    <div className={cn('rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm', className)}>
      <p className="mb-3 text-zinc-400">Si vendés los {totalNumbers || 0} números:</p>
      <dl className="space-y-1.5">
        <div className="flex justify-between gap-4">
          <dt className="text-zinc-400">Recaudás</dt>
          <dd className="tabular-nums text-zinc-200">{formatCurrency(b.gross)}</dd>
        </div>
        {isMp && (
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-400">Comisión de Mercado Pago ({formatFeePercent(mercadoPagoFeePercent)}, estimada)</dt>
            <dd className="tabular-nums text-red-300">−{formatCurrency(b.mercadoPagoFee)}</dd>
          </div>
        )}
        {appFeePercent > 0 && (
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-400">Comisión de Rifando ({formatFeePercent(appFeePercent)})</dt>
            <dd className="tabular-nums text-red-300">−{formatCurrency(b.appFee)}</dd>
          </div>
        )}
        <div className="flex justify-between gap-4 border-t border-zinc-800 pt-2 font-semibold">
          <dt className="text-zinc-100">Te queda</dt>
          <dd className="tabular-nums text-emerald-300">{formatCurrency(b.net)}</dd>
        </div>
      </dl>
      <p className="mt-3 text-xs text-zinc-500">
        {isMp
          ? 'Mercado Pago descuenta las dos comisiones en cada pago. El resto entra a tu cuenta.'
          : appFeePercent > 0
            ? 'Sin Mercado Pago no hay comisión de Mercado Pago. La comisión de Rifando se paga antes de finalizar la rifa.'
            : 'Sin Mercado Pago no hay comisión de Mercado Pago.'}{' '}
        Las promociones bajan lo recaudado.
      </p>
    </div>
  );
}
