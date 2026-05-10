import { cn } from '@/lib/utils';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 gap-3', className)}>
      <h3 className="text-lg font-semibold text-zinc-300">{title}</h3>
      {description && <p className="text-sm text-zinc-500 text-center max-w-sm">{description}</p>}
      {action}
    </div>
  );
}
