'use client';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Camera, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { api, ApiError } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import type { User } from '@/types';

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Foto de perfil: se sube a Cloudinary y se guarda al instante. */
export function AvatarField() {
  const { user, setUser } = useAuthStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);

  if (!user) return null;
  const name = user.display_name || user.username;

  const save = async (avatarUrl: string | null) => {
    const res = await api.patch<{ user: User }>('/api/users/profile', { avatar_url: avatarUrl });
    setUser({ ...user, ...res.user });
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('Elegí una imagen');
    if (file.size > MAX_AVATAR_BYTES) return toast.error('La imagen supera los 5 MB');
    setSaving(true);
    try {
      const { url } = await api.post<{ url: string }>('/api/upload/image', {
        data: await toBase64(file),
        folder: 'avatars',
      });
      await save(url);
      toast.success('Foto actualizada');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'No se pudo subir la foto');
    } finally {
      setSaving(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const onRemove = async () => {
    setSaving(true);
    try {
      await save(null);
      toast.success('Foto quitada');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'No se pudo quitar la foto');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <Label>Foto de perfil</Label>
      <div className="flex items-center gap-4">
        <UserAvatar name={name} src={user.avatar_url} className="h-16 w-16 text-lg" />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={saving}
            onClick={() => inputRef.current?.click()}
            className="gap-1.5 border-zinc-700"
          >
            <Camera className="h-4 w-4" />
            {saving ? 'Guardando...' : user.avatar_url ? 'Cambiar foto' : 'Subir foto'}
          </Button>
          {user.avatar_url && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={saving}
              onClick={onRemove}
              className="gap-1.5 text-zinc-400 hover:text-red-400"
            >
              <Trash2 className="h-4 w-4" /> Quitar
            </Button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
      </div>
      <p className="text-xs text-zinc-500">Se muestra en el menú superior. JPG o PNG, hasta 5 MB.</p>
    </div>
  );
}
