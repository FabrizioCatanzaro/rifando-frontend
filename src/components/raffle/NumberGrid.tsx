'use client';
import { useSelectionStore } from '@/stores/selectionStore';
import { NumberCell } from './NumberCell';
import { SkeletonGrid } from '@/components/shared/SkeletonGrid';
import type { RaffleNumber } from '@/types';

interface NumberGridProps {
  numbers: RaffleNumber[] | undefined;
  isLoading: boolean;
  coverIcon: string;
  readOnly?: boolean;
  highlightedNumber?: number;
}

export function NumberGrid({ numbers, isLoading, coverIcon, readOnly = false, highlightedNumber }: NumberGridProps) {
  const { toggle, isSelected } = useSelectionStore();

  if (isLoading) return <SkeletonGrid />;

  if (!numbers || numbers.length === 0) {
    return <p className="text-zinc-500 text-center py-12">No hay números disponibles.</p>;
  }

  return (
    <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
      {numbers.map((n) => (
        <NumberCell
          key={n.number}
          data={n}
          coverIcon={coverIcon}
          isSelected={readOnly ? false : isSelected(n.number)}
          onToggle={toggle}
          readOnly={readOnly}
          isHighlighted={n.number === highlightedNumber}
        />
      ))}
    </div>
  );
}
