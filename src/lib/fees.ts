import type { ConfirmationMethod, ReservationTtlMinutes } from '@/types';

export const RESERVATION_TTL_OPTIONS: { value: ReservationTtlMinutes; label: string }[] = [
  { value: 30, label: '30 minutos' },
  { value: 60, label: '1 hora' },
  { value: 360, label: '6 horas' },
  { value: 1440, label: '24 horas' },
];

/** "30 minutos", "1 hora", "24 horas". */
export function formatTtl(minutes: number): string {
  return RESERVATION_TTL_OPTIONS.find((o) => o.value === minutes)?.label ?? `${minutes} minutos`;
}

interface FeeRates {
  appFeePercent: number;
  mercadoPagoFeePercent: number;
  method: ConfirmationMethod;
}

/** % total que se descuenta de lo recaudado. Mercado Pago solo cobra con cobro automático. */
export function totalFeePercent({ appFeePercent, mercadoPagoFeePercent, method }: FeeRates): number {
  return appFeePercent + (method === 'mercadopago' ? mercadoPagoFeePercent : 0);
}

/** Redondea hacia arriba a un precio "lindo": de a $10 desde $100, de a $1 debajo. */
function roundPriceUp(value: number): number {
  const step = value >= 100 ? 10 : 1;
  return Math.ceil(value / step) * step;
}

/**
 * Precio por número para ganar `target` limpio si se venden todos los números.
 * precio = meta / (cantidad × (1 − comisiones))
 */
export function priceForTarget(target: number, totalNumbers: number, rates: FeeRates): number {
  if (target <= 0 || totalNumbers <= 0) return 0;
  const keep = 1 - totalFeePercent(rates) / 100;
  if (keep <= 0) return 0;
  return roundPriceUp(target / (totalNumbers * keep));
}

export interface FeeBreakdown {
  gross: number;
  mercadoPagoFee: number;
  appFee: number;
  net: number;
}

/** Desglose estimado si se venden todos los números al precio dado (sin promociones). */
export function feeBreakdown(price: number, totalNumbers: number, rates: FeeRates): FeeBreakdown {
  const gross = Math.max(0, price) * Math.max(0, totalNumbers);
  const mercadoPagoFee = rates.method === 'mercadopago' ? (gross * rates.mercadoPagoFeePercent) / 100 : 0;
  const appFee = (gross * rates.appFeePercent) / 100;
  // Pesos enteros: es una estimación.
  const mp = Math.round(mercadoPagoFee);
  const app = Math.round(appFee);
  return { gross, mercadoPagoFee: mp, appFee: app, net: gross - mp - app };
}

const percentFormat = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 });

export function formatFeePercent(value: number): string {
  return `${percentFormat.format(value)} %`;
}
