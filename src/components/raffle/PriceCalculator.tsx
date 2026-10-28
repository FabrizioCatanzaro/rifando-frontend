'use client';
import { useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { priceForTarget } from '@/lib/fees';
import { cn, formatCurrency } from '@/lib/utils';
import { FeeBreakdownCard } from './FeeBreakdownCard';
import type { ConfirmationMethod } from '@/types';

export type PriceMode = 'target' | 'manual';

interface PriceCalculatorProps {
  totalNumbers: number;
  method: ConfirmationMethod;
  appFeePercent: number;
  mercadoPagoFeePercent: number;
  mode: PriceMode;
  onModeChange: (mode: PriceMode) => void;
  target: string;
  onTargetChange: (value: string) => void;
  price: string;
  onPriceChange: (value: string) => void;
  priceError?: string;
  targetError?: string;
}

/**
 * Precio por número. Modo "meta": el rifante dice cuánto quiere ganar y se calcula el precio
 * descontando las comisiones. Modo "manual": pone el precio y ve cuánto le queda.
 */
export function PriceCalculator({
  totalNumbers,
  method,
  appFeePercent,
  mercadoPagoFeePercent,
  mode,
  onModeChange,
  target,
  onTargetChange,
  price,
  onPriceChange,
  priceError,
  targetError,
}: PriceCalculatorProps) {
  const rates = { appFeePercent, mercadoPagoFeePercent, method };
  const suggested = priceForTarget(Number(target), totalNumbers, rates);

  // En modo meta el precio sigue a la meta, la cantidad y el método de cobro.
  useEffect(() => {
    if (mode === 'target' && suggested > 0 && String(suggested) !== price) onPriceChange(String(suggested));
  }, [mode, suggested, price, onPriceChange]);

  return (
    <div className="space-y-4">
      <div role="radiogroup" aria-label="Cómo definir el precio" className="grid grid-cols-2 gap-2">
        {(
          [
            { value: 'target', label: 'Quiero ganar', hint: 'Calculá el precio' },
            { value: 'manual', label: 'Precio fijo', hint: 'Lo pongo yo' },
          ] as const
        ).map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={mode === o.value}
            onClick={() => onModeChange(o.value)}
            className={cn(
              'rounded-lg border px-3 py-2 text-left transition-colors',
              mode === o.value ? 'border-violet-500 bg-violet-600/15' : 'border-zinc-700 bg-zinc-950 hover:border-zinc-500'
            )}
          >
            <span className={cn('block text-sm font-medium', mode === o.value ? 'text-violet-200' : 'text-zinc-200')}>
              {o.label}
            </span>
            <span className="block text-xs text-zinc-500">{o.hint}</span>
          </button>
        ))}
      </div>

      {mode === 'target' ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="target_amount" className="text-zinc-300">¿Cuánto querés ganar limpio? *</Label>
            <Input
              id="target_amount"
              type="number"
              inputMode="numeric"
              min={1}
              value={target}
              onChange={(e) => onTargetChange(e.target.value)}
              placeholder="$ 500000"
            />
            {targetError && <p className="text-xs text-red-400">{targetError}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-zinc-300">Precio por número</Label>
            <div className="flex h-9 items-center rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-sm font-semibold tabular-nums text-zinc-100">
              {suggested > 0 ? formatCurrency(suggested) : '—'}
            </div>
            <p className="text-xs text-zinc-500">Redondeado hacia arriba.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-1.5 sm:max-w-[50%]">
          <Label htmlFor="price_per_number" className="text-zinc-300">Precio por número *</Label>
          <Input
            id="price_per_number"
            type="number"
            inputMode="numeric"
            min={0}
            value={price}
            onChange={(e) => onPriceChange(e.target.value)}
            placeholder="$"
          />
          {priceError && <p className="text-xs text-red-400">{priceError}</p>}
        </div>
      )}

      <FeeBreakdownCard
        price={Number(price) || 0}
        totalNumbers={totalNumbers}
        method={method}
        appFeePercent={appFeePercent}
        mercadoPagoFeePercent={mercadoPagoFeePercent}
      />
    </div>
  );
}
