@AGENTS.md

# rifando-frontend

Frontend de Rifando. Contexto de producto en `../CLAUDE.md`.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript.
- Next 16 tiene cambios incompatibles. Lee `node_modules/next/dist/docs/` antes de usar una API de Next.
- Tailwind CSS 4 (config en `src/app/globals.css`, sin `tailwind.config`).
- shadcn con estilo `base-nova`. Los componentes usan `@base-ui/react`, no Radix.
- TanStack Query v5 para datos del servidor.
- Zustand para estado de cliente.
- react-hook-form + Zod v4 para formularios. La API usa Zod v3.
- Tiptap para texto enriquecido.
- `@react-pdf/renderer` y `xlsx` para exportar la grilla.
- framer-motion, sonner (toasts), lucide-react (íconos).

## Comandos

```bash
npm run dev    # next dev (puerto 3000)
npm run build  # next build
npm run lint   # eslint
```

Ejecuta `npm run lint` y `npm run build` antes de dar por terminada una tarea.

## Variables de entorno

- `NEXT_PUBLIC_API_URL` — URL de `rifando-api` (por defecto `http://localhost:4000`).
- `NEXT_PUBLIC_APP_URL` — URL pública del frontend.
- No leas `.env.local`. Usa `.env.local.example`.

## Rutas

| Ruta | Uso |
|---|---|
| `/` | Landing. |
| `/login`, `/register` | Grupo `(auth)`. |
| `/dashboard` | Inicio del rifante. |
| `/dashboard/raffles` | Mis rifas (tarjetas + "Nueva Rifa"). |
| `/dashboard/raffles/new` | Formulario de nueva rifa. |
| `/dashboard/raffles/[id]` | Panel de la rifa con solapas. |
| `/dashboard/raffles/[id]/preview` | Vista previa pública. |
| `/dashboard/settings` | Mis datos. |
| `/dashboard/admin` | Panel del admin (`user.is_admin`). |
| `/[username]` | Perfil público del rifante. |
| `/[username]/[slug]` | Página pública de la rifa (comprador). |
| `/contacto`, `/privacidad`, `/terminos` | Páginas estáticas. |

Cada ruta estática de primer nivel oculta un posible `/[username]`. Coordina con la API antes de agregar una.

## Estructura

```
src/
  app/                 # rutas App Router
  components/
    ui/                # componentes shadcn (base-nova)
    raffle/            # BuyerSheet, NumberGrid, NumberCell, RaffleCard, RafflePDF, RichText*
    settings/          # TelegramCard, MercadoPagoCard, UsernameField
    layout/, shared/
  hooks/               # useAuth, useRaffle, useNumbers (React Query)
  stores/              # authStore, selectionStore (Zustand)
  lib/
    api.ts             # cliente HTTP
    whatsapp.ts        # calculatePrice + link de WhatsApp
    exportGrid.ts, utils.ts
  types/index.ts       # tipos compartidos
```

## Convenciones

### Datos
- Llama a la API solo con `api` de `src/lib/api.ts`.
- `api` envía cookies (`credentials: 'include'`) y reintenta tras refrescar el token en un 401.
- Crea un hook en `src/hooks/` por cada recurso. Usa `useQuery` y `useMutation`.
- Invalida la query afectada en `onSuccess` de cada mutation. Para números usa `invalidateRaffleData` (grilla, compras y estadísticas).
- Usa claves de query con forma `['recurso', id]`. Ejemplo: `['numbers', raffleId]`.
- `useNumbers` refresca cada 15 s. Mantén ese polling en la grilla pública.
- Declara los tipos de respuesta en `src/types/index.ts`.

### Estado
- Guarda el usuario en `authStore`.
- Guarda la selección de números y el `sessionId` del comprador en `selectionStore`.
- `sessionId` se genera con `nanoid` en cada carga. Identifica al comprador ante la API.

### Componentes
- Marca con `'use client'` los componentes con hooks o eventos.
- Agrega componentes base con el CLI de shadcn. No escribas primitivas desde cero.
- Usa `cn()` de `src/lib/utils.ts` para combinar clases.
- No uses `window.confirm`, `alert` ni `prompt`. Usa `useConfirm()` de `components/ui/confirm-dialog.tsx`:
  `const ok = await confirm({ title, description, confirmLabel, destructive })`.

### Estilo visual
- Tema oscuro fijo (`dark` en `<html>`).
- Paleta base: `zinc`. Acento: `violet` (`violet-500`, `violet-600`).
- Fuente: Geist.
- Diseña mobile-first. La mayoría de los compradores entra desde el celular.

### Textos
- Escribe toda la UI en español rioplatense ("Confirmá", "Elegí").
- Formatea montos con `Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })`.

## Puntos sensibles

- `calculatePrice` en `src/lib/whatsapp.ts` duplica la lógica de `rifando-api/src/utils/pricing.ts`. Cambia ambos juntos.
- `src/lib/transfer.ts` duplica `rifando-api/src/utils/transfer.ts`. Cambia ambos juntos.
- Fechas: usa `isoToLocalInput` y `localInputToIso` de `lib/utils.ts` con `<input type="datetime-local">`.
- Montos vendidos: usa `sale_amount` de cada número. No multipliques cantidad por precio.
- La solapa "Reservas" está en `components/raffle/PurchasesTab.tsx`.
- Comprobantes: miniatura con `comprobanteThumbUrl()` (PDF → JPG de la página 1); el link abre la URL original.
- `src/app/dashboard/raffles/[id]/page.tsx` tiene ~1900 líneas. Extrae cada solapa nueva a un componente en `src/components/raffle/`.
- La protección de `/dashboard` es del lado del cliente (`dashboard/layout.tsx`). No hay middleware.
- `BuyerSheet` resuelve los tres métodos de confirmación: `whatsapp`, `upload` y `mercadopago`.
- `BuyerSheet` copia la selección al abrirse. No la leas en vivo: la grilla se refresca cada 15 s.
- El menú del dashboard está en el array `NAV` de `src/app/dashboard/layout.tsx`.
- `/[username]` y `/[username]/[slug]` redirigen si la URL usa un nombre de usuario anterior.
- "Mis datos": `UsernameField` (cambio de nombre), `TelegramCard` (vinculación), `MercadoPagoCard` (vinculación) y `maskCuitInput` de `lib/transfer.ts`.

## Mercado Pago

- Hooks y llamadas en `hooks/usePayments.ts`. Tipos en `types/index.ts` (`MercadoPago*`).
- Vinculación: `MercadoPagoCard` pide la URL a la API y redirige. La API vuelve a `/dashboard/settings?mp=linked|error&mp_error=`.
- Pago: `BuyerSheet` reserva, crea el checkout y redirige a `init_point`. Si falla el checkout, reintenta sin volver a reservar.
- El `sessionId` cambia en cada carga. Antes de redirigir se guarda la compra con `savePendingCheckout` (`lib/mpCheckout.ts`, localStorage).
- Retorno: Mercado Pago vuelve a `/[username]/[slug]?mp_purchase=...&payment_id=...`. `MercadoPagoReturn` consulta el estado cada 3 s hasta ~30 s y limpia la URL.
- `?code=` en la URL abre una rifa privada sin pedir el código.
- Historial de pagos: `MercadoPagoPayments`, debajo de la solapa "Reservas".
- El rifante elige el método en "Configuración". `mercadopago` exige cuenta vinculada.
