'use client';
import { useRouter } from 'next/navigation';
import { ChevronDown, LayoutDashboard, LogOut, Settings, Ticket, ShieldCheck } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { useLogout } from '@/hooks/useAuth';
import type { User } from '@/types';

/** Botón con nombre + foto del usuario. Abre el menú con accesos y "Cerrar sesión". */
export function UserMenu({ user }: { user: User }) {
  const router = useRouter();
  const logout = useLogout();
  const name = user.display_name || user.username;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 py-1 pl-1 pr-2.5 text-sm text-zinc-200 transition-colors hover:border-zinc-700 hover:bg-zinc-800">
        <UserAvatar name={name} src={user.avatar_url} className="h-7 w-7" />
        <span className="max-w-32 truncate font-medium">{name}</span>
        <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="truncate text-sm font-medium text-zinc-100">{name}</p>
          <p className="truncate text-xs text-zinc-500">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/dashboard')}>
          <LayoutDashboard /> Mi panel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/dashboard/raffles')}>
          <Ticket /> Mis rifas
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
          <Settings /> Mis datos
        </DropdownMenuItem>
        {user.is_admin && (
          <DropdownMenuItem onClick={() => router.push('/dashboard/admin')}>
            <ShieldCheck /> Admin
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={logout}>
          <LogOut /> Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
