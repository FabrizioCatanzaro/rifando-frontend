'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Copy, ExternalLink, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api, ApiError } from '@/lib/api';

interface TelegramStatus {
  linked: boolean;
  username: string | null;
}

interface TelegramLink {
  bot_username: string;
  token: string;
  /** tg:// — abre la app directo en el chat del bot. */
  app_url: string;
  /** Telegram Web directo en el chat del bot. */
  web_app_url: string;
  /** https://t.me/... — para el QR. */
  url: string;
  expires_at: string;
}

const STATUS_KEY = ['telegram', 'status'];

export function TelegramCard() {
  const qc = useQueryClient();
  const [link, setLink] = useState<TelegramLink | null>(null);
  const [qr, setQr] = useState<string | null>(null);

  const { data: status } = useQuery({
    queryKey: STATUS_KEY,
    queryFn: () => api.get<TelegramStatus>('/api/telegram/status'),
    // Mientras hay un link pendiente, consultamos cada 3 s hasta que el bot confirme.
    refetchInterval: (query) => (link && !query.state.data?.linked ? 3000 : false),
  });

  const linkMutation = useMutation({
    mutationFn: () => api.post<TelegramLink>('/api/telegram/link', {}),
    onSuccess: async (data) => {
      setLink(data);
      // Abre la app de Telegram directo en el chat del bot.
      window.location.href = data.app_url;
      const QRCode = await import('qrcode');
      setQr(await QRCode.default.toDataURL(data.url, { margin: 1, width: 180 }));
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'No se pudo generar el enlace');
    },
  });

  const unlinkMutation = useMutation({
    mutationFn: () => api.post('/api/telegram/unlink', {}),
    onSuccess: () => {
      setLink(null);
      qc.setQueryData<TelegramStatus>(STATUS_KEY, { linked: false, username: null });
      toast.success('Telegram desvinculado');
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'No se pudo desvincular');
    },
  });

  const busy = linkMutation.isPending || unlinkMutation.isPending;
  const startCommand = link ? `/start ${link.token}` : '';

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
      ) : link ? (
        <div className="space-y-4">
          <p className="text-sm text-zinc-300">
            Tocá <span className="font-semibold text-zinc-100">Iniciar</span> en el chat de{' '}
            <span className="font-medium">@{link.bot_username}</span>. Esta página se actualiza sola al confirmar.
          </p>

          <div className="grid gap-2 sm:grid-cols-2">
            <a
              href={link.app_url}
              className="flex items-center justify-center gap-2 rounded-lg bg-sky-600 hover:bg-sky-500 px-3 py-2 text-sm font-medium text-white"
            >
              <Send className="h-4 w-4" />
              Abrir la app de Telegram
            </a>
            <a
              href={link.web_app_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-lg border border-zinc-700 hover:border-zinc-500 px-3 py-2 text-sm text-zinc-200"
            >
              <ExternalLink className="h-4 w-4" />
              Usar Telegram Web
            </a>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center rounded-lg border border-zinc-800 bg-zinc-950 p-4">
            {qr && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qr} alt="QR para vincular Telegram" className="h-36 w-36 rounded bg-white p-1" />
            )}
            <div className="space-y-2 text-xs text-zinc-400">
              <p>
                <span className="text-zinc-200 font-medium">En el celular:</span> escaneá el código QR con la cámara.
              </p>
              <p>
                <span className="text-zinc-200 font-medium">¿No se abre?</span> Buscá{' '}
                <span className="text-zinc-200">@{link.bot_username}</span> en Telegram y enviá este mensaje:
              </p>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(startCommand);
                  toast.success('Mensaje copiado');
                }}
                className="flex items-center gap-2 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 font-mono text-[11px] text-zinc-200 hover:border-sky-500"
                title="Copiar"
              >
                <span className="truncate max-w-[220px]">{startCommand}</span>
                <Copy className="h-3.5 w-3.5 shrink-0" />
              </button>
              <p className="text-zinc-500">El enlace vence en 10 minutos.</p>
            </div>
          </div>

          <button type="button" onClick={() => setLink(null)} className="text-xs text-zinc-500 hover:text-zinc-300">
            Cancelar
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <Button
            type="button"
            onClick={() => linkMutation.mutate()}
            disabled={busy}
            className="bg-sky-600 hover:bg-sky-500"
          >
            {linkMutation.isPending ? 'Generando enlace...' : 'Vincular Telegram'}
          </Button>
          <p className="text-xs text-zinc-500">
            Se abre el chat del bot de Rifando en Telegram. Tocá <span className="font-medium">Iniciar</span> y listo.
          </p>
        </div>
      )}
    </div>
  );
}
