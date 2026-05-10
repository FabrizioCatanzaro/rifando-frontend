'use client';
import { useEffect } from 'react';
import { useMyRaffles, useDeleteRaffle } from '@/hooks/useRaffle';
import { useAuthStore } from '@/stores/authStore';
import { RaffleCard } from '@/components/raffle/RaffleCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { LinkButton } from '@/components/ui/link-button';
import { toast } from 'sonner';

export default function RafflesPage() {
  useEffect(() => { document.title = 'Rifando — Mis rifas'; }, []);
  const user = useAuthStore((s) => s.user);
  const { data, isLoading } = useMyRaffles();
  const deleteRaffle = useDeleteRaffle();

  const raffles = data?.raffles ?? [];

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta rifa? Esta acción no se puede deshacer.')) return;
    try {
      await deleteRaffle.mutateAsync(id);
      toast.success('Rifa eliminada');
    } catch {
      toast.error('Error al eliminar la rifa');
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-50">Mis rifas</h1>
        <LinkButton href="/dashboard/raffles/new" className="bg-violet-600 hover:bg-violet-500 gap-2">
          + Nueva rifa
        </LinkButton>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-52 rounded-xl bg-zinc-900" />)}
        </div>
      ) : raffles.length === 0 ? (
        <EmptyState
          title="No tenés rifas todavía"
          description="Creá tu primera rifa y empezá a vender números."
          action={
            <LinkButton href="/dashboard/raffles/new" className="bg-violet-600 hover:bg-violet-500">
              Crear rifa
            </LinkButton>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {raffles.map((raffle) => (
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
  );
}
