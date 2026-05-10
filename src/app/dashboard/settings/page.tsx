'use client';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, ApiError } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import type { User } from '@/types';

const schema = z.object({
  display_name: z.string().max(100).optional(),
  whatsapp_number: z.string().max(20).optional(),
  profile_public: z.boolean(),
});
type FormData = z.infer<typeof schema>;

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      display_name: user?.display_name ?? '',
      whatsapp_number: user?.whatsapp_number ?? '',
      profile_public: user?.profile_public ?? true,
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        display_name: user.display_name ?? '',
        whatsapp_number: user.whatsapp_number ?? '',
        profile_public: user.profile_public,
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      const res = await api.patch<{ user: User }>('/api/users/profile', data);
      setUser({ ...user!, ...res.user });
      toast.success('Perfil actualizado');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Error al guardar');
    }
  };

  return (
    <div className="max-w-xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-50">Configuración</h1>
        <p className="text-sm text-zinc-400 mt-1">Gestioná tu perfil y preferencias</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-zinc-100">Perfil</h2>

          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={user?.email ?? ''} disabled className="bg-zinc-950 border-zinc-700 opacity-60" />
          </div>

          <div className="space-y-1.5">
            <Label>Nombre de usuario</Label>
            <Input value={user?.username ?? ''} disabled className="bg-zinc-950 border-zinc-700 opacity-60" />
          </div>

          <div className="space-y-1.5">
            <Label>Nombre para mostrar</Label>
            <Input {...register('display_name')} className="bg-zinc-950 border-zinc-700" placeholder="Juan Pérez" />
          </div>

          <div className="space-y-1.5">
            <Label>WhatsApp (con código de país)</Label>
            <Input {...register('whatsapp_number')} className="bg-zinc-950 border-zinc-700" placeholder="+5491112345678" />
            <p className="text-xs text-zinc-500">Los compradores te contactarán a este número.</p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="profile_public"
              {...register('profile_public')}
              className="h-4 w-4 accent-violet-500"
            />
            <Label htmlFor="profile_public" className="cursor-pointer">
              Perfil público (tus rifas aparecen en <code className="text-xs bg-zinc-800 px-1 rounded">/{user?.username}</code>)
            </Label>
          </div>
        </div>

        <Button type="submit" disabled={isSubmitting} className="bg-violet-600 hover:bg-violet-500">
          {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </form>
    </div>
  );
}
