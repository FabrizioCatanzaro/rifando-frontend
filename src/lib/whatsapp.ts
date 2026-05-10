import type { Promotion } from '@/types';

interface BuildUrlParams {
  numbers: number[];
  raffleName: string;
  buyerName: string;
  pricePerNumber: number;
  promotions: Promotion[];
  whatsappNumber: string;
}

export function calculatePrice(
  count: number,
  pricePerNumber: number,
  promotions: Promotion[]
): { total: number; promotionLabel?: string } {
  const active = promotions.filter((p) => p.active);

  for (const promo of active) {
    if (count >= promo.quantity) {
      if (promo.type === 'pack' && promo.price !== null) {
        const packs = Math.floor(count / promo.quantity);
        const remaining = count % promo.quantity;
        const total = packs * promo.price + remaining * pricePerNumber;
        return { total, promotionLabel: promo.label };
      }
      if (promo.type === 'percentage' && promo.discount_percentage !== null) {
        const total = count * pricePerNumber * (1 - promo.discount_percentage / 100);
        return { total, promotionLabel: promo.label };
      }
      if (promo.type === 'bundle' && promo.free_numbers !== null) {
        const sets = Math.floor(count / promo.quantity);
        const free = sets * promo.free_numbers;
        const paid = count - free;
        return { total: paid * pricePerNumber, promotionLabel: promo.label };
      }
    }
  }

  return { total: count * pricePerNumber };
}

export function buildWhatsAppUrl(params: BuildUrlParams): string {
  const { numbers, raffleName, buyerName, pricePerNumber, promotions, whatsappNumber } = params;
  const sorted = [...numbers].sort((a, b) => a - b);
  const { total, promotionLabel } = calculatePrice(numbers.length, pricePerNumber, promotions);

  const priceStr = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
  }).format(total);

  let msg = `Hola! Quiero comprar números en Rifando:\n
            -------------------------\n
            RIFA: *${raffleName}* \n
            NÚMEROS: *${sorted.join(', ')}* \n\n
            -------------------------\n
            Mi nombre es: ${buyerName}\n
            Total: $${priceStr}\n
            `;

  if (promotionLabel) {
    msg += `
    -------------------------\n
    Promoción aplicada: ${promotionLabel}`;
  }

  const phone = whatsappNumber.replace(/\D/g, '');
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}
