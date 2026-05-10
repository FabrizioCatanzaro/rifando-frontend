'use client';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateRaffle } from '@/hooks/useRaffle';
import { ApiError, api } from '@/lib/api';
import { Copy, Check, Plus, Trash2, ImagePlus, Info } from 'lucide-react';

// ─── helpers ───────────────────────────────────────────────────────────────

function generateCode(): string {
  return Math.random().toString(36).toUpperCase().slice(2, 8).padEnd(6, '0');
}

function todayInputValue(): string {
  const d = new Date();
  return d.toISOString().slice(0, 16);
}

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── types ─────────────────────────────────────────────────────────────────

interface PrizeInput {
  title: string;
  description: string;
  imageFile?: File;
  imagePreview?: string;
}

interface PromotionInput {
  type: 'pack' | 'percentage' | 'bundle';
  label: string;
  quantity: string;
  price: string;
  discount_percentage: string;
  free_numbers: string;
}

interface FormData {
  title: string;
  description: string;
  total_numbers: string;
  price_per_number: string;
  visibility: 'public' | 'private';
  access_code: string;
  cover_icon: string;
  draw_mode: 'all_sold' | 'fixed_date' | 'first_event';
  draw_date: string;
  prizes: PrizeInput[];
  promotions: PromotionInput[];
}

const schema = z.object({
  title: z.string().min(3, 'Mínimo 3 caracteres').max(150),
  description: z.string().max(500).optional(),
  total_numbers: z.string().refine((v) => Number(v) >= 11 && Number(v) <= 10000, 'Entre 11 y 10000'),
  price_per_number: z.string().refine((v) => Number(v) >= 0, 'Precio inválido'),
  visibility: z.enum(['public', 'private']),
  access_code: z.string(),
  cover_icon: z.string().max(10),
  draw_mode: z.enum(['all_sold', 'fixed_date', 'first_event']),
  draw_date: z.string().optional(),
  prizes: z
    .array(
      z.object({
        title: z.string().min(1, 'Requerido').max(40, 'Máximo 40 caracteres'),
        description: z.string().max(100, 'Máximo 100 caracteres'),
        imageFile: z.any().optional(),
        imagePreview: z.string().optional(),
      })
    )
    .optional(),
  promotions: z
    .array(
      z.object({
        type: z.enum(['pack', 'percentage', 'bundle']),
        label: z.string().min(1, 'Requerido'),
        quantity: z.string(),
        price: z.string(),
        discount_percentage: z.string(),
        free_numbers: z.string(),
      })
    )
    .optional(),
});

const ICONS = ['🔒', '❌', '🎟️', '🏆', '💜', '✅', '🌟'];

// ─── component ─────────────────────────────────────────────────────────────

