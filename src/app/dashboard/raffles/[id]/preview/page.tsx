'use client';
import { use, useState } from 'react';
import { useMyRaffles, usePrizes, usePromotions } from '@/hooks/useRaffle';
import { useNumbers } from '@/hooks/useNumbers';
import { useAuthStore } from '@/stores/authStore';
import { NumberGrid } from '@/components/raffle/NumberGrid';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LinkButton } from '@/components/ui/link-button';
import { formatCurrency, formatPercent, formatDate } from '@/lib/utils';
import { Eye } from 'lucide-react';
import { RichTextView } from '@/components/raffle/RichTextView';
import type { Prize } from '@/types';

type PreviewTab = 'numbers' | 'prizes' | 'purpose';

export default function RafflePreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [tab, setTab] = useState<PreviewTab>('numbers');
  const [gridFilter, setGridFilter] = useState<'all' | 'available' | 'sold' | 'reserved'>('all');

  const user = useAuthStore((s) => s.user);
  const { data: rafflesData, isLoading: raffleLoading } = useMyRaffles();
  const raffle = rafflesData?.raffles.find((r) => r.id === id);

  const { data: numbersData, isLoading: numbersLoading } = useNumbers(id);
  const { data: prizesData } = usePrizes(id);
  const { data: promosData } = usePromotions(id);

  const prizes: Prize[] = prizesData?.prizes ?? [];
  const hasPurpose = !!raffle?.rich_content && Object.keys(raffle.rich_content).length > 0;

  const tabs: { key: PreviewTab; label: string }[] = [
    { key: 'numbers', label: 'Números' },
    { key: 'prizes', label: `Premios${prizes.length > 0 ? ` (${prizes.length})` : ''}` },
    ...(hasPurpose ? [{ key: 'purpose' as PreviewTab, label: 'Información' }] : []),
  ];

  if (raffleLoading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-screen">
        <div className="h-8 w-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!raffle) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-zinc-500">Rifa no encontrada.</p>
        <LinkButton href="/dashboard/raffles" variant="outline">Volver</LinkButton>
      </div>
    );
  }

  const sold = numbersData?.numbers.filter((n) => n.status === 'sold').length ?? 0;
  const percent = formatPercent(sold, raffle.total_numbers);

  const filteredNumbers =
    gridFilter === 'all'
      ? numbersData?.numbers
      : numbersData?.numbers.filter((n) => n.status === gridFilter);

  return (
    <div className="min-h-screen pb-16">
      {/* Preview banner */}
      <div className="sticky top-0 z-20 bg-amber-950/80 border-b border-amber-700/50 backdrop-blur-sm px-4 py-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-amber-300">
          <Eye className="h-4 w-4 shrink-0" />
          <span className="text-sm font-medium">Vista previa — la rifa está en borrador y no es visible al público</span>
        </div>
        <LinkButton
          href={`/dashboard/raffles/${id}`}
          variant="outline"
          size="sm"
          className="border-amber-700/60 text-amber-300 hover:bg-amber-900/30 shrink-0"
        >
          ← Volver al panel
        </LinkButton>
      </div>

      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-950 px-4 py-4 md:py-6">
        <div className="max-w-3xl mx-auto space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline">Borrador</Badge>
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

          {user?.display_name && (
            <p className="text-xs text-zinc-500">
              Organizado por <span className="text-zinc-400">{user.display_name}</span>
            </p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-800 bg-zinc-950">
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

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-6">

        {/* Números */}
        {tab === 'numbers' && (
          <div className="space-y-4">
            {/* Filter buttons */}
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

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-zinc-500">
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-zinc-900 border border-zinc-700 inline-block" /> Disponible</span>
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-amber-950 border border-amber-700/50 inline-block" /> Pendiente</span>
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-zinc-800 inline-block" /> Vendido</span>
            </div>

            <NumberGrid
              numbers={filteredNumbers}
              isLoading={numbersLoading}
              coverIcon={raffle.cover_icon}
              readOnly
            />

            {!numbersLoading && gridFilter !== 'all' && filteredNumbers?.length === 0 && (
              <p className="text-center text-sm text-zinc-500 py-8">
                No hay números {gridFilter === 'available' ? 'libres' : gridFilter === 'sold' ? 'vendidos' : 'pendientes'}.
              </p>
            )}
          </div>
        )}

        {/* Premios */}
        {tab === 'prizes' && (
          <div className="space-y-4">
            {prizes.length === 0 ? (
              <div className="text-center py-16 text-zinc-500">
                <p className="text-4xl mb-3">🏆</p>
                <p>No hay premios cargados todavía.</p>
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
    </div>
  );
}
