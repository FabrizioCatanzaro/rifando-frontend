'use client';
import { cn } from '@/lib/utils';
import type { RaffleNumber } from '@/types';

interface NumberCellProps {
  data: RaffleNumber;
  coverIcon: string;
  isSelected: boolean;
  onToggle: (n: number) => void;
  readOnly?: boolean;
  isHighlighted?: boolean;
}

export function NumberCell({ data, coverIcon, isSelected, onToggle, readOnly = false, isHighlighted = false }: NumberCellProps) {
  const { number, status } = data;
  const isAvailable = status === 'available';

  return (
    <button
      id={`num-${number}`}
      type="button"
      disabled={readOnly || !isAvailable}
      onClick={() => !readOnly && isAvailable && onToggle(number)}
      title={data.buyer_name ? `Comprador: ${data.buyer_name}` : undefined}
      className={cn(
        'relative flex items-center justify-center rounded-lg text-sm font-semibold transition-all duration-150 select-none overflow-hidden',
        'w-full aspect-square min-h-[44px]',
        isAvailable && !isSelected &&
          'bg-zinc-900 border border-zinc-700 text-zinc-300 hover:border-violet-500 hover:text-violet-400 hover:scale-105 cursor-pointer',
        isAvailable && isSelected &&
          'bg-violet-600 border border-violet-500 text-white scale-105 shadow-lg shadow-violet-900/40 cursor-pointer',
        status === 'reserved' &&
          'bg-amber-950/40 border border-amber-700/50 text-amber-400 cursor-not-allowed',
        status === 'sold' &&
          'bg-zinc-800/60 border border-zinc-700/30 text-zinc-500 cursor-not-allowed',
        isHighlighted &&
          'ring-2 ring-white ring-offset-1 ring-offset-zinc-950 scale-110 z-10',
      )}
    >
      {/* Sold: diagonal line + number */}
      {status === 'sold' && (
        <>
          <span aria-hidden className="absolute inset-0 flex items-center justify-center text-xl leading-none pointer-events-none">
            {coverIcon}
          </span>
          <span className="absolute top-0.5 right-0.5 z-10 text-[10px] font-bold text-white leading-none bg-black/60 rounded px-0.5 py-px">
            {number}
          </span>
        </>
      )}

      {/* Reserved: emoji in center + number badge in corner */}
      {status === 'reserved' && (
        <>
          <span aria-hidden className="absolute inset-0 flex items-center justify-center text-xl leading-none pointer-events-none">
            {coverIcon}
          </span>
          <span className="absolute top-0.5 right-0.5 z-10 text-[10px] font-bold text-white leading-none bg-black/60 rounded px-0.5 py-px">
            {number}
          </span>
        </>
      )}

      {/* Available: just the number */}
      {status === 'available' && number}
    </button>
  );
}
