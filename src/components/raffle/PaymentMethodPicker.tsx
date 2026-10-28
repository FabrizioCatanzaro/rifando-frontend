'use client';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { RESERVATION_TTL_OPTIONS } from '@/lib/fees';
import type { ConfirmationMethod, ReservationTtlMinutes } from '@/types';

const METHODS: { value: ConfirmationMethod; label: string; text: string }[] = [
  {
    value: 'mercadopago',
    label: 'Cobro automático con Mercado Pago',
    text: 'El comprador paga en Mercado Pago y el número queda vendido solo. Tiene comisión de Mercado Pago.',
  },
  {
    value: 'upload',
    label: 'Reserva con comprobante',
    text: 'El comprador reserva, te transfiere y sube el comprobante. Vos confirmás la venta.',
  },
  {
    value: 'whatsapp',
    label: 'Reserva por WhatsApp',
    text: 'El comprador reserva y te escribe por WhatsApp. Vos confirmás la venta.',
  },
];

interface PaymentMethodPickerProps {
  method: ConfirmationMethod;
  onMethodChange: (method: ConfirmationMethod) => void;
  ttl: ReservationTtlMinutes;
  onTtlChange: (ttl: ReservationTtlMinutes) => void;
  mercadoPagoLinked: boolean;
}

/** Método de cobro de la rifa y, sin Mercado Pago, cuánto dura la reserva. */
export function PaymentMethodPicker({ method, onMethodChange, ttl, onTtlChange, mercadoPagoLinked }: PaymentMethodPickerProps) {
  return (
    <div className="space-y-3">
      <div role="radiogroup" aria-label="Método de cobro" className="space-y-2">
        {METHODS.map((m) => {
          const disabled = m.value === 'mercadopago' && !mercadoPagoLinked;
          const selected = method === m.value;
          return (
            <button
              key={m.value}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => onMethodChange(m.value)}
              className={cn(
                'w-full rounded-lg border px-4 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                selected ? 'border-violet-500 bg-violet-600/15' : 'border-zinc-700 bg-zinc-950 hover:border-zinc-500'
              )}
            >
              <span className={cn('block text-sm font-medium', selected ? 'text-violet-200' : 'text-zinc-200')}>{m.label}</span>
              <span className="block text-xs text-zinc-500">{m.text}</span>
            </button>
          );
        })}
      </div>
      {!mercadoPagoLinked && (
        <p className="text-xs text-zinc-500">
          Para cobrar con Mercado Pago vinculá tu cuenta en{' '}
          <Link href="/dashboard/settings" className="text-violet-300 underline-offset-2 hover:underline">
            Mis datos
          </Link>
          .
        </p>
      )}

      {method === 'whatsapp' && (
        <div className="space-y-1.5">
          <label htmlFor="reservation_ttl" className="text-sm font-medium text-zinc-300">
            Los números reservados quedan ocupados
          </label>
          <select
            id="reservation_ttl"
            value={ttl}
            onChange={(e) => onTtlChange(Number(e.target.value) as ReservationTtlMinutes)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-violet-500"
          >
            {RESERVATION_TTL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-zinc-500">
            Pasado ese tiempo sin que confirmes, los números vuelven a estar disponibles. Te avisamos cada reserva por email
            y Telegram.
          </p>
        </div>
      )}
    </div>
  );
}
