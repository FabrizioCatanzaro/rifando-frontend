import type { Promotion } from '@/types';

interface TransferInfo {
  alias: string | null;
  holder: string | null;
  cuit: string | null;
  bank: string | null;
}

interface BuildUrlParams {
  numbers: number[];
  raffleName: string;
  buyerName: string;
  pricePerNumber: number;
  promotions: Promotion[];
  whatsappNumber: string;
  transferInfo?: TransferInfo;
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
  const { numbers, raffleName, buyerName, pricePerNumber, promotions, whatsappNumber, transferInfo } = params;
  const sorted = [...numbers].sort((a, b) => a - b);
  const { total, promotionLabel } = calculatePrice(numbers.length, pricePerNumber, promotions);

  const priceStr = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
  }).format(total);

  let msg = `Hola! Quiero comprar números en Rifando:\n\n`;
  msg += `🏷️ *${raffleName}*\n`;
  msg += `Números: *${sorted.join(', ')}*\n`;
  msg += `Nombre: ${buyerName}\n`;
  msg += `Total: *${priceStr}*`;

  if (promotionLabel) {
    msg += `\nPromoción: ${promotionLabel}`;
  }

  if (transferInfo?.alias) {
    msg += `\n\n🏦 *Datos para transferir:*\n`;
    msg += `Alias: *${transferInfo.alias}*\n`;
    if (transferInfo.holder) msg += `Titular: ${transferInfo.holder}\n`;
    if (transferInfo.cuit) msg += `CUIT/CUIL: ${transferInfo.cuit}\n`;
    if (transferInfo.bank) msg += `Banco: ${transferInfo.bank}`;
  }

  let phone = whatsappNumber.replace(/\D/g, '');
  if (!phone.startsWith('54')) phone = `54${phone}`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}
