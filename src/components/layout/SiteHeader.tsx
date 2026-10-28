'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { LinkButton } from '@/components/ui/link-button';
import { cn } from '@/lib/utils';
import { UserMenu } from './UserMenu';

/**
 * Header de las páginas públicas. El dashboard tiene su propio layout con el mismo UserMenu.
 * Solo es sticky en la home: la página de la rifa ya tiene su barra sticky de filtros.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const { user, isLoading } = useAuth();

  if (pathname.startsWith('/dashboard')) return null;

  const isHome = pathname === '/';

  return (
    <header
      className={cn(
        'z-30 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md',
        isHome && 'sticky top-0'
      )}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
        <Link href="/" className="flex items-center gap-2" aria-label="Rifando, inicio">
          <img src="/logo-mark.png" alt="" className="h-7 w-7" aria-hidden />
          <img src="/logo-text.png" alt="Rifando" className="hidden h-4 w-auto sm:block" />
        </Link>

        {isLoading ? (
          <div className="h-9 w-32 animate-pulse rounded-full bg-zinc-900" />
        ) : user ? (
          <UserMenu user={user} />
        ) : (
          <div className="flex items-center gap-2">
            <LinkButton href="/login" variant="ghost" size="sm" className="text-zinc-300">
              Iniciar sesión
            </LinkButton>
            <LinkButton href="/register" size="sm" className="bg-violet-600 text-white hover:bg-violet-500">
              Crear cuenta
            </LinkButton>
          </div>
        )}
      </div>
    </header>
  );
}
