import { cn } from '@/lib/utils';

interface UserAvatarProps {
  name: string;
  src?: string | null;
  className?: string;
}

/** Iniciales del nombre: "Juan Pérez" → "JP". */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0]![0]! + parts[parts.length - 1]![0]! : (parts[0] ?? '?').slice(0, 2);
  return letters.toUpperCase();
}

/** Foto de perfil. Sin foto: iniciales sobre violeta. */
export function UserAvatar({ name, src, className }: UserAvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-zinc-700', className)}
      />
    );
  }
  return (
    <span
      aria-label={name}
      className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-600/30 text-xs font-semibold text-violet-200 ring-1 ring-violet-500/40',
        className
      )}
    >
      {initials(name)}
    </span>
  );
}
