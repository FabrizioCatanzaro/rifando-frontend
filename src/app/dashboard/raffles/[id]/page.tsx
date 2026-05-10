'use client';
import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { LinkButton } from '@/components/ui/link-button';
import {
  useMyRaffles, useUpdateRaffle, useDeleteRaffle,
  usePrizes, useCreatePrize, useUpdatePrize, useDeletePrize,
  usePromotions, useCreatePromotion, useDeletePromotion,
} from '@/hooks/useRaffle';
import { useNumbers, useBulkSell, useBulkRelease } from '@/hooks/useNumbers';
import { useAuthStore } from '@/stores/authStore';
import { formatCurrency, formatPercent, formatDate } from '@/lib/utils';
import { api, ApiError } from '@/lib/api';
import { Plus, Trash2, ImagePlus, Lock, Copy, Search } from 'lucide-react';
import { RichTextEditor } from '@/components/raffle/RichTextEditor';
import type { Prize, Promotion } from '@/types';

const ICONS = ['🔒', '❌', '🎟️', '🏆', '💜', '✅', '🌟'];

const selectClass =
  'w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-violet-500';

function toBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

function generateCode() {
  return Math.random().toString(36).toUpperCase().slice(2, 8).padEnd(6, '0');
}

function todayInputValue() {
  return new Date().toISOString().slice(0, 16);
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="font-semibold text-zinc-100 mb-3">{children}</h2>;
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-zinc-300">{label}</Label>
      {children}
    </div>
  );
}

// ─── Edit form types ────────────────────────────────────────────────────────

interface EditForm {
  title: string;
  description: string;
  total_numbers: string;
  price_per_number: string;
  visibility: 'public' | 'private';
  access_code: string;
  draw_mode: 'all_sold' | 'fixed_date' | 'first_event';
  draw_date: string;
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function RaffleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const { data: rafflesData, isLoading: rafflesLoading } = useMyRaffles();
  const raffle = rafflesData?.raffles.find((r) => r.id === id);

  const { data: numbersData, isLoading: numbersLoading } = useNumbers(id);
  const { data: prizesData, isLoading: prizesLoading } = usePrizes(id);
  const { data: promosData } = usePromotions(id);

  const updateRaffle = useUpdateRaffle(id);
  const deleteRaffle = useDeleteRaffle();
  const bulkSell = useBulkSell(id);
  const bulkRelease = useBulkRelease(id);
  const createPrize = useCreatePrize(id);
  const updatePrize = useUpdatePrize(id);
  const deletePrize = useDeletePrize(id);
  const createPromotion = useCreatePromotion(id);
  const deletePromotion = useDeletePromotion(id);

  const [tab, setTab] = useState<'edit' | 'prizes' | 'numbers' | 'reservations' | 'buyers' | 'info' | 'finish'>('edit');
  const [infoContent, setInfoContent] = useState<Record<string, unknown> | null>(null);
  const [infoSaving, setInfoSaving] = useState(false);
  const [prizeWinners, setPrizeWinners] = useState<Record<string, string>>({});
  // Per-reservation editable name (keyed by buyer_name)
  const [reservationNames, setReservationNames] = useState<Record<string, string>>({});
  const [selectedIcon, setSelectedIcon] = useState('🔒');
  const [winnerNumber, setWinnerNumber] = useState('');

  // Multi-select admin numbers
  const [adminSelected, setAdminSelected] = useState<Set<number>>(new Set());
  const [bulkAction, setBulkAction] = useState<'sell' | 'release' | null>(null);
  const [bulkBuyerName, setBulkBuyerName] = useState('');
  const [adminSearchNum, setAdminSearchNum] = useState('');
  const [adminHighlighted, setAdminHighlighted] = useState<number | undefined>();

  // Prize state
  const [addingPrize, setAddingPrize] = useState(false);
  const [newPrizeTitle, setNewPrizeTitle] = useState('');
  const [newPrizeDesc, setNewPrizeDesc] = useState('');
  const [newPrizePreview, setNewPrizePreview] = useState<string | undefined>();
  const [editingPrize, setEditingPrize] = useState<string | null>(null);
  const [editPrizeTitle, setEditPrizeTitle] = useState('');
  const [editPrizeDesc, setEditPrizeDesc] = useState('');

  // New promo state
  const [addingPromo, setAddingPromo] = useState(false);
  const [newPromoType, setNewPromoType] = useState<'pack' | 'percentage' | 'bundle'>('pack');
  const [newPromoLabel, setNewPromoLabel] = useState('');
  const [newPromoQty, setNewPromoQty] = useState('3');
  const [newPromoPrice, setNewPromoPrice] = useState('');
  const [newPromoDiscount, setNewPromoDiscount] = useState('');
  const [newPromoFree, setNewPromoFree] = useState('');

  // Edit form
  const { register, handleSubmit, watch, setValue, reset } = useForm<EditForm>({
    defaultValues: {
      title: '',
      description: '',
      total_numbers: '',
      price_per_number: '',
      visibility: 'public',
      access_code: '',
      draw_mode: 'all_sold',
      draw_date: '',
    },
  });

