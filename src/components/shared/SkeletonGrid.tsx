import { Skeleton } from '@/components/ui/skeleton';

export function SkeletonGrid() {
  return (
    <div
      className="grid gap-1.5"
      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(44px, 1fr))' }}
    >
      {Array.from({ length: 50 }).map((_, i) => (
        <Skeleton key={i} className="h-11 w-full rounded-lg bg-zinc-800" />
      ))}
    </div>
  );
}
