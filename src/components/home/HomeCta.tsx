'use client';
import { LinkButton } from '@/components/ui/link-button';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

/** Botón principal: crea cuenta o, con sesión iniciada, abre "Nueva rifa". */
export function HomeCta({ className, label = 'Crear mi rifa' }: { className?: string; label?: string }) {
  const user = useAuthStore((s) => s.user);
  return (
    <LinkButton
      href={user ? '/dashboard/raffles/new' : '/register'}
      size="lg"
      className={cn('bg-violet-600 text-white hover:bg-violet-500', className)}
    >
      {label}
    </LinkButton>
  );
}
