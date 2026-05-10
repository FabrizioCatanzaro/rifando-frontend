'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Trash2, Share2, ClipboardCheck, FileSpreadsheet, FileText, Search, Copy, Check } from 'lucide-react';
import { formatCurrency, formatPercent, formatDate } from '@/lib/utils';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import type { Raffle, RaffleNumber } from '@/types';

interface RaffleCardProps {
  raffle: Raffle;
  username: string;
  onDelete?: (id: string) => void;
}

const STATUS_LABEL: Record<Raffle['status'], string> = {
  draft: 'Borrador',
  active: 'Activa',
  finished: 'Finalizada',
};

const STATUS_VARIANT: Record<Raffle['status'], 'secondary' | 'default' | 'outline'> = {
  draft: 'secondary',
  active: 'default',
  finished: 'outline',
};

export function RaffleCard({ raffle, username, onDelete }: RaffleCardProps) {
  const sold = raffle.stats?.sold ?? 0;
  const reserved = raffle.stats?.reserved ?? 0;
  const percent = formatPercent(sold, raffle.total_numbers);
  const publicUrl = `/${username}/${raffle.slug}`;
  const isPublished = raffle.status !== 'draft';

  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const handleShare = async () => {
    const url = `${window.location.origin}${publicUrl}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: raffle.title, url });
      } catch {
        // user cancelled share
      }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Enlace copiado al portapapeles');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const { numbers } = await api.get<{ numbers: RaffleNumber[] }>(
        `/api/raffles/${raffle.id}/numbers`
      );

      const wb = XLSX.utils.book_new();

      // Sheet 1: Resumen
      const resumen = [
        ['Rifa', raffle.title],
        ['Estado', STATUS_LABEL[raffle.status]],
        ['Precio por número', raffle.price_per_number],
        ['Total números', raffle.total_numbers],
        ['Vendidos', sold],
        ['Reservados', reserved],
        ['Disponibles', raffle.total_numbers - sold - reserved],
        ['Recaudado ($)', sold * raffle.price_per_number],
        ...(raffle.draw_date ? [['Fecha sorteo', formatDate(raffle.draw_date)]] : []),
        ...(raffle.winner_number !== null ? [['Número ganador', raffle.winner_number]] : []),
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(resumen), 'Resumen');

      // Sheet 2: Números
      const header = ['Número', 'Estado', 'Comprador'];
      const rows = numbers.map((n) => [
        n.number,
        n.status === 'sold' ? 'Vendido' : n.status === 'reserved' ? 'Reservado' : 'Disponible',
        n.buyer_name ?? '',
      ]);
      const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
      ws['!cols'] = [{ wch: 10 }, { wch: 12 }, { wch: 30 }];
      XLSX.utils.book_append_sheet(wb, ws, 'Números');

      // Sheet 3: Compradores (sold only, grouped)
      const soldNumbers = numbers.filter((n) => n.status === 'sold' && n.buyer_name);
      const buyerMap = new Map<string, number[]>();
      for (const n of soldNumbers) {
        const name = n.buyer_name!;
        if (!buyerMap.has(name)) buyerMap.set(name, []);
        buyerMap.get(name)!.push(n.number);
      }
      const buyerHeader = ['Comprador', 'Números', 'Cantidad', 'Total ($)'];
      const buyerRows = Array.from(buyerMap.entries()).map(([name, nums]) => [
        name,
        nums.sort((a, b) => a - b).join(', '),
        nums.length,
        nums.length * raffle.price_per_number,
      ]);
      const wsB = XLSX.utils.aoa_to_sheet([buyerHeader, ...buyerRows]);
      wsB['!cols'] = [{ wch: 30 }, { wch: 40 }, { wch: 10 }, { wch: 14 }];
      XLSX.utils.book_append_sheet(wb, wsB, 'Compradores');

      const fileName = `${raffle.title.replace(/\s+/g, '_').toLowerCase()}_rifando.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch {
      toast.error('Error al exportar');
    } finally {
      setExporting(false);
    }
  };

  const handlePdf = async () => {
    setPdfLoading(true);
    try {
      const [{ prizes }, QRCode, { pdf }, { createElement }] = await Promise.all([
        api.get<{ prizes: import('@/types').Prize[] }>(`/api/raffles/${raffle.id}/prizes`),
        import('qrcode'),
        import('@react-pdf/renderer').then((m) => ({ pdf: m.pdf })),
        import('react').then((m) => ({ createElement: m.createElement })),
      ]);

      const qrDataUrl = await QRCode.default.toDataURL(
        `${window.location.origin}/${username}/${raffle.slug}`,
        { width: 200, margin: 1, color: { dark: '#09090B', light: '#FFFFFF' } }
      );

      const { RafflePDFDocument } = await import('./RafflePDF');
      const doc = createElement(RafflePDFDocument, { raffle, prizes, qrDataUrl, username });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const blob = await pdf(doc as any).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${raffle.title}_rifando.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      toast.error('Error al generar el PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant={STATUS_VARIANT[raffle.status]}>{STATUS_LABEL[raffle.status]}</Badge>
            {raffle.visibility === 'private' && (
              <Badge variant="outline" className="text-xs">Privada</Badge>
            )}
          </div>
          <h3 className="font-semibold text-zinc-100 truncate">{raffle.title}</h3>
          <p className="text-sm text-zinc-400 mt-0.5">
            {formatCurrency(raffle.price_per_number)} por número
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger className="shrink-0 -mr-1 flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors">
            <MoreVertical className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="text-red-400 focus:text-red-400"
              onClick={() => onDelete?.(raffle.id)}
            >
              <Trash2 className="h-4 w-4 mr-2" /> Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span>{sold} vendidos · {reserved} reservados</span>
          <span>{percent}%</span>
        </div>
        <Progress value={percent} className="h-1.5" />
        <p className="text-xs text-zinc-500">{raffle.total_numbers} números totales</p>
      </div>

      {raffle.draw_date && (
        <p className="text-xs text-zinc-500">
          Sorteo: <span className="text-zinc-400">{formatDate(raffle.draw_date)}</span>
        </p>
      )}

      {raffle.visibility === 'private' && raffle.access_code && (
        <div className="flex items-center justify-between bg-zinc-800/60 border border-zinc-700/50 rounded-lg px-3 py-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs text-zinc-500 shrink-0">Código de acceso</span>
            <span className="font-mono font-bold text-sm text-zinc-100 tracking-widest">{raffle.access_code}</span>
          </div>
          <button
            type="button"
            title="Copiar código"
            onClick={() => {
              navigator.clipboard.writeText(raffle.access_code!);
              setCopiedCode(true);
              toast.success('Código copiado');
              setTimeout(() => setCopiedCode(false), 2000);
            }}
            className="shrink-0 ml-2 p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700 transition-colors"
          >
            {copiedCode ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
      )}

      {/* Action buttons */}
      <div className="grid grid-cols-4 gap-1.5">
        <ActionBtn
          icon={copied ? <ClipboardCheck className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
          label="Compartir"
          onClick={handleShare}
          disabled={!isPublished}
          active={copied}
          title={!isPublished ? 'Publicá la rifa para compartirla' : 'Copiar enlace público'}
        />
        <ActionBtn
          icon={<Search className="h-4 w-4" />}
          label="Revisar"
          href={`/dashboard/raffles/${raffle.id}`}
          title="Ir al panel de la rifa"
        />
        <ActionBtn
          icon={<FileText className="h-4 w-4" />}
          label="PDF"
          onClick={handlePdf}
          loading={pdfLoading}
          title="Descargar PDF"
        />
        <ActionBtn
          icon={<FileSpreadsheet className="h-4 w-4" />}
          label="Exportar"
          onClick={handleExport}
          loading={exporting}
          title="Exportar a Excel"
        />
      </div>
    </div>
  );
}

// ── ActionBtn ─────────────────────────────────────────────────────────────────

function ActionBtn({
  icon,
  label,
  onClick,
  href,
  disabled,
  loading,
  active,
  title,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  loading?: boolean;
  active?: boolean;
  title?: string;
}) {
  const base =
    'flex flex-col items-center justify-center gap-1 py-2.5 rounded-lg text-[10px] font-medium transition-colors border';
  const enabled =
    'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100 cursor-pointer';
  const disabledCls =
    'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed';
  const activeCls =
    'bg-violet-600/20 border-violet-700/50 text-violet-400';

  if (href && !disabled) {
    return (
      <Link
        href={href}
        title={title}
        className={`${base} ${active ? activeCls : enabled}`}
      >
        {icon}
        <span>{label}</span>
      </Link>
    );
  }

  return (
    <button
      type="button"
      title={title}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${base} ${disabled ? disabledCls : active ? activeCls : enabled}`}
    >
      {loading ? <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" /> : icon}
      <span>{loading ? '...' : label}</span>
    </button>
  );
}
