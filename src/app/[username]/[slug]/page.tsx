'use client';
import { use, useState } from 'react';
import { usePublicRaffle } from '@/hooks/useRaffle';
import { useNumbers, useReserveNumbers } from '@/hooks/useNumbers';
import { useSelectionStore } from '@/stores/selectionStore';
import { NumberGrid } from '@/components/raffle/NumberGrid';
import { BuyerSheet } from '@/components/raffle/BuyerSheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatCurrency, formatPercent, formatDate } from '@/lib/utils';
import { calculatePrice } from '@/lib/whatsapp';
import { toast } from 'sonner';
import { MessageCircle, Lock, Share2, ClipboardCheck, Search } from 'lucide-react';
import { RichTextView } from '@/components/raffle/RichTextView';
import { ApiError } from '@/lib/api';
import type { Prize } from '@/types';

type PublicTab = 'numbers' | 'prizes' | 'purpose';

export default function PublicRafflePage({
  params,
}: {
  params: Promise<{ username: string; slug: string }>;
}) {
  const { username, slug } = use(params);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [tab, setTab] = useState<PublicTab>('numbers');
  const [gridFilter, setGridFilter] = useState<'all' | 'available' | 'sold' | 'reserved'>('all');
  const [codeInput, setCodeInput] = useState('');
  const [submittedCode, setSubmittedCode] = useState<string | undefined>();
  const [codeError, setCodeError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [searchNum, setSearchNum] = useState('');
  const [highlightedNumber, setHighlightedNumber] = useState<number | undefined>();

  const { data, isLoading: raffleLoading, error } = usePublicRaffle(username, slug, submittedCode);
  const { data: numbersData, isLoading: numbersLoading } = useNumbers(data?.raffle.id ?? '');
  const reserveNumbers = useReserveNumbers(data?.raffle.id ?? '');
  const { selected, sessionId, clear } = useSelectionStore();

  const selectedArr = Array.from(selected);
  const raffle = data?.raffle;
  const owner = data?.owner;
  const promotions = data?.promotions ?? [];
  const prizes: Prize[] = data?.prizes ?? [];

  const hasPurpose =
    !!raffle?.rich_content && Object.keys(raffle.rich_content).length > 0;

  const tabs: { key: PublicTab; label: string }[] = [
    { key: 'numbers', label: 'Números' },
    { key: 'prizes', label: `Premios${prizes.length > 0 ? ` (${prizes.length})` : ''}` },
    ...(hasPurpose ? [{ key: 'purpose' as PublicTab, label: 'Información' }] : []),
  ];

  if (raffleLoading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-screen">
        <div className="h-8 w-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  // Private raffle — access code required
  const is403 = error instanceof ApiError && error.status === 403;
  if (is403 || (!raffle && !raffleLoading && submittedCode)) {
    const wrongCode = submittedCode !== undefined;
    return (
      <div className="flex flex-1 items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-zinc-900 border border-zinc-700 mx-auto">
              <Lock className="h-6 w-6 text-violet-400" />
            </div>
            <h1 className="text-xl font-bold text-zinc-50">Rifa privada</h1>
            <p className="text-sm text-zinc-400">Ingresá el código de acceso para ver esta rifa.</p>
          </div>

          <div className="space-y-3">
            <Input
              value={codeInput}
              onChange={(e) => { setCodeInput(e.target.value.toUpperCase()); setCodeError(false); }}
              placeholder="ABC123"
              maxLength={6}
              className={`text-center uppercase tracking-widest font-mono text-lg bg-zinc-900 border-zinc-700 ${codeError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && codeInput.length === 6) {
                  setSubmittedCode(codeInput);
                }
              }}
              autoFocus
            />
            {codeError && (
              <p className="text-xs text-red-400 text-center">Código incorrecto. Intentá de nuevo.</p>
            )}
            {wrongCode && is403 && !codeError && (
              <p className="text-xs text-red-400 text-center">Código incorrecto. Intentá de nuevo.</p>
            )}
            <Button
              className="w-full bg-violet-600 hover:bg-violet-500"
              disabled={codeInput.length < 6}
              onClick={() => {
                if (codeInput.length < 6) return;
                setSubmittedCode(codeInput);
              }}
            >
              Acceder
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!raffle || !owner) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-screen">
        <p className="text-zinc-500">Rifa no encontrada</p>
      </div>
    );
  }

  const sold = numbersData?.numbers.filter((n) => n.status === 'sold').length ?? 0;
  const percent = formatPercent(sold, raffle.total_numbers);

  const { total, promotionLabel } = calculatePrice(
    selectedArr.length,
    raffle.price_per_number,
    promotions
  );

  const handleConfirm = () => {
    if (selectedArr.length === 0) return;
    setSheetOpen(true);
  };

  const handleReserve = async (params: { numbers: number[]; session_id: string; buyer_name: string }) => {
    const res = await reserveNumbers.mutateAsync(params);
    if (res.failed.length > 0 && res.reserved.length === 0) {
      toast.error('Todos los números ya no estaban disponibles.');
    } else if (res.failed.length > 0) {
      toast.warning(`Los números ${res.failed.join(', ')} ya no estaban disponibles.`);
    }
    return res;
  };

  return (
    <div className="min-h-screen pb-32">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-950 px-4 py-4 md:py-6">
        <div className="max-w-3xl mx-auto space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge variant={raffle.status === 'active' ? 'default' : 'outline'}>
                {raffle.status === 'active' ? 'Activa' : raffle.status === 'finished' ? 'Finalizada' : 'Borrador'}
              </Badge>
              {raffle.winner_number !== null && (
                <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-700/40">
                  🏆 Ganador: #{raffle.winner_number}
                </Badge>
              )}
            </div>
            <button
              type="button"
              title="Compartir rifa"
              onClick={async () => {
                const url = window.location.href;
                if (navigator.share) {
                  await navigator.share({ title: raffle.title, url }).catch(() => {});
                } else {
                  await navigator.clipboard.writeText(url);
                  setCopied(true);
                  toast.success('Enlace copiado al portapapeles');
                  setTimeout(() => setCopied(false), 2000);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-zinc-100 hover:border-zinc-500 transition-colors shrink-0"
            >
              {copied
                ? <><ClipboardCheck className="h-4 w-4 text-green-400" /><span className="text-green-400">Copiado</span></>
                : <><Share2 className="h-4 w-4" /><span>Compartir</span></>
              }
            </button>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-zinc-50">{raffle.title}</h1>

          {raffle.description && (
            <p className="text-sm text-zinc-400">{raffle.description}</p>
          )}

          <div className="flex flex-wrap gap-4 text-sm text-zinc-400">
            <span>{formatCurrency(raffle.price_per_number)} por número</span>
            <span>{raffle.total_numbers} números totales</span>
            {raffle.draw_date && <span>Sorteo: {formatDate(raffle.draw_date)}</span>}
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs text-zinc-500">
              <span>{sold} vendidos</span>
              <span>{percent}%</span>
            </div>
            <Progress value={percent} className="h-1.5" />
          </div>

          {owner.display_name && (
            <p className="text-xs text-zinc-500">
              Organizado por <span className="text-zinc-400">{owner.display_name}</span>
            </p>
          )}
        </div>
      </div>

      {/* Tabs — below header, above content */}
      <div className="border-b border-zinc-800 bg-zinc-950 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                tab === key
                  ? 'border-violet-500 text-violet-400'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-3xl mx-auto px-4 py-6">

        {/* Números */}
        {tab === 'numbers' && (
          <div className="space-y-4">
            {/* Search input */}
            {raffle.status === 'active' && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
                <Input
                  type="number"
                  min={1}
                  max={raffle.total_numbers}
                  placeholder={`Buscar número (1–${raffle.total_numbers})`}
                  value={searchNum}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSearchNum(val);
                    const n = parseInt(val, 10);
                    if (!isNaN(n) && n >= 1 && n <= raffle.total_numbers) {
                      setHighlightedNumber(n);
                      setGridFilter('all');
                      setTimeout(() => {
                        document.getElementById(`num-${n}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }, 50);
                    } else {
                      setHighlightedNumber(undefined);
                    }
                  }}
                  className="pl-9 bg-zinc-900 border-zinc-700 placeholder:text-zinc-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            )}

            {/* Filter buttons */}
            {raffle.status === 'active' && (
              <div className="flex gap-2 flex-wrap">
                {(
                  [
                    { key: 'all', label: 'Todos', count: numbersData?.numbers.length },
                    { key: 'available', label: 'Libres', count: numbersData?.numbers.filter((n) => n.status === 'available').length },
                    { key: 'sold', label: 'Vendidos', count: numbersData?.numbers.filter((n) => n.status === 'sold').length },
                    { key: 'reserved', label: 'Pendientes', count: numbersData?.numbers.filter((n) => n.status === 'reserved').length },
                  ] as const
                ).map(({ key, label, count }) => (
                  <button
                    key={key}
                    onClick={() => setGridFilter(key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                      gridFilter === key
                        ? 'bg-violet-600 border-violet-500 text-white'
                        : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
                    }`}
                  >
                    {label}
                    {count !== undefined && count > 0 && (
                      <span className={`ml-1.5 ${gridFilter === key ? 'text-violet-200' : 'text-zinc-500'}`}>
                        {count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-zinc-500">
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-zinc-900 border border-zinc-700 inline-block" /> Disponible</span>
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-violet-600 inline-block" /> Seleccionado</span>
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-amber-950 border border-amber-700/50 inline-block" /> Pendiente</span>
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-zinc-800 inline-block" /> Vendido</span>
            </div>

            {raffle.status === 'active' ? (
              <>
                <NumberGrid
                  numbers={
                    gridFilter === 'all'
                      ? numbersData?.numbers
                      : numbersData?.numbers.filter((n) => n.status === gridFilter)
                  }
                  isLoading={numbersLoading}
                  coverIcon={raffle.cover_icon}
                  highlightedNumber={highlightedNumber}
                />
                {!numbersLoading && gridFilter !== 'all' &&
                  numbersData?.numbers.filter((n) => n.status === gridFilter).length === 0 && (
                  <p className="text-center text-sm text-zinc-500 py-8">
                    No hay números {gridFilter === 'available' ? 'libres' : gridFilter === 'sold' ? 'vendidos' : 'pendientes'}.
                  </p>
                )}
              </>
            ) : (
              <div className="text-center py-16 text-zinc-500">
                {raffle.status === 'finished' ? 'Esta rifa ya finalizó.' : 'Esta rifa no está activa todavía.'}
              </div>
            )}
          </div>
        )}

        {/* Premios */}
        {tab === 'prizes' && (
          <div className="space-y-4">
            {prizes.length === 0 ? (
              <div className="text-center py-16 text-zinc-500">
                <p className="text-4xl mb-3">🏆</p>
                <p>El rifante no cargó premios todavía.</p>
              </div>
            ) : (
              prizes
                .sort((a, b) => a.position - b.position)
                .map((prize, idx) => (
                  <div key={prize.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                    {prize.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={prize.image_url}
                        alt={prize.title}
                        className="w-full aspect-square object-contain bg-zinc-800"
                      />
                    )}
                    <div className="p-4">
                      <p className="text-xs text-zinc-500 mb-1">
                        {idx === 0 ? '🥇 1er premio' : idx === 1 ? '🥈 2do premio' : idx === 2 ? '🥉 3er premio' : `${idx + 1}° premio`}
                      </p>
                      <p className="font-semibold text-zinc-100 text-lg">{prize.title}</p>
                      {prize.description && (
                        <p className="text-sm text-zinc-400 mt-1">{prize.description}</p>
                      )}
                      {prize.winner_number !== null && (
                        <p className="text-sm text-yellow-400 mt-2 font-medium">
                          🏆 Ganado por el número #{prize.winner_number}
                        </p>
                      )}
                    </div>
                  </div>
                ))
            )}
          </div>
        )}

        {/* Información */}
        {tab === 'purpose' && hasPurpose && (
          <RichTextView content={raffle.rich_content} />
        )}
      </div>

      {/* Sticky bottom bar */}
      {raffle.status === 'active' && selectedArr.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-zinc-950 border-t border-zinc-800 px-4 py-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-zinc-100 font-semibold">
              {selectedArr.length} número{selectedArr.length > 1 ? 's' : ''} · {formatCurrency(total)}
            </p>
            {promotionLabel && <p className="text-xs text-violet-400 truncate">{promotionLabel}</p>}
          </div>
          <Button variant="ghost" size="sm" onClick={clear} className="text-zinc-500 shrink-0">
            Limpiar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={reserveNumbers.isPending}
            className="bg-green-600 hover:bg-green-500 text-white gap-2 shrink-0"
          >
            <MessageCircle className="h-4 w-4" />
            {reserveNumbers.isPending ? 'Reservando...' : 'Confirmar'}
          </Button>
        </div>
      )}

      <BuyerSheet
        open={sheetOpen}
        onClose={() => { setSheetOpen(false); clear(); }}
        selectedNumbers={selectedArr}
        raffleName={raffle.title}
        pricePerNumber={raffle.price_per_number}
        promotions={promotions}
        whatsappNumber={owner.whatsapp_number ?? ''}
        sessionId={sessionId}
        onReserve={handleReserve}
      />
    </div>
  );
}
