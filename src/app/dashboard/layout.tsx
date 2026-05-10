'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Ticket, Settings, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

const NAV = [
  { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
  { href: '/dashboard/raffles', label: 'Mis rifas', icon: Ticket },
  { href: '/dashboard/settings', label: 'Configuración', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  const handleLogout = async () => {
    await api.post('/api/auth/logout', {});
    setUser(null);
    queryClient.clear();
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-6 w-6 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex flex-1 min-h-screen">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col w-60 border-r border-zinc-800 bg-zinc-950 p-4 gap-1">
        <div className="mb-6 px-2">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo-mark.png" alt="" className="h-8 w-8" aria-hidden />
            <img src="/logo-text.png" alt="Rifando" className="h-5 w-auto" />
          </Link>
        </div>

        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
              pathname === href
                ? 'bg-violet-600/20 text-violet-400'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}

        <div className="mt-auto">
          <div className="px-3 py-2 text-xs text-zinc-500 truncate">{user.email}</div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-zinc-400 hover:text-red-400"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" /> Salir
          </Button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <Link href="/" className="flex items-center gap-1.5">
            <img src="/logo-mark.png" alt="" className="h-7 w-7" aria-hidden />
            <img src="/logo-text.png" alt="Rifando" className="h-4 w-auto" />
          </Link>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </header>

        <main className="flex-1 p-4 pb-20 md:pb-8 md:p-8">{children}</main>

        {/* Mobile nav — fixed at bottom, always visible */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-sm">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-0.5 flex-1 py-2 text-[11px] transition-colors',
                pathname === href ? 'text-violet-400' : 'text-zinc-500'
              )}
            >
              <Icon className="h-4.5 w-4.5" />
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
