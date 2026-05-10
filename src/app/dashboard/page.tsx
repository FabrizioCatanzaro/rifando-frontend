'use client';
import { useEffect } from 'react';
import { useMyRaffles, useDeleteRaffle } from '@/hooks/useRaffle';
import { useAuthStore } from '@/stores/authStore';
import { RaffleCard } from '@/components/raffle/RaffleCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { LinkButton } from '@/components/ui/link-button';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

export default function DashboardPage() {
  useEffect(() => { document.title = 'Rifando — Dashboard'; }, []);
  const user = useAuthStore((s) => s.user);
  const { data, isLoading } = useMyRaffles();
  const deleteRaffle = useDeleteRaffle();

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta rifa? Esta acción no se puede deshacer.')) return;
    try {
      await deleteRaffle.mutateAsync(id);
      toast.success('Rifa eliminada');
    } catch {
      toast.error('Error al eliminar la rifa');
    }
  };

  const raffles = data?.raffles ?? [];
  const activeRaffles = raffles.filter((r) => r.status === 'active');
  const totalRevenue = raffles.reduce(
    (sum, r) => sum + (r.stats?.sold ?? 0) * r.price_per_number,
    0
  );

  return (
    <div className="max-w-4xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-50">
            Hola, {user?.display_name ?? user?.username} 👋
          </h1>
          <p className="text-sm text-zinc-400 mt-1">Panel de control</p>
        </div>
        <LinkButton href="/dashboard/raffles/new" className="bg-violet-600 hover:bg-violet-500 gap-2">
          + Nueva rifa
        </LinkButton>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: 'Rifas activas', value: activeRaffles.length },
          { label: 'Rifas totales', value: raffles.length },
          { label: 'Recaudación total', value: formatCurrency(totalRevenue) },
        ].map((stat) => (
          <div key={stat.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <p className="text-xs text-zinc-500">{stat.label}</p>
            <p className="text-2xl font-bold text-zinc-50 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Recent raffles */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-zinc-100">Mis rifas</h2>
          <a href="/dashboard/raffles" className="text-sm text-violet-400 hover:text-violet-300">
            Ver todas
          </a>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => <Skeleton key={i} className="h-48 rounded-xl bg-zinc-900" />)}
          </div>
        ) : raffles.length === 0 ? (
          <EmptyState
            title="No tenés rifas todavía"
            description="Creá tu primera rifa y empezá a vender números."
            action={
              <LinkButton href="/dashboard/raffles/new" className="bg-violet-600 hover:bg-violet-500">
                Crear mi primera rifa
              </LinkButton>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {raffles.slice(0, 4).map((raffle) => (
              <RaffleCard
                key={raffle.id}
                raffle={raffle}
                username={user?.username ?? ''}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
