'use client';
import Link from 'next/link';
import { Ticket } from 'lucide-react';
import { useExplore } from '@/hooks/useRaffle';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { formatCurrency, formatDate, formatPercent } from '@/lib/utils';
import { HomeCta } from './HomeCta';
import type { ExploreRaffle } from '@/types';

const numberFormat = new Intl.NumberFormat('es-AR');

function drawLabel(r: ExploreRaffle): string {
  if (r.draw_mode === 'all_sold' || !r.draw_date) return 'Se sortea al venderse todo';
  if (r.draw_mode === 'fixed_date') return `Se sortea el ${formatDate(r.draw_date)}`;
  return `Se sortea antes del ${formatDate(r.draw_date)}`;
}

function RaffleTile({ raffle }: { raffle: ExploreRaffle }) {
  const percent = formatPercent(raffle.sold, raffle.total_numbers);
  const left = raffle.total_numbers - raffle.sold;
  const ownerName = raffle.owner.display_name || raffle.owner.username;
  const href = `/${raffle.owner.username}/${raffle.slug}`;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 transition-colors hover:border-violet-500/50">
      <Link href={href} className="relative block aspect-[4/3] overflow-hidden bg-zinc-800">
        {raffle.main_prize?.image_url ? (
          <img
            src={raffle.main_prize.image_url}
            alt={raffle.main_prize.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl">{raffle.cover_icon}</div>
        )}
        {raffle.prize_count > 1 && (
          <span className="absolute right-2 top-2 rounded-full bg-zinc-950/80 px-2 py-0.5 text-xs text-zinc-200 backdrop-blur">
            {raffle.prize_count} premios
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="space-y-1">
          <h3 className="line-clamp-2 font-semibold leading-snug text-zinc-100">
            <Link href={href}>{raffle.title}</Link>
          </h3>
          <Link
            href={`/${raffle.owner.username}`}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200"
          >
            <UserAvatar name={ownerName} src={raffle.owner.avatar_url} className="h-5 w-5 text-[9px]" />
            {ownerName}
          </Link>
        </div>

        <div className="space-y-1.5">
          <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
            <div className="h-full rounded-full bg-violet-500" style={{ width: `${percent}%` }} />
          </div>
          <p className="text-xs text-zinc-500">
            Quedan {numberFormat.format(left)} de {numberFormat.format(raffle.total_numbers)} números. {drawLabel(raffle)}.
          </p>
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <p className="text-sm text-zinc-300">
            <span className="text-lg font-semibold text-zinc-50">{formatCurrency(raffle.price_per_number)}</span> el número
          </p>
          <Link
            href={href}
            className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
          >
            Elegir números
          </Link>
        </div>
      </div>
    </article>
  );
}

/** Frase con las estadísticas de la app. No se muestra si todavía no hay ventas. */
export function LiveStats() {
  const { data } = useExplore();
  if (!data || data.stats.numbers_sold === 0) return null;
  const { active_raffles, numbers_sold, organizers } = data.stats;
  return (
    <p className="text-sm text-zinc-400">
      Hoy hay <strong className="font-semibold text-zinc-100">{numberFormat.format(active_raffles)} rifas activas</strong> de{' '}
      {numberFormat.format(organizers)} organizadores, y ya se vendieron{' '}
      <strong className="font-semibold text-zinc-100">{numberFormat.format(numbers_sold)} números</strong> en Rifando.
    </p>
  );
}

/** Rifas públicas activas para comprar desde la home. */
export function ActiveRaffles() {
  const { data, isLoading, isError } = useExplore();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="h-80 animate-pulse rounded-2xl bg-zinc-900" />
        ))}
      </div>
    );
  }

  if (isError || !data || data.raffles.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-zinc-800 px-6 py-12 text-center">
        <Ticket className="h-8 w-8 text-zinc-600" />
        <div className="space-y-1">
          <p className="font-medium text-zinc-200">Todavía no hay rifas públicas activas</p>
          <p className="text-sm text-zinc-500">Creá la tuya y aparecé acá.</p>
        </div>
        <HomeCta />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {data.raffles.map((r) => (
        <RaffleTile key={r.id} raffle={r} />
      ))}
    </div>
  );
}
