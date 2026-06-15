'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { api, ApiError } from '@/lib/api';

interface TelegramStatus {
  linked: boolean;
  username: string | null;
}

const STATUS_KEY = ['telegram', 'status'];

export function TelegramCard() {
  const qc = useQueryClient();
  // Mientras esperamos que el usuario confirme en Telegram, hacemos polling.
  const [waiting, setWaiting] = useState(false);

  const { data: status } = useQuery({
    queryKey: STATUS_KEY,
    queryFn: () => api.get<TelegramStatus>('/api/telegram/status'),
    // Polleamos cada 3s solo mientras esperamos la confirmación;
    // se corta solo apenas el backend reporta linked = true.
    refetchInterval: (query) =>
      waiting && !query.state.data?.linked ? 3000 : false,
  });

  const linkMutation = useMutation({
    mutationFn: () => api.post<{ url: string }>('/api/telegram/link', {}),
    onSuccess: ({ url }) => {
      window.open(url, '_blank', 'noopener,noreferrer');
      setWaiting(true);
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'No se pudo generar el enlace');
    },
  });

  const unlinkMutation = useMutation({
    mutationFn: () => api.post('/api/telegram/unlink', {}),
    onSuccess: () => {
      setWaiting(false);
      qc.setQueryData<TelegramStatus>(STATUS_KEY, { linked: false, username: null });
      toast.success('Telegram desvinculado');
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'No se pudo desvincular');
    },
  });

  const busy = linkMutation.isPending || unlinkMutation.isPending;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
      <div>
        <h2 className="font-semibold text-zinc-100">Notificaciones por Telegram</h2>
        <p className="text-xs text-zinc-500 mt-1">
          Vinculá tu Telegram y recibí un aviso instantáneo cada vez que alguien reserve números en tus rifas.
        </p>
      </div>

      {status?.linked ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-800/50 bg-emerald-950/30 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>
              Vinculado
              {status.username ? (
                <>
                  {' '}como <span className="font-medium">@{status.username}</span>
                </>
              ) : null}
            </span>
          </div>
          <Button
            type="button"
            onClick={() => unlinkMutation.mutate()}
            disabled={busy}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 h-8 px-3 text-sm"
          >
            Desvincular
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <Button
            type="button"
            onClick={() => linkMutation.mutate()}
            disabled={busy || waiting}
            className="bg-sky-600 hover:bg-sky-500"
          >
            {linkMutation.isPending ? 'Generando enlace...' : 'Vincular Telegram'}
          </Button>
          {waiting ? (
            <p className="text-xs text-zinc-400">
              Se abrió Telegram en otra pestaña. Tocá <span className="font-medium text-zinc-200">Iniciar</span> en
              el chat del bot y esta página se actualizará sola al confirmar.
            </p>
          ) : (
            <p className="text-xs text-zinc-500">
              Al tocar el botón se abre el bot de Rifando en Telegram. Presioná <span className="font-medium">Iniciar</span> y listo.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