export default function NewRafflePage() {
  const router = useRouter();
  const createRaffle = useCreateRaffle();
  const [copiedCode, setCopiedCode] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as never,
    defaultValues: {
      visibility: 'public',
      cover_icon: '🔒',
      draw_mode: 'all_sold',
      total_numbers: '100',
      price_per_number: '1000',
      access_code: '',
      prizes: [],
      promotions: [],
    },
  });

  const { fields: prizeFields, append: appendPrize, remove: removePrize } = useFieldArray({
    control,
    name: 'prizes',
  });

  const { fields: promoFields, append: appendPromo, remove: removePromo } = useFieldArray({
    control,
    name: 'promotions',
  });

  const visibility = watch('visibility');
  const draw_mode = watch('draw_mode');
  const cover_icon = watch('cover_icon');
  const access_code = watch('access_code');
  const prizes = watch('prizes') ?? [];
  const promotions = watch('promotions') ?? [];

  const handleCopyCode = useCallback(() => {
    if (!access_code) return;
    navigator.clipboard.writeText(access_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }, [access_code]);

  const handleImagePick = useCallback(
    async (index: number, file: File) => {
      const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
      if (!ALLOWED.includes(file.type)) {
        toast.error('Formato no permitido. Usá JPG, PNG o WebP.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La imagen no puede superar 5 MB.');
        return;
      }
      const preview = await toBase64(file);
      setValue(`prizes.${index}.imagePreview`, preview);
      setValue(`prizes.${index}.imageFile`, file);
    },
    [setValue]
  );

  const needsDate = draw_mode === 'fixed_date' || draw_mode === 'first_event';

  const onSubmit = async (data: FormData) => {
    try {
      // 1. Upload prize images
      const prizePayloads = await Promise.all(
        (data.prizes ?? []).map(async (p, i) => {
          let image_url: string | undefined;
          if (p.imagePreview) {
            try {
              const res = await api.post<{ url: string }>('/api/upload/image', {
                data: p.imagePreview,
                folder: 'prizes',
              });
              image_url = res.url;
            } catch {
              toast.warning(`No se pudo subir la imagen del premio ${i + 1}`);
            }
          }
          return { title: p.title, description: p.description || undefined, image_url, position: i + 1 };
        })
      );

      // 2. Create raffle (always starts as draft)
      const res = await createRaffle.mutateAsync({
        title: data.title,
        description: data.description || undefined,
        total_numbers: Number(data.total_numbers),
        price_per_number: Number(data.price_per_number),
        status: 'draft',
        visibility: data.visibility,
        access_code: data.visibility === 'private' ? data.access_code : undefined,
        cover_icon: data.cover_icon,
        draw_mode: data.draw_mode,
        draw_date: needsDate && data.draw_date ? data.draw_date : undefined,
      } as never);

      const raffleId = res.raffle.id;

      // 3. Create prizes
      for (const prize of prizePayloads) {
        try {
          await api.post(`/api/raffles/${raffleId}/prizes`, prize);
        } catch {
          toast.warning(`No se pudo guardar el premio "${prize.title}"`);
        }
      }

      // 4. Create promotions
      for (const promo of (data.promotions ?? [])) {
        try {
          const payload: Record<string, unknown> = {
            type: promo.type,
            label: promo.label,
            quantity: Number(promo.quantity),
          };
          if (promo.type === 'pack') payload.price = Number(promo.price);
          if (promo.type === 'percentage') payload.discount_percentage = Number(promo.discount_percentage);
          if (promo.type === 'bundle') payload.free_numbers = Number(promo.free_numbers);
          await api.post(`/api/raffles/${raffleId}/promotions`, payload);
        } catch {
          toast.warning(`No se pudo guardar una promoción`);
        }
      }

      toast.success('Rifa creada en borrador', {
        description: 'Revisá la configuración y publicala cuando esté lista.',
        duration: 5000,
      });
      router.push(`/dashboard/raffles/${raffleId}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Error al crear la rifa');
    }
  };

  return (
    <div className="max-w-2xl space-y-8 pb-16">
      <div>
        <h1 className="text-2xl font-bold text-zinc-50">Nueva rifa</h1>
        <p className="text-sm text-zinc-400 mt-1">Configurá los detalles de tu rifa</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* ── Información básica ── */}
        <Section title="Información básica">
          <Field label="Título *" error={errors.title?.message}>
            <Input {...register('title')} placeholder="Ej: Sorteo PS5 Edición Limitada" />
          </Field>

          <Field label="Descripción">
            <textarea
              {...register('description')}
              rows={3}
              maxLength={500}
              className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-violet-500 resize-none"
              placeholder="Contá de qué se trata tu rifa..."
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Cantidad de números *" error={(errors as Record<string, { message?: string }>).total_numbers?.message}>
              <Input {...register('total_numbers')} type="number" min={11} max={10000} />
            </Field>
            <Field label="Precio por número *" error={(errors as Record<string, { message?: string }>).price_per_number?.message}>
              <Input {...register('price_per_number')} type="number" min={0} placeholder="$" />
            </Field>
          </div>
        </Section>

        {/* ── Configuración ── */}
        <Section title="Configuración">
          <Field label="Visibilidad">
            <select
              {...register('visibility')}
              onChange={(e) => {
                setValue('visibility', e.target.value as 'public' | 'private');
                if (e.target.value === 'private' && !access_code) {
                  setValue('access_code', generateCode());
                }
              }}
              className={selectClass}
            >
              <option value="public">Pública</option>
              <option value="private">Privada (con código de acceso)</option>
            </select>
          </Field>

          {/* Código de acceso auto-generado */}
          {visibility === 'private' && (
            <Field label="Código de acceso">
              <div className="flex gap-2">
                <Input
                  {...register('access_code')}
                  readOnly
                  maxLength={6}
                  className="uppercase tracking-widest font-mono text-lg bg-zinc-900 cursor-default"
                  placeholder="ABC123"
                />
                <Button
                  type="button"
                  variant="ghost"
                  className="shrink-0 text-zinc-400"
                  onClick={handleCopyCode}
                  disabled={!access_code}
                >
                  {copiedCode ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                Compartí este código con los compradores para que puedan acceder a la rifa.
              </p>
            </Field>
          )}

          {/* Modalidad del sorteo */}
          <Field label="Modalidad del sorteo">
            <select {...register('draw_mode')} className={selectClass}>
              <option value="all_sold">Cuando se vendan todos los números</option>
              <option value="fixed_date">En una fecha determinada</option>
              <option value="first_event">Lo que ocurra primero</option>
            </select>
          </Field>

          {/* Date picker condicional */}
          {needsDate && (
            <Field
              label={draw_mode === 'fixed_date' ? 'Fecha del sorteo *' : 'Fecha límite'}
              error={(errors as Record<string, { message?: string }>).draw_date?.message}
            >
              <Input
                {...register('draw_date')}
                type="datetime-local"
                min={todayInputValue()}
                className="w-full"
              />
              <p className="text-xs text-zinc-500 mt-1">
                {draw_mode === 'first_event'
                  ? 'El sorteo ocurrirá cuando se vendan todos los números o en esta fecha, lo que suceda primero.'
                  : 'El sorteo se realizará en esta fecha sin importar cuántos números se vendieron.'}
              </p>
            </Field>
          )}
        </Section>

        {/* ── Ícono de números ocupados ── */}
        <Section title="Ícono de números ocupados">
          {/* Hidden input so react-hook-form tracks the value through validation */}
          <input type="hidden" {...register('cover_icon')} />
          <div className="flex flex-wrap gap-2">
            {ICONS.map((icon) => (
              <button
                key={icon}
                type="button"
                onClick={() => setValue('cover_icon', icon, { shouldValidate: true })}
                className={`text-2xl p-2 rounded-lg border transition-colors ${
                  cover_icon === icon
                    ? 'border-violet-500 bg-violet-600/20'
                    : 'border-zinc-700 bg-zinc-950 hover:border-zinc-500'
                }`}
              >
                {icon}
              </button>
            ))}
          </div>
          <p className="text-xs text-zinc-500">Los números vendidos/reservados mostrarán este ícono en la grilla pública.</p>
        </Section>

        {/* ── Premios ── */}
        <Section title="Premios">
          <p className="text-sm text-zinc-400 -mt-1">
            Cada premio corresponde a un ganador. Podés cargar foto, título y descripción.
          </p>

          <div className="space-y-4">
            {prizeFields.map((field, index) => (
              <div key={field.id} className="bg-zinc-950 border border-zinc-700 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-zinc-300">
                    {index === 0 ? '🥇 1er premio' : index === 1 ? '🥈 2do premio' : index === 2 ? '🥉 3er premio' : `${index + 1}° premio`}
                  </span>
                  <button
                    type="button"
                    onClick={() => removePrize(index)}
                    className="text-zinc-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div>
                  {prizes[index]?.imagePreview ? (
                    <div className="relative group w-full aspect-square">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={prizes[index].imagePreview}
                        alt="Premio"
                        className="w-full aspect-square object-contain bg-zinc-800 rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setValue(`prizes.${index}.imagePreview`, undefined);
                          setValue(`prizes.${index}.imageFile`, undefined);
                        }}
                        className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-24 border border-dashed border-zinc-600 rounded-lg cursor-pointer hover:border-violet-500 transition-colors group">
                      <ImagePlus className="h-6 w-6 text-zinc-500 group-hover:text-violet-400 transition-colors" />
                      <span className="text-xs text-zinc-500 mt-1 group-hover:text-violet-400 transition-colors">
                        Subir foto del premio
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImagePick(index, file);
                        }}
                      />
                    </label>
                  )}
                </div>

                <Field label="Título del premio *" error={errors.prizes?.[index]?.title?.message}>
                  <Input
                    {...register(`prizes.${index}.title`)}
                    maxLength={40}
                    placeholder="Ej: iPhone 15 Pro"
                  />
                </Field>

                <Field label="Descripción (opcional)" error={errors.prizes?.[index]?.description?.message}>
                  <textarea
                    {...register(`prizes.${index}.description`)}
                    rows={2}
                    maxLength={100}
                    className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-violet-500 resize-none"
                    placeholder="Descripción breve del premio..."
                  />
                </Field>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            className="border-zinc-700 border-dashed w-full gap-2"
            onClick={() => appendPrize({ title: '', description: '' })}
          >
            <Plus className="h-4 w-4" /> Agregar premio
          </Button>

          {prizeFields.length === 0 && (
            <p className="text-xs text-zinc-500 text-center -mt-2">
              Podés agregar los premios ahora o más adelante desde el panel de la rifa.
            </p>
          )}
        </Section>

        {/* ── Promociones ── */}
        <Section title="Promociones">
          <p className="text-sm text-zinc-400 -mt-1">
            Ofrecé descuentos por cantidad para incentivar la compra de más números.
          </p>

          <div className="space-y-4">
            {promoFields.map((field, index) => {
              const type = promotions[index]?.type ?? 'pack';
              return (
                <div key={field.id} className="bg-zinc-950 border border-zinc-700 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-zinc-300">Promoción {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removePromo(index)}
                      className="text-zinc-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Tipo">
                      <select {...register(`promotions.${index}.type`)} className={selectClass}>
                        <option value="pack">Pack (precio fijo)</option>
                        <option value="percentage">Descuento %</option>
                        <option value="bundle">Bundle (X por Y)</option>
                      </select>
                    </Field>
                    <Field label="Cantidad de números">
                      <Input {...register(`promotions.${index}.quantity`)} type="number" min={2} placeholder="3" />
                    </Field>
                  </div>

                  {type === 'pack' && (
                    <Field label="Precio del pack ($)">
                      <Input {...register(`promotions.${index}.price`)} type="number" min={0} placeholder="Ej: 5000" />
                    </Field>
                  )}
                  {type === 'percentage' && (
                    <Field label="Porcentaje de descuento (%)">
                      <Input {...register(`promotions.${index}.discount_percentage`)} type="number" min={1} max={99} placeholder="Ej: 10" />
                    </Field>
                  )}
                  {type === 'bundle' && (
                    <Field label="Números gratis por el pack">
                      <Input {...register(`promotions.${index}.free_numbers`)} type="number" min={1} placeholder="Ej: 1 (pagás 2, llevás 3)" />
                    </Field>
                  )}

                  <Field label="Etiqueta visible">
                    <Input
                      {...register(`promotions.${index}.label`)}
                      placeholder={
                        type === 'pack' ? 'Ej: 3 números por $5.000' :
                        type === 'percentage' ? 'Ej: 3 números con 10% OFF' :
                        'Ej: 3x2'
                      }
                    />
                    <p className="text-xs text-zinc-500 mt-1">Texto que verá el comprador al seleccionar números.</p>
                  </Field>
                </div>
              );
            })}
          </div>

          <Button
            type="button"
            variant="outline"
            className="border-zinc-700 border-dashed w-full gap-2"
            onClick={() => appendPromo({ type: 'pack', label: '', quantity: '3', price: '', discount_percentage: '', free_numbers: '' })}
          >
            <Plus className="h-4 w-4" /> Agregar promoción
          </Button>

          {promoFields.length === 0 && (
            <p className="text-xs text-zinc-500 text-center -mt-2">
              Las promociones son opcionales. Podés agregarlas ahora o más adelante.
            </p>
          )}
        </Section>

        {/* ── Aviso borrador ── */}
        <div className="flex gap-3 items-start bg-violet-950/30 border border-violet-800/40 rounded-xl px-4 py-3">
          <Info className="h-4 w-4 text-violet-400 mt-0.5 shrink-0" />
          <p className="text-sm text-violet-300">
            La rifa se creará en <strong>modo borrador</strong>. Una vez que revisés todo, podés publicarla desde el panel de administración.
          </p>
        </div>

        {/* ── Acciones ── */}
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="border-zinc-700" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-violet-600 hover:bg-violet-500 flex-1"
          >
            {isSubmitting ? 'Creando rifa...' : 'Crear rifa'}
          </Button>
        </div>
      </form>
    </div>
  );
}

// ─── sub-components ────────────────────────────────────────────────────────

const selectClass =
  'w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-violet-500';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
      <h2 className="font-semibold text-zinc-100">{title}</h2>
      {children}
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-zinc-300">{label}</Label>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