  // Populate form once raffle loads
  useEffect(() => {
    if (raffle) {
      setSelectedIcon(raffle.cover_icon);
      setInfoContent(raffle.rich_content ?? null);
      reset({
        title: raffle.title,
        description: raffle.description ?? '',
        total_numbers: String(raffle.total_numbers),
        price_per_number: String(raffle.price_per_number),
        visibility: raffle.visibility,
        access_code: raffle.access_code ?? '',
        draw_mode: raffle.draw_mode,
        draw_date: raffle.draw_date ? raffle.draw_date.slice(0, 16) : '',
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raffle?.id]);

  const visibility = watch('visibility');
  const draw_mode = watch('draw_mode');
  const access_code = watch('access_code');
  const needsDate = draw_mode === 'fixed_date' || draw_mode === 'first_event';

  if (rafflesLoading) {
    return (
      <div className="max-w-2xl space-y-4">
        <Skeleton className="h-8 w-48 bg-zinc-900" />
        <Skeleton className="h-64 w-full rounded-xl bg-zinc-900" />
      </div>
    );
  }

  if (!raffle) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-zinc-400">Rifa no encontrada.</p>
        <LinkButton href="/dashboard/raffles" variant="outline">Volver a mis rifas</LinkButton>
      </div>
    );
  }

  const isPublished = raffle.status !== 'draft';
  const sold = raffle.stats?.sold ?? 0;
  const percent = formatPercent(sold, raffle.total_numbers);
  const publicUrl = `/${user?.username}/${raffle.slug}`;
  const prizes = prizesData?.prizes ?? [];
  const promotions = promosData?.promotions ?? [];

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSaveConfig = handleSubmit(async (data) => {
    try {
      await updateRaffle.mutateAsync({
        title: data.title,
        description: data.description || undefined,
        total_numbers: Number(data.total_numbers),
        price_per_number: Number(data.price_per_number),
        visibility: data.visibility,
        access_code: data.visibility === 'private' ? data.access_code : undefined,
        draw_mode: data.draw_mode,
        draw_date: needsDate && data.draw_date ? data.draw_date : undefined,
      } as never);
      toast.success('Cambios guardados');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Error al guardar');
    }
  });

  const handleIconChange = async (icon: string) => {
    setSelectedIcon(icon);
    try {
      await updateRaffle.mutateAsync({ cover_icon: icon });
    } catch {
      toast.error('Error al guardar el ícono');
    }
  };

  const handleStatusChange = async (status: 'draft' | 'active') => {
    if (status === 'active') {
      const confirmed = confirm(
        '¿Publicar esta rifa?\n\nUna vez publicada no podrás modificar el nombre, precio, cantidad de números ni otras opciones principales. Asegurate de que todo esté correcto antes de continuar.'
      );
      if (!confirmed) return;
    }
    try {
      await updateRaffle.mutateAsync({ status });
      toast.success(status === 'active' ? 'Rifa publicada' : 'Guardada como borrador');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Error al actualizar');
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Eliminar esta rifa? No se puede deshacer.')) return;
    try {
      await deleteRaffle.mutateAsync(id);
      router.push('/dashboard/raffles');
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const handleFinish = async () => {
    const sortedPrizes = [...prizes].sort((a, b) => a.position - b.position);
    const hasPrizes = sortedPrizes.length > 0;

    if (hasPrizes) {
      // Validate all prize winners
      for (const prize of sortedPrizes) {
        const val = parseInt(prizeWinners[prize.id] ?? '', 10);
        if (isNaN(val) || val < 0 || val >= raffle.total_numbers) {
          toast.error(`Ingresá un número válido para "${prize.title}"`);
          return;
        }
      }
      try {
        // Assign winner to each prize
        for (const prize of sortedPrizes) {
          await updatePrize.mutateAsync({
            prizeId: prize.id,
            data: { winner_number: parseInt(prizeWinners[prize.id], 10) },
          });
        }
        // Finish raffle using the 1st prize winner as the overall winner
        const overallWinner = parseInt(prizeWinners[sortedPrizes[0].id], 10);
        await api.post(`/api/raffles/${id}/finish`, { winner_number: overallWinner });
        toast.success('¡Rifa finalizada!');
        router.push('/dashboard/raffles');
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : 'Error al finalizar');
      }
    } else {
      const num = parseInt(winnerNumber, 10);
      if (isNaN(num) || num < 0 || num >= raffle.total_numbers) {
        toast.error('Número ganador inválido');
        return;
      }
      try {
        await api.post(`/api/raffles/${id}/finish`, { winner_number: num });
        toast.success('¡Rifa finalizada!');
        router.push('/dashboard/raffles');
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : 'Error al finalizar');
      }
    }
  };

  const toggleAdminNumber = (n: number) => {
    setAdminSelected((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });
  };

  const clearAdminSelection = () => {
    setAdminSelected(new Set());
    setBulkAction(null);
    setBulkBuyerName('');
  };

  const handleBulkSell = async () => {
    if (!bulkBuyerName.trim() || adminSelected.size === 0) return;
    try {
      await bulkSell.mutateAsync({ numbers: Array.from(adminSelected), buyer_name: bulkBuyerName.trim() });
      toast.success(`${adminSelected.size} número(s) marcados como vendidos`);
      clearAdminSelection();
    } catch {
      toast.error('Error al marcar como vendidos');
    }
  };

  const handleBulkRelease = async () => {
    if (adminSelected.size === 0) return;
    try {
      await bulkRelease.mutateAsync({ numbers: Array.from(adminSelected) });
      toast.success(`${adminSelected.size} número(s) liberados`);
      clearAdminSelection();
    } catch {
      toast.error('Error al liberar');
    }
  };

  const handleAddPrize = async () => {
    if (!newPrizeTitle.trim()) return;
    let image_url: string | undefined;
    if (newPrizePreview) {
      try {
        const res = await api.post<{ url: string }>('/api/upload/image', { data: newPrizePreview, folder: 'prizes' });
        image_url = res.url;
      } catch {
        toast.warning('No se pudo subir la imagen');
      }
    }
    try {
      await createPrize.mutateAsync({ title: newPrizeTitle.trim(), description: newPrizeDesc.trim() || undefined, image_url, position: prizes.length + 1 } as Prize);
      setAddingPrize(false);
      setNewPrizeTitle('');
      setNewPrizeDesc('');
      setNewPrizePreview(undefined);
      toast.success('Premio agregado');
    } catch {
      toast.error('Error al agregar premio');
    }
  };

  const handleUpdatePrize = async (prizeId: string) => {
    try {
      await updatePrize.mutateAsync({ prizeId, data: { title: editPrizeTitle.trim(), description: editPrizeDesc.trim() || undefined } as Partial<Prize> });
      setEditingPrize(null);
      toast.success('Premio actualizado');
    } catch {
      toast.error('Error al actualizar premio');
    }
  };

  const handleDeletePrize = async (prizeId: string) => {
    if (!confirm('¿Eliminar este premio?')) return;
    try {
      await deletePrize.mutateAsync(prizeId);
      toast.success('Premio eliminado');
    } catch {
      toast.error('Error al eliminar premio');
    }
  };

  const handleAddPromo = async () => {
    if (!newPromoLabel.trim() || !newPromoQty) return;
    const payload: Record<string, unknown> = {
      type: newPromoType,
      label: newPromoLabel.trim(),
      quantity: Number(newPromoQty),
    };
    if (newPromoType === 'pack') payload.price = Number(newPromoPrice);
    if (newPromoType === 'percentage') payload.discount_percentage = Number(newPromoDiscount);
    if (newPromoType === 'bundle') payload.free_numbers = Number(newPromoFree);
    try {
      await createPromotion.mutateAsync(payload as Partial<Promotion>);
      setAddingPromo(false);
      setNewPromoLabel('');
      setNewPromoQty('3');
      setNewPromoPrice('');
      setNewPromoDiscount('');
      setNewPromoFree('');
      toast.success('Promoción agregada');
    } catch {
      toast.error('Error al agregar promoción');
    }
  };

  const handleSaveInfo = async () => {
    setInfoSaving(true);
    try {
      await updateRaffle.mutateAsync({ rich_content: infoContent ?? undefined } as never);
      toast.success('Información guardada');
    } catch {
      toast.error('Error al guardar');
    } finally {
      setInfoSaving(false);
    }
  };

  const handleDeletePromo = async (promoId: string) => {
    if (!confirm('¿Eliminar esta promoción?')) return;
    try {
      await deletePromotion.mutateAsync(promoId);
      toast.success('Promoción eliminada');
    } catch {
      toast.error('Error al eliminar');
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <LinkButton href="/dashboard/raffles" variant="ghost" size="sm" className="text-zinc-500 -ml-2 mb-1">
            ← Mis rifas
          </LinkButton>
          <h1 className="text-xl font-bold text-zinc-50 truncate">{raffle.title}</h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            {formatCurrency(raffle.price_per_number)} por número · {raffle.total_numbers} números
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {raffle.status !== 'finished' && (
            raffle.status === 'draft' ? (
              <Button size="sm" className="bg-violet-600 hover:bg-violet-500" onClick={() => handleStatusChange('active')} disabled={updateRaffle.isPending}>
                Publicar
              </Button>
            ) : (
              <Button size="sm" variant="outline" className="border-zinc-700" onClick={() => handleStatusChange('draft')} disabled={updateRaffle.isPending}>
                Pausar
              </Button>
            )
          )}
          {raffle.status === 'draft' && (
            <LinkButton href={`/dashboard/raffles/${id}/preview`} size="sm" variant="outline" className="border-zinc-700">Vista previa</LinkButton>
          )}
          {raffle.status !== 'draft' && (
            <LinkButton href={publicUrl} size="sm" variant="secondary" target='_blank' rel='noopener noreferrer'>Ver pública</LinkButton>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 grid grid-cols-3 gap-4">
        <div><p className="text-xs text-zinc-500">Vendidos</p><p className="text-xl font-bold text-zinc-50">{sold}</p></div>
        <div><p className="text-xs text-zinc-500">Reservados</p><p className="text-xl font-bold text-zinc-50">{raffle.stats?.reserved ?? 0}</p></div>
        <div><p className="text-xs text-zinc-500">Recaudado</p><p className="text-xl font-bold text-zinc-50">{formatCurrency(sold * raffle.price_per_number)}</p></div>
        <div className="col-span-3">
          <div className="flex justify-between text-xs text-zinc-500 mb-1">
            <span>{percent}% vendido</span>
            {raffle.draw_date && <span>Sorteo: {formatDate(raffle.draw_date)}</span>}
          </div>
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${percent}%` }} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800 gap-1 overflow-x-auto">
        {([
          { key: 'edit', label: 'Configuración' },
          { key: 'prizes', label: `Premios${prizes.length > 0 ? ` (${prizes.length})` : ''}` },
          { key: 'numbers', label: 'Números' },
          { key: 'reservations', label: (() => { const c = (numbersData?.numbers ?? []).filter((n) => n.status === 'reserved').length; return `Reservas${c > 0 ? ` (${c})` : ''}`; })() },
          { key: 'buyers', label: (() => { const c = new Set((numbersData?.numbers ?? []).filter((n) => n.status === 'sold' && n.buyer_name).map((n) => n.buyer_name)).size; return `Compradores${c > 0 ? ` (${c})` : ''}`; })() },
          { key: 'info', label: 'Información' },
          { key: 'finish', label: 'Finalizar' },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              tab === key ? 'border-violet-500 text-violet-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab: Configuración ── */}
      {tab === 'edit' && (
        <div className="space-y-6">
          {isPublished && (
            <div className="flex items-center gap-2 bg-amber-950/30 border border-amber-700/40 rounded-xl px-4 py-3">
              <Lock className="h-4 w-4 text-amber-400 shrink-0" />
              <p className="text-sm text-amber-300">La rifa está publicada. La configuración no se puede editar.</p>
            </div>
          )}

          {/* ── Info & pricing ── */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
            <SectionTitle>Información básica</SectionTitle>

            {isPublished ? (
              <div className="space-y-3 text-sm">
                <InfoRow label="Título" value={raffle.title} />
                <InfoRow label="Descripción" value={raffle.description ?? '—'} />
                <InfoRow label="Números" value={String(raffle.total_numbers)} />
                <InfoRow label="Precio" value={formatCurrency(raffle.price_per_number) + ' por número'} />
              </div>
            ) : (
              <div className="space-y-4">
                <FieldRow label="Título *">
                  <Input {...register('title')} placeholder="Sorteo PS5 Edición Limitada" />
                </FieldRow>
                <FieldRow label="Descripción">
                  <textarea
                    {...register('description')}
                    rows={3}
                    maxLength={500}
                    className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-violet-500 resize-none"
                    placeholder="Contá de qué se trata tu rifa..."
                  />
                </FieldRow>
                <div className="grid grid-cols-2 gap-4">
                  <FieldRow label="Cantidad de números *">
                    <Input {...register('total_numbers')} type="number" min={11} max={10000} />
                  </FieldRow>
                  <FieldRow label="Precio por número *">
                    <Input {...register('price_per_number')} type="number" min={0} placeholder="$" />
                  </FieldRow>
                </div>
              </div>
            )}
          </div>

          {/* ── Visibility & draw ── */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
            <SectionTitle>Configuración del sorteo</SectionTitle>

            {isPublished ? (
              <div className="space-y-3 text-sm">
                <InfoRow label="Visibilidad" value={raffle.visibility === 'public' ? 'Pública' : 'Privada'} />
                {raffle.access_code && <InfoRow label="Código de acceso" value={raffle.access_code} mono />}
                <InfoRow
                  label="Modalidad"
                  value={
                    raffle.draw_mode === 'all_sold' ? 'Cuando se vendan todos' :
                    raffle.draw_mode === 'fixed_date' ? 'Fecha determinada' : 'Lo que ocurra primero'
                  }
                />
                {raffle.draw_date && <InfoRow label="Fecha del sorteo" value={formatDate(raffle.draw_date)} />}
              </div>
            ) : (
              <div className="space-y-4">
                <FieldRow label="Visibilidad">
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
                    <option value="private">Privada (con código)</option>
                  </select>
                </FieldRow>

                {visibility === 'private' && (
                  <FieldRow label="Código de acceso">
                    <div className="flex gap-2">
                      <Input
                        {...register('access_code')}
                        readOnly
                        maxLength={6}
                        className="uppercase tracking-widest font-mono bg-zinc-900 cursor-default"
                        placeholder="ABC123"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        className="shrink-0 text-zinc-400"
                        onClick={() => { navigator.clipboard.writeText(access_code); toast.success('Código copiado'); }}
                        disabled={!access_code}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">El código se genera automáticamente y no puede modificarse.</p>
                  </FieldRow>
                )}

                <FieldRow label="Modalidad del sorteo">
                  <select {...register('draw_mode')} className={selectClass}>
                    <option value="all_sold">Cuando se vendan todos los números</option>
                    <option value="fixed_date">En una fecha determinada</option>
                    <option value="first_event">Lo que ocurra primero</option>
                  </select>
                </FieldRow>

                {needsDate && (
                  <FieldRow label={draw_mode === 'fixed_date' ? 'Fecha del sorteo *' : 'Fecha límite'}>
                    <Input {...register('draw_date')} type="datetime-local" min={todayInputValue()} />
                  </FieldRow>
                )}
              </div>
            )}
          </div>

          {/* ── Icon ── */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-3">
            <SectionTitle>Ícono de números ocupados</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => handleIconChange(icon)}
                  className={`text-2xl p-2 rounded-lg border transition-colors ${
                    selectedIcon === icon ? 'border-violet-500 bg-violet-600/20' : 'border-zinc-700 bg-zinc-950 hover:border-zinc-500'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
            <p className="text-xs text-zinc-500">Siempre editable, incluso con la rifa publicada.</p>
          </div>

          {/* ── Promotions ── */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
            <SectionTitle>Promociones</SectionTitle>

            {isPublished && (
              <div className="flex items-center gap-2 text-xs text-amber-400 mb-2">
                <Lock className="h-3 w-3" /> No se pueden editar promociones con la rifa publicada.
              </div>
            )}

            {promotions.length === 0 && !addingPromo ? (
              <p className="text-sm text-zinc-500">No hay promociones configuradas.</p>
            ) : (
              <div className="space-y-2">
                {promotions.map((promo) => (
                  <div key={promo.id} className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-zinc-200">{promo.label}</p>
                      <p className="text-xs text-zinc-500">
                        {promo.type === 'pack' && `Pack: ${promo.quantity} números por ${formatCurrency(promo.price ?? 0)}`}
                        {promo.type === 'percentage' && `${promo.quantity} números con ${promo.discount_percentage}% OFF`}
                        {promo.type === 'bundle' && `Comprás ${promo.quantity}, llevás ${(promo.quantity ?? 0) + (promo.free_numbers ?? 0)}`}
                      </p>
                    </div>
                    {!isPublished && (
                      <button onClick={() => handleDeletePromo(promo.id)} className="text-zinc-500 hover:text-red-400 transition-colors ml-3">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {!isPublished && addingPromo && (
              <div className="bg-zinc-950 border border-violet-500/30 rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <FieldRow label="Tipo">
                    <select value={newPromoType} onChange={(e) => setNewPromoType(e.target.value as typeof newPromoType)} className={selectClass}>
                      <option value="pack">Pack (precio fijo)</option>
                      <option value="percentage">Descuento %</option>
                      <option value="bundle">Bundle (X por Y)</option>
                    </select>
                  </FieldRow>
                  <FieldRow label="Cantidad">
                    <Input value={newPromoQty} onChange={(e) => setNewPromoQty(e.target.value)} type="number" min={2} placeholder="3" />
                  </FieldRow>
                </div>
                {newPromoType === 'pack' && (
                  <FieldRow label="Precio del pack ($)">
                    <Input value={newPromoPrice} onChange={(e) => setNewPromoPrice(e.target.value)} type="number" min={0} placeholder="5000" />
                  </FieldRow>
                )}
                {newPromoType === 'percentage' && (
                  <FieldRow label="Descuento (%)">
                    <Input value={newPromoDiscount} onChange={(e) => setNewPromoDiscount(e.target.value)} type="number" min={1} max={99} placeholder="10" />
                  </FieldRow>
                )}
                {newPromoType === 'bundle' && (
                  <FieldRow label="Números gratis">
                    <Input value={newPromoFree} onChange={(e) => setNewPromoFree(e.target.value)} type="number" min={1} placeholder="1" />
                  </FieldRow>
                )}
                <FieldRow label="Etiqueta visible para el comprador">
                  <Input
                    value={newPromoLabel}
                    onChange={(e) => setNewPromoLabel(e.target.value)}
                    placeholder={newPromoType === 'pack' ? '3 números por $5.000' : newPromoType === 'percentage' ? '3 números con 10% OFF' : '3x2'}
                  />
                </FieldRow>
                <div className="flex gap-2">
                  <Button size="sm" className="bg-violet-600 hover:bg-violet-500" onClick={handleAddPromo} disabled={!newPromoLabel.trim() || createPromotion.isPending}>
                    Guardar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setAddingPromo(false); setNewPromoLabel(''); }}>
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            {!isPublished && !addingPromo && (
              <button
                onClick={() => setAddingPromo(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-zinc-700 rounded-xl text-sm text-zinc-500 hover:border-violet-500 hover:text-violet-400 transition-colors"
              >
                <Plus className="h-4 w-4" /> Agregar promoción
              </button>
            )}
          </div>

          {/* ── Save / Actions ── */}
          {!isPublished && (
            <div className="flex gap-3">
              <Button
                onClick={handleSaveConfig}
                className="bg-violet-600 hover:bg-violet-500 flex-1"
                disabled={updateRaffle.isPending}
              >
                {updateRaffle.isPending ? 'Guardando...' : 'Guardar cambios'}
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleteRaffle.isPending}>
                Eliminar
              </Button>
            </div>
          )}
          {isPublished && (
            <div className="flex gap-2">
              <LinkButton href={publicUrl} variant="outline" className="border-zinc-700">Ver pública</LinkButton>
              <Button variant="destructive" onClick={handleDelete} disabled={deleteRaffle.isPending}>Eliminar rifa</Button>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Premios ── */}
      {tab === 'prizes' && (
        <div className="space-y-4">
          {isPublished && (
            <div className="flex items-center gap-2 bg-amber-950/30 border border-amber-700/40 rounded-xl px-4 py-3">
              <Lock className="h-4 w-4 text-amber-400 shrink-0" />
              <p className="text-sm text-amber-300">La rifa está publicada. Los premios no se pueden modificar.</p>
            </div>
          )}

          {prizesLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl bg-zinc-900" />)}
            </div>
          ) : prizes.length === 0 && !addingPrize ? (
            <div className="text-center py-12 text-zinc-500">
              <p className="text-4xl mb-3">🏆</p>
              <p>No hay premios cargados.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {prizes.sort((a, b) => a.position - b.position).map((prize, idx) => (
                <div key={prize.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                  {prize.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={prize.image_url} alt={prize.title} className="w-full aspect-square object-contain bg-zinc-800" />
                  )}
                  <div className="p-4">
                    {editingPrize === prize.id ? (
                      <div className="space-y-3">
                        <Input value={editPrizeTitle} onChange={(e) => setEditPrizeTitle(e.target.value)} maxLength={40} placeholder="Título" className="bg-zinc-950 border-zinc-700" />
                        <textarea value={editPrizeDesc} onChange={(e) => setEditPrizeDesc(e.target.value)} rows={2} maxLength={100} placeholder="Descripción..." className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-violet-500 resize-none" />
                        <div className="flex gap-2">
                          <Button size="sm" className="bg-violet-600 hover:bg-violet-500" onClick={() => handleUpdatePrize(prize.id)} disabled={updatePrize.isPending}>Guardar</Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingPrize(null)}>Cancelar</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs text-zinc-500 mb-0.5">{idx === 0 ? '🥇 1er premio' : idx === 1 ? '🥈 2do premio' : idx === 2 ? '🥉 3er premio' : `${idx + 1}° premio`}</p>
                          <p className="font-semibold text-zinc-100">{prize.title}</p>
                          {prize.description && <p className="text-sm text-zinc-400 mt-0.5">{prize.description}</p>}
                        </div>
                        {!isPublished && (
                          <div className="flex gap-1 shrink-0">
                            <button onClick={() => { setEditingPrize(prize.id); setEditPrizeTitle(prize.title); setEditPrizeDesc(prize.description ?? ''); }} className="p-1.5 text-zinc-500 hover:text-zinc-200 transition-colors rounded">✏️</button>
                            <button onClick={() => handleDeletePrize(prize.id)} className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors rounded"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isPublished && addingPrize && (
            <div className="bg-zinc-900 border border-violet-500/30 rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-zinc-100">
                {prizes.length === 0 ? '🥇 1er premio' : prizes.length === 1 ? '🥈 2do premio' : prizes.length === 2 ? '🥉 3er premio' : `${prizes.length + 1}° premio`}
              </p>
              {newPrizePreview ? (
                <div className="relative group w-full aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={newPrizePreview} alt="Preview" className="w-full aspect-square object-contain bg-zinc-800 rounded-lg" />
                  <button type="button" onClick={() => setNewPrizePreview(undefined)} className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-20 border border-dashed border-zinc-600 rounded-lg cursor-pointer hover:border-violet-500 transition-colors">
                  <ImagePlus className="h-5 w-5 text-zinc-500" />
                  <span className="text-xs text-zinc-500 mt-1">Subir imagen (opcional)</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
                    if (!ALLOWED.includes(f.type)) { toast.error('Formato no permitido. Usá JPG, PNG o WebP.'); return; }
                    if (f.size > 5 * 1024 * 1024) { toast.error('La imagen no puede superar 5 MB.'); return; }
                    setNewPrizePreview(await toBase64(f));
                  }} />
                </label>
              )}
              <Input value={newPrizeTitle} onChange={(e) => setNewPrizeTitle(e.target.value)} maxLength={40} placeholder="Título del premio *" className="bg-zinc-950 border-zinc-700" />
              <textarea value={newPrizeDesc} onChange={(e) => setNewPrizeDesc(e.target.value)} rows={2} maxLength={100} placeholder="Descripción (opcional)" className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-violet-500 resize-none" />
              <div className="flex gap-2">
                <Button size="sm" className="bg-violet-600 hover:bg-violet-500" onClick={handleAddPrize} disabled={!newPrizeTitle.trim() || createPrize.isPending}>Guardar premio</Button>
                <Button size="sm" variant="ghost" onClick={() => { setAddingPrize(false); setNewPrizeTitle(''); setNewPrizeDesc(''); setNewPrizePreview(undefined); }}>Cancelar</Button>
              </div>
            </div>
          )}

          {!isPublished && !addingPrize && (
            <button onClick={() => setAddingPrize(true)} className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-zinc-700 rounded-xl text-sm text-zinc-500 hover:border-violet-500 hover:text-violet-400 transition-colors">
              <Plus className="h-4 w-4" /> Agregar premio
            </button>
          )}
        </div>
      )}

      {/* ── Tab: Números ── */}
      {tab === 'numbers' && (
        <div className="space-y-4">
          {/* Bulk action bar */}
          {adminSelected.size > 0 && (
            <div className="bg-zinc-900 border border-violet-500/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-zinc-100">
                  {adminSelected.size} número{adminSelected.size !== 1 ? 's' : ''} seleccionado{adminSelected.size !== 1 ? 's' : ''}
                </p>
                <button onClick={clearAdminSelection} className="text-xs text-zinc-500 hover:text-zinc-300">
                  Cancelar
                </button>
              </div>

              {bulkAction === 'sell' ? (
                <div className="flex gap-2">
                  <Input
                    value={bulkBuyerName}
                    onChange={(e) => setBulkBuyerName(e.target.value)}
                    placeholder="Nombre del comprador"
                    className="bg-zinc-950 border-zinc-700 flex-1"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleBulkSell()}
                  />
                  <Button onClick={handleBulkSell} className="bg-green-600 hover:bg-green-500 shrink-0" disabled={!bulkBuyerName.trim() || bulkSell.isPending}>
                    Confirmar venta
                  </Button>
                  <Button variant="ghost" onClick={() => setBulkAction(null)} className="shrink-0">Atrás</Button>
                </div>
              ) : (() => {
                const selNums = numbersData?.numbers.filter((n) => adminSelected.has(n.number)) ?? [];
                const anyAlreadySold = selNums.some((n) => n.status === 'sold');
                const allAvailable = selNums.every((n) => n.status === 'available');
                return (
                  <div className="flex gap-2 flex-wrap">
                    {!anyAlreadySold && (
                      <Button size="sm" className="bg-green-600 hover:bg-green-500" onClick={() => {
                        const names = [...new Set(selNums.map((n) => n.buyer_name).filter(Boolean))];
                        setBulkBuyerName(names.length === 1 ? (names[0] ?? '') : '');
                        setBulkAction('sell');
                      }}>
                        ✅ Marcar como vendidos
                      </Button>
                    )}
                    {!allAvailable && (
                      <Button size="sm" variant="outline" className="border-zinc-700" onClick={handleBulkRelease} disabled={bulkRelease.isPending}>
                        🔓 Liberar seleccionados
                      </Button>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          <p className="text-xs text-zinc-500">
            Hacé click para seleccionar números. Podés seleccionar varios y luego elegir la acción.
          </p>

          {/* Search */}
          {raffle && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
              <Input
                type="number"
                min={1}
                max={raffle.total_numbers}
                placeholder={`Buscar número (1–${raffle.total_numbers})`}
                value={adminSearchNum}
                onChange={(e) => {
                  const val = e.target.value;
                  setAdminSearchNum(val);
                  const n = parseInt(val, 10);
                  if (!isNaN(n) && n >= 1 && n <= raffle.total_numbers) {
                    setAdminHighlighted(n);
                    setTimeout(() => {
                      document.getElementById(`admin-num-${n}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 50);
                  } else {
                    setAdminHighlighted(undefined);
                  }
                }}
                className="pl-9 bg-zinc-900 border-zinc-700 placeholder:text-zinc-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          )}

          <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
            {numbersLoading
              ? Array.from({ length: 30 }).map((_, i) => <div key={i} className="aspect-square rounded-lg bg-zinc-800 animate-pulse" />)
              : numbersData?.numbers.map((n) => {
                  const isSelected = adminSelected.has(n.number);
                  const isHighlighted = n.number === adminHighlighted;
                  const isSold = n.status === 'sold';
                  const isReserved = n.status === 'reserved';
                  const isAvail = n.status === 'available';
                  return (
                    <button
                      key={n.number}
                      id={`admin-num-${n.number}`}
                      title={n.buyer_name ? `${n.buyer_name}${isReserved ? ' (reservado)' : ''}` : undefined}
                      onClick={() => toggleAdminNumber(n.number)}
                      className={`flex items-center justify-center rounded-lg text-xs font-semibold w-full aspect-square min-h-[44px] transition-all ${
                        isHighlighted
                          ? 'ring-2 ring-white ring-offset-1 ring-offset-zinc-950 scale-110 z-10'
                          : ''
                      } ${
                        isSelected
                          ? 'bg-violet-600 border-2 border-violet-400 text-white scale-105'
                          : isAvail
                          ? 'bg-zinc-900 border border-zinc-700 text-zinc-300 hover:border-violet-500 hover:text-violet-400'
                          : isSold
                          ? 'bg-green-950/40 border border-green-700/50 text-green-400'
                          : 'bg-amber-950/40 border border-amber-700/50 text-amber-400'
                      }`}
                    >
                      {n.number}
                    </button>
                  );
                })}
          </div>

          <div className="flex gap-4 text-xs text-zinc-500 pt-1">
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-zinc-900 border border-zinc-700 inline-block" /> Disponible</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-green-950 border border-green-700/50 inline-block" /> Vendido</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-amber-950 border border-amber-700/50 inline-block" /> Reservado</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-violet-600 inline-block" /> Seleccionado</span>
          </div>
        </div>
      )}

      {/* ── Tab: Reservas ── */}
      {tab === 'reservations' && (() => {
        const reserved = (numbersData?.numbers ?? []).filter((n) => n.status === 'reserved');

        // Group by buyer_name (fall back to "Sin nombre" for anonymous reservations)
        const grouped = reserved.reduce<Record<string, typeof reserved>>((acc, n) => {
          const key = n.buyer_name ?? '—';
          if (!acc[key]) acc[key] = [];
          acc[key].push(n);
          return acc;
        }, {});

        const entries = Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));

        const handleAccept = async (originalName: string, nums: typeof reserved) => {
          const name = reservationNames[originalName] ?? originalName;
          if (!name.trim() || name === '—') return;
          try {
            await bulkSell.mutateAsync({ numbers: nums.map((n) => n.number), buyer_name: name.trim() });
            toast.success(`${nums.length} número${nums.length !== 1 ? 's' : ''} marcados como vendidos`);
          } catch {
            toast.error('Error al aceptar la reserva');
          }
        };

        const handleReject = async (nums: typeof reserved) => {
          if (!confirm(`¿Liberar ${nums.length} número${nums.length !== 1 ? 's' : ''}?`)) return;
          try {
            await bulkRelease.mutateAsync({ numbers: nums.map((n) => n.number) });
            toast.success('Reserva liberada');
          } catch {
            toast.error('Error al liberar');
          }
        };

        return (
          <div className="space-y-3">
            {entries.length === 0 ? (
              <div className="text-center py-16 text-zinc-500">
                <p className="text-3xl mb-3">⏳</p>
                <p>No hay reservas pendientes.</p>
                <p className="text-xs mt-1">Las reservas expiran a los 5 minutos si el comprador no confirma por WhatsApp.</p>
              </div>
            ) : (
              <>
                <p className="text-xs text-zinc-500">
                  Las reservas expiran automáticamente a los 5 minutos. Aceptalas para confirmarlas como ventas.
                </p>
                {entries.map(([buyerName, nums]) => {
                  const editedName = reservationNames[buyerName] ?? buyerName;
                  const isAnonymous = buyerName === '—';
                  const total = nums.length * raffle.price_per_number;
                  return (
                    <div key={buyerName} className="bg-zinc-900 border border-amber-700/30 rounded-xl p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-zinc-500 mb-1">Comprador</p>
                          <Input
                            value={isAnonymous ? '' : editedName}
                            onChange={(e) =>
                              setReservationNames((prev) => ({ ...prev, [buyerName]: e.target.value }))
                            }
                            placeholder={isAnonymous ? 'Sin nombre (reserva anónima)' : buyerName}
                            className="bg-zinc-950 border-zinc-700 h-8 text-sm"
                          />
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-zinc-500">Total</p>
                          <p className="font-semibold text-zinc-100">{formatCurrency(total)}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-zinc-500 mb-1.5">
                          {nums.length} número{nums.length !== 1 ? 's' : ''} reservado{nums.length !== 1 ? 's' : ''}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {nums.sort((a, b) => a.number - b.number).map((n) => (
                            <span
                              key={n.number}
                              className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-xs font-semibold bg-amber-950/40 border border-amber-700/50 text-amber-400"
                            >
                              {n.number}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-1">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-500 flex-1"
                          onClick={() => handleAccept(buyerName, nums)}
                          disabled={isAnonymous && !reservationNames[buyerName]?.trim() || bulkSell.isPending}
                        >
                          ✅ Aceptar y marcar como vendidos
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-zinc-700 text-zinc-400"
                          onClick={() => handleReject(nums)}
                          disabled={bulkRelease.isPending}
                        >
                          🗑 Rechazar
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        );
      })()}

      {/* ── Tab: Compradores ── */}
      {tab === 'buyers' && (() => {
        const withBuyer = (numbersData?.numbers ?? [])
          .filter((n) => n.buyer_name && n.status === 'sold')
          .sort((a, b) => a.number - b.number);

        // Group by buyer name
        const grouped = withBuyer.reduce<Record<string, typeof withBuyer>>((acc, n) => {
          const key = n.buyer_name!;
          if (!acc[key]) acc[key] = [];
          acc[key].push(n);
          return acc;
        }, {});

        const entries = Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));

        return (
          <div className="space-y-3">
            {entries.length === 0 ? (
              <div className="text-center py-16 text-zinc-500">
                <p className="text-3xl mb-3">👤</p>
                <p>Todavía no hay ventas confirmadas.</p>
                <p className="text-xs mt-1">Los números vendidos aparecerán aquí. Las reservas pendientes están en la solapa &apos;Reservas&apos;.</p>
              </div>
            ) : (
              entries.map(([buyerName, nums]) => {
                const total = nums.length * raffle.price_per_number;
                return (
                  <div key={buyerName} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-zinc-100">{buyerName}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {nums.length} número{nums.length !== 1 ? 's' : ''} · {formatCurrency(total)}
                        </p>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-950/40 text-green-400 border border-green-700/30 shrink-0 self-start">
                        {nums.length} vendido{nums.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {nums.map((n) => (
                        <span
                          key={n.number}
                          className={`inline-flex items-center justify-center w-10 h-10 rounded-lg text-xs font-semibold ${
                            n.status === 'sold'
                              ? 'bg-green-950/40 border border-green-700/50 text-green-400'
                              : 'bg-amber-950/40 border border-amber-700/50 text-amber-400'
                          }`}
                        >
                          {n.number}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        );
      })()}

      {/* ── Tab: Información ── */}
      {tab === 'info' && (
        <div className="space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
            <div>
              <h2 className="font-semibold text-zinc-100">Información de la rifa</h2>
              <p className="text-sm text-zinc-500 mt-0.5">
                Explicá las condiciones, métodos de entrega o cualquier detalle que el comprador deba conocer.
                Este texto se mostrará en la tab &quot;Información&quot; de la página pública.
              </p>
            </div>
            <RichTextEditor
              content={infoContent}
              onChange={setInfoContent}
            />
            <Button
              onClick={handleSaveInfo}
              className="bg-violet-600 hover:bg-violet-500"
              disabled={infoSaving}
            >
              {infoSaving ? 'Guardando...' : 'Guardar información'}
            </Button>
          </div>
        </div>
      )}

      {/* ── Tab: Finalizar ── */}
      {tab === 'finish' && (
        <div className="space-y-4">
          {raffle.status === 'finished' ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center space-y-3">
              <p className="text-4xl">🏆</p>
              <p className="font-semibold text-zinc-100 text-lg">Rifa finalizada</p>
              {prizes.length > 0 ? (
                <div className="space-y-2 text-left mt-2">
                  {[...prizes].sort((a, b) => a.position - b.position).map((prize, idx) => (
                    <div key={prize.id} className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2">
                      <span className="text-sm text-zinc-400">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}°`} {prize.title}
                      </span>
                      {prize.winner_number !== null ? (
                        <span className="text-yellow-400 font-bold">#{prize.winner_number}</span>
                      ) : (
                        <span className="text-zinc-600 text-xs">Sin ganador</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : raffle.winner_number !== null && (
                <p className="text-zinc-400">Número ganador: <strong className="text-yellow-400">#{raffle.winner_number}</strong></p>
              )}
            </div>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-5">
              <div>
                <h2 className="font-semibold text-zinc-100">Finalizar rifa</h2>
                <p className="text-sm text-zinc-400 mt-0.5">
                  {prizes.length > 0
                    ? 'Ingresá el número ganador para cada premio. Esta acción no se puede deshacer.'
                    : 'Ingresá el número ganador para cerrar la rifa. Esta acción no se puede deshacer.'}
                </p>
              </div>

              {prizes.length > 0 ? (
                <div className="space-y-3">
                  {[...prizes].sort((a, b) => a.position - b.position).map((prize, idx) => (
                    <div key={prize.id} className="space-y-1.5">
                      <label className="text-sm text-zinc-300 flex items-center gap-1.5">
                        <span>{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}°`}</span>
                        <span className="font-medium">{prize.title}</span>
                      </label>
                      <Input
                        type="number"
                        value={prizeWinners[prize.id] ?? ''}
                        onChange={(e) => setPrizeWinners((prev) => ({ ...prev, [prize.id]: e.target.value }))}
                        placeholder={`Número ganador (0 – ${raffle.total_numbers - 1})`}
                        className="bg-zinc-950 border-zinc-700"
                        min={0}
                        max={raffle.total_numbers - 1}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <Input
                  type="number"
                  value={winnerNumber}
                  onChange={(e) => setWinnerNumber(e.target.value)}
                  placeholder={`0 – ${raffle.total_numbers - 1}`}
                  className="bg-zinc-950 border-zinc-700"
                  min={0}
                  max={raffle.total_numbers - 1}
                />
              )}

              <Button
                onClick={handleFinish}
                className="bg-yellow-600 hover:bg-yellow-500 text-white w-full"
                disabled={updatePrize.isPending}
              >
                🏆 {updatePrize.isPending ? 'Guardando ganadores...' : 'Finalizar rifa'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Helper component ─────────────────────────────────────────────────────────

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-zinc-500 shrink-0">{label}</span>
      <span className={`text-zinc-200 text-right ${mono ? 'font-mono tracking-widest' : ''}`}>{value}</span>
    </div>
  );
}
