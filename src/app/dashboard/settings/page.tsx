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
import { TelegramCard } from '@/components/settings/TelegramCard';
import { MercadoPagoCard } from '@/components/settings/MercadoPagoCard';
import { UsernameField } from '@/components/settings/UsernameField';
import type { User } from '@/types';
import { maskCuitInput, validateAliasOrCbu, validateCuit } from '@/lib/transfer';

const schema = z
  .object({
    display_name: z.string().trim().min(1, 'El nombre completo es obligatorio').max(100),
    whatsapp_number: z.string().max(20).optional(),
    profile_public: z.boolean(),
    transfer_alias: z.string().trim().max(30).optional(),
    transfer_holder: z.string().trim().max(150).optional(),
    transfer_cuit: z.string().trim().max(20).optional(),
    transfer_bank: z.string().trim().max(100).optional(),
  })
  .superRefine((data, ctx) => {
    // Los datos de transferencia se cargan completos o no se cargan.
    if (!data.transfer_alias) return;
    const aliasError = validateAliasOrCbu(data.transfer_alias);
    if (aliasError) ctx.addIssue({ code: 'custom', path: ['transfer_alias'], message: aliasError });
    if (!data.transfer_holder) ctx.addIssue({ code: 'custom', path: ['transfer_holder'], message: 'El titular es obligatorio' });
    if (!data.transfer_bank) ctx.addIssue({ code: 'custom', path: ['transfer_bank'], message: 'La entidad bancaria es obligatoria' });
    if (!data.transfer_cuit) {
      ctx.addIssue({ code: 'custom', path: ['transfer_cuit'], message: 'El CUIT/CUIL es obligatorio' });
    } else {
      const cuitError = validateCuit(data.transfer_cuit);
      if (cuitError) ctx.addIssue({ code: 'custom', path: ['transfer_cuit'], message: cuitError });
    }
  });
type FormData = z.infer<typeof schema>;

export default function SettingsPage() {
  useEffect(() => { document.title = 'Rifando — Mis datos'; }, []);
  const { user, setUser } = useAuthStore();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      display_name: user?.display_name ?? '',
      whatsapp_number: user?.whatsapp_number ?? '',
      profile_public: user?.profile_public ?? true,
      transfer_alias: user?.transfer_alias ?? '',
      transfer_holder: user?.transfer_holder ?? '',
      transfer_cuit: user?.transfer_cuit ?? '',
      transfer_bank: user?.transfer_bank ?? '',
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        display_name: user.display_name ?? '',
        whatsapp_number: user.whatsapp_number ?? '',
        profile_public: user.profile_public,
        transfer_alias: user.transfer_alias ?? '',
        transfer_holder: user.transfer_holder ?? '',
        transfer_cuit: user.transfer_cuit ?? '',
        transfer_bank: user.transfer_bank ?? '',
      });
    }
  }, [user, reset]);

  // CUIT/CUIL: solo dígitos, con guiones automáticos.
  const cuitField = register('transfer_cuit');

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
        <h1 className="text-2xl font-bold text-zinc-50">Mis datos</h1>
        <p className="text-sm text-zinc-400 mt-1">Tu perfil, tus datos para cobrar y tus notificaciones</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-zinc-100">Perfil</h2>

          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={user?.email ?? ''} disabled className="bg-zinc-950 border-zinc-700 opacity-60" />
          </div>

          <UsernameField />

          <div className="space-y-1.5">
            <Label>Nombre completo *</Label>
            <Input {...register('display_name')} className="bg-zinc-950 border-zinc-700" placeholder="Juan Pérez" />
            {errors.display_name && <p className="text-xs text-red-400">{errors.display_name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>WhatsApp</Label>
            <div className="flex">
              <span className="flex items-center px-3 rounded-l-lg border border-r-0 border-zinc-700 bg-zinc-800 text-zinc-400 text-sm select-none">
                +54
              </span>
              <Input
                {...register('whatsapp_number')}
                className="bg-zinc-950 border-zinc-700 rounded-l-none"
                placeholder="9 11 1234 5678"
              />
            </div>
            <p className="text-xs text-zinc-500">Solo ingresá el número sin el 54. Los compradores te contactarán a este número.</p>
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

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
          <div>
            <h2 className="font-semibold text-zinc-100">Datos de transferencia</h2>
            <p className="text-xs text-zinc-500 mt-1">
              Completá los cuatro campos. Los compradores verán estos datos al confirmar su reserva.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Alias o CBU/CVU *</Label>
            <Input
              {...register('transfer_alias')}
              className="bg-zinc-950 border-zinc-700"
              placeholder="mi.alias.mp o 22 dígitos"
              maxLength={30}
            />
            {errors.transfer_alias ? (
              <p className="text-xs text-red-400">{errors.transfer_alias.message}</p>
            ) : (
              <p className="text-xs text-zinc-500">Alias: 6–20 caracteres (letras sin Ñ, números, puntos y guiones). CBU/CVU: 22 dígitos.</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Nombre del titular *</Label>
            <Input
              {...register('transfer_holder')}
              className="bg-zinc-950 border-zinc-700"
              placeholder="Juan Pérez"
            />
            {errors.transfer_holder && <p className="text-xs text-red-400">{errors.transfer_holder.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>CUIT / CUIL *</Label>
              <Input
                {...cuitField}
                onChange={(e) => {
                  const deleting = (e.nativeEvent as InputEvent).inputType?.startsWith('delete') ?? false;
                  e.target.value = maskCuitInput(e.target.value, deleting);
                  return cuitField.onChange(e);
                }}
                inputMode="numeric"
                autoComplete="off"
                maxLength={13}
                className="bg-zinc-950 border-zinc-700"
                placeholder="20-12345678-9"
              />
              {errors.transfer_cuit && <p className="text-xs text-red-400">{errors.transfer_cuit.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Banco / Billetera *</Label>
              <Input
                {...register('transfer_bank')}
                className="bg-zinc-950 border-zinc-700"
                placeholder="Mercado Pago"
              />
              {errors.transfer_bank && <p className="text-xs text-red-400">{errors.transfer_bank.message}</p>}
            </div>
          </div>
        </div>

        <Button type="submit" disabled={isSubmitting} className="bg-violet-600 hover:bg-violet-500">
          {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </form>

      <MercadoPagoCard />

      <TelegramCard />
    </div>
  );
}
