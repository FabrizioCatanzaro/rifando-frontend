'use client';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { api, ApiError } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

const COOLDOWN_DAYS = 30;
const USERNAME_REGEX = /^[a-z0-9_-]{3,30}$/;

/** Fecha desde la que se puede volver a cambiar el nombre, o null si ya se puede. */
function nextChangeDate(changedAt: string | null | undefined): Date | null {
  if (!changedAt) return null;
  const date = new Date(changedAt);
  date.setDate(date.getDate() + COOLDOWN_DAYS);
  return date > new Date() ? date : null;
}

export function UsernameField() {
  const { user, setUser } = useAuthStore();
  const { confirm } = useConfirm();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const lockedUntil = nextChangeDate(user.username_changed_at);
  const valid = USERNAME_REGEX.test(value);
  const changed = value !== user.username;

  const save = async () => {
    if (!valid || !changed) return;
    const ok = await confirm({
      title: `¿Cambiar a @${value}?`,
      description:
        `Tus rifas pasan a estar en /${value}/…\n\n` +
        `Los links y QR que ya compartiste siguen funcionando: redirigen al nombre nuevo.\n\n` +
        `No vas a poder cambiarlo de nuevo durante ${COOLDOWN_DAYS} días.`,
      confirmLabel: 'Cambiar nombre',
    });
    if (!ok) return;

    setSaving(true);
    try {
      const res = await api.patch<{ username: string; username_changed_at: string }>('/api/users/username', {
        username: value,
      });
      setUser({ ...user, username: res.username, username_changed_at: res.username_changed_at });
      qc.invalidateQueries({ queryKey: ['raffles', 'mine'] });
      setEditing(false);
      toast.success(`Tu nombre de usuario ahora es @${res.username}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'No se pudo cambiar el nombre de usuario');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <Label>Nombre de usuario</Label>
      {editing ? (
        <>
          <div className="flex gap-2">
            <div className="flex flex-1">
              <span className="flex items-center px-3 rounded-l-lg border border-r-0 border-zinc-700 bg-zinc-800 text-zinc-400 text-sm select-none">
                @
              </span>
              <Input
                autoFocus
                value={value}
                onChange={(e) => setValue(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 30))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    save();
                  }
                  if (e.key === 'Escape') setEditing(false);
                }}
                className="bg-zinc-950 border-zinc-700 rounded-l-none"
              />
            </div>
            <Button type="button" onClick={save} disabled={!valid || !changed || saving} className="bg-violet-600 hover:bg-violet-500">
              {saving ? 'Guardando…' : 'Guardar'}
            </Button>
            <Button type="button" variant="outline" className="border-zinc-700" onClick={() => setEditing(false)}>
              Cancelar
            </Button>
          </div>
          <p className="text-xs text-zinc-500">
            {valid ? (
              <>
                Tus rifas quedan en <code className="text-zinc-300">/{value}/…</code>
              </>
            ) : (
              '3 a 30 caracteres: letras minúsculas, números, guiones y guiones bajos.'
            )}
          </p>
        </>
      ) : (
        <>
          <div className="flex gap-2">
            <Input value={`@${user.username}`} disabled className="bg-zinc-950 border-zinc-700 opacity-60" />
            <Button
              type="button"
              variant="outline"
              className="border-zinc-700 shrink-0"
              disabled={!!lockedUntil}
              onClick={() => {
                setValue(user.username);
                setEditing(true);
              }}
            >
              Cambiar
            </Button>
          </div>
          <p className="text-xs text-zinc-500">
            {lockedUntil
              ? `Podés volver a cambiarlo a partir del ${lockedUntil.toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}.`
              : `Aparece en el link de tus rifas. Podés cambiarlo una vez cada ${COOLDOWN_DAYS} días.`}
          </p>
        </>
      )}
    </div>
  );
}
