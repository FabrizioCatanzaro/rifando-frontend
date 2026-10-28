import { cn } from '@/lib/utils';

// Estado fijo de cada número para que el server y el cliente rendericen igual.
// s = vendido, r = reservado, a = disponible.
const PATTERN =
  'ssasrassasassaasrsasassasaarssasaassasrasasssaasasarsassasaasrsasaassasasrsaassasasaasrsasassasaasra';

const SOLD_ORDER = [...PATTERN].map((c, i) => (c === 'a' ? -1 : i)).filter((i) => i >= 0);

/** Grilla decorativa del hero: 100 números que se ocupan en secuencia al cargar. */
export function HeroGrid() {
  const soldCount = [...PATTERN].filter((c) => c === 's').length;

  return (
    <div className="relative mx-auto w-full max-w-md" aria-hidden>
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3 shadow-2xl shadow-violet-950/40 sm:p-4">
        <div className="mb-3 flex items-center justify-between px-1">
          <div>
            <p className="text-sm font-semibold text-zinc-100">Rifa moto 0 km</p>
            <p className="text-xs text-zinc-500">$2.000 por número</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold tabular-nums text-violet-300">{soldCount}/100</p>
            <p className="text-xs text-zinc-500">vendidos</p>
          </div>
        </div>

        <div className="grid grid-cols-10 gap-1 sm:gap-1.5">
          {[...PATTERN].map((state, i) => {
            const order = SOLD_ORDER.indexOf(i);
            return (
              <div
                key={i}
                style={order >= 0 ? { animationDelay: `${300 + order * 22}ms` } : undefined}
                className={cn(
                  'flex aspect-square items-center justify-center rounded-md text-[10px] font-medium tabular-nums sm:text-xs',
                  state === 'a' && 'border border-zinc-800 text-zinc-500',
                  state === 's' && 'cell-fill bg-violet-600 text-violet-50',
                  state === 'r' && 'cell-fill border border-amber-400/70 bg-amber-400/10 text-amber-200'
                )}
              >
                {String(i).padStart(2, '0')}
              </div>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 px-1 text-xs text-zinc-500">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-violet-600" /> Vendido</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm border border-amber-400/70" /> Reservado</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm border border-zinc-700" /> Disponible</span>
        </div>
      </div>

      <div
        className="cell-fill absolute -top-6 -right-2 rounded-xl border border-emerald-500/30 bg-zinc-950 px-3 py-2 text-xs shadow-xl sm:-right-8"
        style={{ animationDelay: '1700ms' }}
      >
        <p className="font-medium text-emerald-300">Pago acreditado</p>
        <p className="text-zinc-400">Lucía M. compró el 47 y el 48</p>
      </div>
    </div>
  );
}
