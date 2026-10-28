/**
 * El sessionId del comprador se regenera en cada carga de página.
 * Antes de ir a Mercado Pago guardamos la compra y su sessionId para
 * poder consultar el resultado cuando el comprador vuelve.
 * localStorage (no sessionStorage): en el celular Mercado Pago puede volver en otra pestaña.
 */
const PREFIX = 'rifando:mp:';
const TTL_MS = 2 * 60 * 60 * 1000; // 2 horas

export interface PendingCheckout {
  raffleId: string;
  purchaseId: string;
  sessionId: string;
  savedAt: number;
}

export function savePendingCheckout(data: Omit<PendingCheckout, 'savedAt'>) {
  try {
    localStorage.setItem(PREFIX + data.purchaseId, JSON.stringify({ ...data, savedAt: Date.now() }));
  } catch {
    // Sin almacenamiento (modo privado): el retorno muestra un mensaje genérico.
  }
}

export function loadPendingCheckout(purchaseId: string): PendingCheckout | null {
  try {
    const raw = localStorage.getItem(PREFIX + purchaseId);
    if (!raw) return null;
    const data = JSON.parse(raw) as PendingCheckout;
    if (Date.now() - data.savedAt > TTL_MS) {
      localStorage.removeItem(PREFIX + purchaseId);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function clearPendingCheckout(purchaseId: string) {
  try {
    localStorage.removeItem(PREFIX + purchaseId);
  } catch {
    // nada
  }
}
