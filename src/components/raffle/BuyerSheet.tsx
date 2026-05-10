'use client';
import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MessageCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { buildWhatsAppUrl, calculatePrice } from '@/lib/whatsapp';
import type { Promotion } from '@/types';

interface BuyerSheetProps {
  open: boolean;
  onClose: () => void;
  selectedNumbers: number[];
  raffleName: string;
  pricePerNumber: number;
  promotions: Promotion[];
  whatsappNumber: string;
  sessionId: string;
  onReserve: (params: {
    numbers: number[];
    session_id: string;
    buyer_name: string;
  }) => Promise<{ reserved: number[]; failed: number[] }>;
}

export function BuyerSheet({
  open,
  onClose,
  selectedNumbers,
  raffleName,
  pricePerNumber,
  promotions,
  whatsappNumber,
  sessionId,
  onReserve,
}: BuyerSheetProps) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [unavailable, setUnavailable] = useState<number[]>([]);

  const pending = selectedNumbers.filter((n) => !unavailable.includes(n));
  const sorted = [...pending].sort((a, b) => a - b);
  const { total, promotionLabel } = calculatePrice(pending.length, pricePerNumber, promotions);

  const handleSend = async () => {
    if (!name.trim() || pending.length === 0) return;
    setLoading(true);
    try {
      const result = await onReserve({
        numbers: pending,
        session_id: sessionId,
        buyer_name: name.trim(),
      });

      if (result.failed.length > 0) {
        setUnavailable((prev) => [...prev, ...result.failed]);
        // If all failed, don't open WA
        if (result.reserved.length === 0) {
          setLoading(false);
          return;
        }
      }

      const url = buildWhatsAppUrl({
        numbers: result.reserved,
        raffleName,
        buyerName: name.trim(),
        pricePerNumber,
        promotions,
        whatsappNumber,
      });
      window.open(url, '_blank');
      setName('');
      setUnavailable([]);
      onClose();
    } catch {
      // error toast handled upstream
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setUnavailable([]);
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && handleClose()}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl px-4 pb-10 pt-6 sm:px-0 sm:pb-12"
      >
        <div className="mx-auto w-full max-w-md">
          <SheetHeader className="mb-6">
            <SheetTitle>Confirmar reserva</SheetTitle>
            <SheetDescription>
              {sorted.length > 0
                ? <>Números: <strong>{sorted.join(', ')}</strong></>
                : 'Todos los números seleccionados ya no están disponibles.'}
            </SheetDescription>
          </SheetHeader>

          {unavailable.length > 0 && (
            <div className="mb-4 bg-amber-950/30 border border-amber-700/40 rounded-lg px-3 py-2 text-sm text-amber-300">
              Los números <strong>{unavailable.join(', ')}</strong> ya fueron tomados y se eliminaron de tu selección.
            </div>
          )}

          {sorted.length > 0 && (
            <div className="space-y-4">
              <div className="bg-zinc-900 rounded-lg p-4 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">{pending.length} número{pending.length !== 1 ? 's' : ''}</span>
                  <span className="text-zinc-100 font-semibold">{formatCurrency(total)}</span>
                </div>
                {promotionLabel && (
                  <p className="text-xs text-violet-400">{promotionLabel}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="buyer-name">Tu nombre completo</Label>
                <Input
                  id="buyer-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  className="bg-zinc-900 border-zinc-700"
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
              </div>

              <Button
                onClick={handleSend}
                disabled={!name.trim() || loading}
                className="w-full bg-green-600 hover:bg-green-500 text-white gap-2"
                size="lg"
              >
                <MessageCircle className="h-5 w-5" />
                {loading ? 'Reservando...' : 'Enviar por WhatsApp'}
              </Button>
            </div>
          )}

          {sorted.length === 0 && (
            <Button onClick={handleClose} variant="outline" className="w-full border-zinc-700">
              Cerrar
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
