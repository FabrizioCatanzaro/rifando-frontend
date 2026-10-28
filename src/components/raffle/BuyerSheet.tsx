'use client';
import { useState, useRef } from 'react';
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
import { MessageCircle, Copy, Check, Upload, X, CheckCircle2, FileText, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import { buildWhatsAppUrl, calculatePrice } from '@/lib/whatsapp';
import { api, ApiError } from '@/lib/api';
import { createMercadoPagoCheckout } from '@/hooks/usePayments';
import { savePendingCheckout } from '@/lib/mpCheckout';
import type { ConfirmationMethod, Promotion, ReserveResult } from '@/types';

interface TransferInfo {
  alias: string | null;
  holder: string | null;
  cuit: string | null;
  bank: string | null;
}

interface BuyerSheetProps {
  open: boolean;
  onClose: () => void;
  selectedNumbers: number[];
  raffleId: string;
  raffleName: string;
  pricePerNumber: number;
  promotions: Promotion[];
  whatsappNumber: string;
  transferInfo: TransferInfo;
  sessionId: string;
  confirmationMethod: ConfirmationMethod;
  onReserve: (params: {
    numbers: number[];
    session_id: string;
    buyer_name: string;
    comprobante_url?: string;
  }) => Promise<ReserveResult>;
}

function toBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

export function BuyerSheet({
  open,
  onClose,
  selectedNumbers,
  raffleId,
  raffleName,
  pricePerNumber,
  promotions,
  whatsappNumber,
  transferInfo,
  sessionId,
  confirmationMethod,
  onReserve,
}: BuyerSheetProps) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [unavailable, setUnavailable] = useState<number[]>([]);
  const [aliasCopied, setAliasCopied] = useState(false);
  const [comprobanteFile, setComprobanteFile] = useState<File | null>(null);
  const [comprobantePreview, setComprobantePreview] = useState<string | null>(null);
  const [result, setResult] = useState<ReserveResult | null>(null);
  // Mercado Pago: compra ya reservada. Si falla el inicio del pago, se reintenta sin volver a reservar.
  const [mpPurchaseId, setMpPurchaseId] = useState<string | null>(null);
  const isMercadoPago = confirmationMethod === 'mercadopago';
  // Copia de la selección al abrir: la grilla se refresca en segundo plano y no debe cambiar el modal.
  const [snapshot, setSnapshot] = useState<number[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Toma la copia en el render en que el modal pasa de cerrado a abierto.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setSnapshot(selectedNumbers);
  }

  const pending = snapshot.filter((n) => !unavailable.includes(n));
  const sorted = [...pending].sort((a, b) => a - b);
  const { total, promotionLabel } = calculatePrice(pending.length, pricePerNumber, promotions);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = file.type.startsWith('image/') || file.type === 'application/pdf';
    if (!allowed) {
      toast.error('El comprobante debe ser una imagen o un PDF');
      e.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('El comprobante supera los 5 MB');
      e.target.value = '';
      return;
    }
    setComprobanteFile(file);
    const url = URL.createObjectURL(file);
    setComprobantePreview(url);
  };

  const removeFile = () => {
    setComprobanteFile(null);
    setComprobantePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleMercadoPago = async () => {
    if (!name.trim() || pending.length === 0) return;
    setLoading(true);
    let redirecting = false;
    try {
      let purchaseId = mpPurchaseId;
      if (!purchaseId) {
        const res = await onReserve({ numbers: pending, session_id: sessionId, buyer_name: name.trim() });
        if (res.failed.length > 0) {
          setUnavailable((prev) => [...prev, ...res.failed]);
          return;
        }
        if (!res.purchase_id) return;
        purchaseId = res.purchase_id;
        setMpPurchaseId(purchaseId);
      }

      try {
        const checkout = await createMercadoPagoCheckout(raffleId, purchaseId, sessionId);
        savePendingCheckout({ raffleId, purchaseId, sessionId });
        redirecting = true;
        window.location.assign(checkout.init_point);
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : 'No se pudo abrir Mercado Pago. Probá de nuevo.');
      }
    } catch {
      // error de la reserva: el toast lo muestra onReserve
    } finally {
      if (!redirecting) setLoading(false);
    }
  };

  const handleSend = async () => {
    if (isMercadoPago) return handleMercadoPago();
    if (!name.trim() || pending.length === 0) return;
    if (confirmationMethod === 'upload' && !comprobanteFile) {
      toast.error('Adjuntá el comprobante de transferencia para continuar');
      return;
    }
    setLoading(true);
    try {
      let comprobante_url: string | undefined;

      if (confirmationMethod === 'upload' && comprobanteFile) {
        const base64 = await toBase64(comprobanteFile);
        const res = await api.post<{ url: string }>('/api/upload/comprobante', { data: base64 });
        comprobante_url = res.url;
      }

      const res = await onReserve({
        numbers: pending,
        session_id: sessionId,
        buyer_name: name.trim(),
        comprobante_url,
      });

      if (res.failed.length > 0) {
        // La API reserva todo o nada: marcamos los tomados y el comprador confirma el resto.
        setUnavailable((prev) => [...prev, ...res.failed]);
        return;
      }

      setResult(res);
    } catch {
      // error toast handled upstream
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    setName('');
    setUnavailable([]);
    setComprobanteFile(null);
    setComprobantePreview(null);
    setResult(null);
    setMpPurchaseId(null);
    setSnapshot([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClose();
  };

  const whatsappConsultUrl = (() => {
    if (!whatsappNumber) return null;
    let phone = whatsappNumber.replace(/\D/g, '');
    if (!phone.startsWith('54')) phone = `54${phone}`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(`Hola, tengo una consulta sobre la rifa "${raffleName}"`)}`;
  })();

  return (
    <Sheet open={open} onOpenChange={(v) => !v && resetAndClose()}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl px-4 pb-10 pt-6 sm:px-0 sm:pb-12"
      >
        <div className="mx-auto w-full max-w-md">

          {/* ── Reserva confirmada ── */}
          {result !== null ? (
            <div className="space-y-5 text-center">
              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-green-900/40 border border-green-700/40 mx-auto">
                <CheckCircle2 className="h-7 w-7 text-green-400" />
              </div>
              <div className="space-y-1">
                <p className="text-lg font-bold text-zinc-50">¡Números reservados!</p>
                <p className="text-sm text-zinc-400">
                  Reservaste {result.reserved.length === 1 ? 'el número' : 'los números'}{' '}
                  <strong className="text-zinc-200">{result.reserved.join(', ')}</strong> por{' '}
                  <strong className="text-zinc-200">{formatCurrency(result.total)}</strong>.
                </p>
                <p className="text-sm text-zinc-400">
                  {result.expires_at
                    ? `Enviá el mensaje de WhatsApp con tu comprobante antes de las ${new Date(result.expires_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} o la reserva se libera.`
                    : 'Tu comprobante fue enviado. Los números quedan reservados hasta que el organizador confirme tu pago.'}
                </p>
              </div>
              {confirmationMethod === 'whatsapp' && whatsappNumber && (
                <a
                  href={buildWhatsAppUrl({
                    numbers: result.reserved,
                    raffleName,
                    buyerName: name.trim(),
                    pricePerNumber,
                    promotions,
                    whatsappNumber,
                    transferInfo,
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-[#25D366] text-zinc-950 text-sm font-semibold hover:bg-[#25D366]/90 transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  Enviar por WhatsApp
                </a>
              )}
              {confirmationMethod === 'upload' && whatsappConsultUrl && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-2">
                  <p className="text-xs text-zinc-500">¿Tenés alguna duda?</p>
                  <a
                    href={whatsappConsultUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] text-sm font-medium hover:bg-[#25D366]/20 transition-colors"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Contactar al organizador por WhatsApp
                  </a>
                </div>
              )}
              <Button onClick={resetAndClose} variant="outline" className="w-full border-zinc-700">
                Cerrar
              </Button>
            </div>
          ) : (
            <>
              <SheetHeader className="mb-6">
                <SheetTitle>Confirmar reserva</SheetTitle>
                <SheetDescription>
                  {sorted.length > 0
                    ? <>Números: <strong>{sorted.join(', ')}</strong></>
                    : 'Los números que elegiste ya no están disponibles. Cerrá y elegí otros.'}
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

                  {transferInfo.alias && !isMercadoPago && (
                    <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-3 space-y-2">
                      <p className="text-xs font-semibold text-zinc-300 uppercase tracking-wide">Datos para transferir</p>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between gap-2 items-center">
                          <span className="text-zinc-500 shrink-0">Alias o CBU/CVU</span>
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-100 font-mono font-medium text-right">{transferInfo.alias}</span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(transferInfo.alias!);
                                setAliasCopied(true);
                                toast.success('Alias copiado');
                                setTimeout(() => setAliasCopied(false), 2000);
                              }}
                              className="text-zinc-500 hover:text-zinc-200 transition-colors shrink-0"
                              title="Copiar alias"
                            >
                              {aliasCopied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        </div>
                        {transferInfo.holder && (
                          <div className="flex justify-between gap-2">
                            <span className="text-zinc-500 shrink-0">Titular</span>
                            <span className="text-zinc-100 text-right">{transferInfo.holder}</span>
                          </div>
                        )}
                        {transferInfo.cuit && (
                          <div className="flex justify-between gap-2">
                            <span className="text-zinc-500 shrink-0">CUIT/CUIL</span>
                            <span className="text-zinc-100 text-right">{transferInfo.cuit}</span>
                          </div>
                        )}
                        {transferInfo.bank && (
                          <div className="flex justify-between gap-2">
                            <span className="text-zinc-500 shrink-0">Banco</span>
                            <span className="text-zinc-100 text-right">{transferInfo.bank}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="buyer-name">Tu nombre completo</Label>
                    <Input
                      id="buyer-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej: Juan Pérez"
                      className="bg-zinc-900 border-zinc-700"
                      disabled={!!mpPurchaseId}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    />
                  </div>

                  {/* Upload mode: comprobante + WhatsApp consultation */}
                  {confirmationMethod === 'upload' && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>Comprobante de transferencia</Label>
                        {comprobantePreview ? (
                          <div className="relative">
                            {comprobanteFile?.type === 'application/pdf' ? (
                              <div className="flex items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-900 p-3 pr-10">
                                <FileText className="h-8 w-8 text-zinc-400 shrink-0" />
                                <span className="text-sm text-zinc-200 truncate">{comprobanteFile.name}</span>
                              </div>
                            ) : (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={comprobantePreview}
                                alt="Comprobante"
                                className="w-full max-h-40 object-contain rounded-lg border border-zinc-700 bg-zinc-900"
                              />
                            )}
                            <button
                              type="button"
                              onClick={removeFile}
                              className="absolute top-2 right-2 p-1 rounded-full bg-zinc-950/80 border border-zinc-700 text-zinc-400 hover:text-zinc-100 transition-colors"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full flex flex-col items-center gap-2 py-6 rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-900 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300 transition-colors"
                          >
                            <Upload className="h-5 w-5" />
                            <span className="text-sm">Tocar para adjuntar imagen o PDF</span>
                            <span className="text-xs text-zinc-600">Máximo 5 MB</span>
                          </button>
                        )}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*,application/pdf"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                      </div>

                      {whatsappConsultUrl && (
                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                          <MessageCircle className="h-4 w-4 text-[#25D366] shrink-0" />
                          <p className="text-xs text-zinc-400 flex-1">¿Dudas sobre la rifa?</p>
                          <a
                            href={whatsappConsultUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[#25D366] font-medium hover:underline shrink-0"
                          >
                            Consultar
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  <p className="text-xs text-zinc-500 text-center">
                    {isMercadoPago
                      ? 'Tus números quedan reservados 30 minutos mientras pagás. Se confirman solos al acreditarse el pago.'
                      : confirmationMethod === 'upload'
                        ? 'Tus números quedan reservados hasta que el organizador confirme tu pago.'
                        : 'Tus números quedan reservados 30 minutos. En el paso siguiente enviás el mensaje por WhatsApp.'}
                  </p>

                  {isMercadoPago ? (
                    <Button
                      onClick={handleSend}
                      disabled={!name.trim() || loading}
                      className="w-full bg-sky-600 hover:bg-sky-500 text-white gap-2"
                      size="lg"
                    >
                      <CreditCard className="h-5 w-5" />
                      {loading ? 'Abriendo Mercado Pago...' : mpPurchaseId ? 'Reintentar pago' : 'Pagar con Mercado Pago'}
                    </Button>
                  ) : (
                  <Button
                    onClick={handleSend}
                    disabled={!name.trim() || loading}
                    className="w-full bg-green-600 hover:bg-green-500 text-white gap-2"
                    size="lg"
                  >
                    {confirmationMethod === 'upload'
                      ? <Upload className="h-5 w-5" />
                      : <MessageCircle className="h-5 w-5" />
                    }
                    {loading
                      ? (confirmationMethod === 'upload' ? 'Subiendo...' : 'Reservando...')
                      : 'Confirmar'
                    }
                  </Button>
                  )}
                </div>
              )}

              {sorted.length === 0 && (
                <Button onClick={resetAndClose} variant="outline" className="w-full border-zinc-700">
                  Cerrar
                </Button>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
