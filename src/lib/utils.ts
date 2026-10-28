import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatPercent(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

export function formatDate(date: string | null): string {
  if (!date) return '—';
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
}

/** ISO (UTC) → valor para <input type="datetime-local"> en hora local. */
export function isoToLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Valor de <input type="datetime-local"> (hora local) → ISO en UTC para la API. */
export function localInputToIso(value: string): string {
  return new Date(value).toISOString();
}

/** Fecha y hora legibles: "12 de octubre de 2026, 20:00". */
export function formatDateTime(date: string | null): string {
  if (!date) return '—';
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

/** ¿La URL del comprobante es un PDF? */
export function isPdfUrl(url: string): boolean {
  return /\.pdf($|\?)/i.test(url);
}

/**
 * Miniatura de un comprobante. Para PDF, Cloudinary genera un JPG de la primera página
 * al cambiar la extensión de la URL. Para abrirlo, enlazá la URL original.
 * Requiere "Allow delivery of PDF and ZIP files" activado en Cloudinary (Settings → Security).
 */
export function comprobanteThumbUrl(url: string): string {
  return url.replace(/\.pdf($|\?)/i, '.jpg$1');
}
