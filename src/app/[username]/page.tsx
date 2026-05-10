import { api } from '@/lib/api';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatPercent } from '@/lib/utils';
import type { Raffle } from '@/types';

async function getUserData(username: string) {
  try {
    const [profileRes, rafflesRes] = await Promise.all([
      api.get<{ user: { username: string; display_name: string | null; profile_public: boolean } }>(
        `/api/users/${username}`
      ),
      api.get<{ private: boolean; raffles: Raffle[] }>(`/api/users/${username}/raffles`),
    ]);
    return { profile: profileRes.user, ...rafflesRes };
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const data = await getUserData(username);
  const name = data?.profile.display_name ?? data?.profile.username ?? username;
  return { title: name };
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const data = await getUserData(username);

  if (!data) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-screen">
        <p className="text-zinc-500">Usuario no encontrado</p>
      </div>
    );
  }

  const { profile, private: isPrivate, raffles } = data;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center mx-auto">
          <img src="/logo-mark.png" alt="Rifando" className="h-9 w-9" />
        </div>
        <h1 className="text-2xl font-bold text-zinc-50">
          {profile.display_name ?? profile.username}
        </h1>
        <p className="text-sm text-zinc-500">@{profile.username}</p>
      </div>

      {isPrivate ? (
        <div className="text-center py-12 space-y-2">
          <p className="text-zinc-400 font-medium">Perfil privado</p>
          <p className="text-sm text-zinc-500">Este usuario eligió mantener sus rifas privadas.</p>
        </div>
      ) : raffles.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-zinc-500">No hay rifas activas en este momento.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="font-semibold text-zinc-300">Rifas activas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {raffles.map((raffle) => {
              const sold = raffle.stats?.sold ?? 0;
              const percent = formatPercent(sold, raffle.total_numbers);
              return (
                <Link
                  key={raffle.id}
                  href={`/${username}/${raffle.slug}`}
                  className="block bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-violet-500/50 transition-colors space-y-3"
                >
                  <div>
                    <h3 className="font-semibold text-zinc-100 truncate">{raffle.title}</h3>
                    <p className="text-sm text-zinc-400">{formatCurrency(raffle.price_per_number)} por número</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-zinc-500">
                      <span>{sold} vendidos de {raffle.total_numbers}</span>
                      <span>{percent}%</span>
                    </div>
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-violet-500 rounded-full transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                  <Badge variant="default" className="text-xs">Participar</Badge>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
