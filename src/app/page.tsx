import type { Metadata } from 'next';
import Link from 'next/link';
import { BadgeCheck, Calculator, FileImage, MessageCircle, Share2, Shuffle, Trophy, Wallet } from 'lucide-react';
import { HeroGrid } from '@/components/home/HeroGrid';
import { ActiveRaffles, LiveStats } from '@/components/home/ActiveRaffles';
import { HomeCta } from '@/components/home/HomeCta';

export const metadata: Metadata = {
  title: { absolute: 'Rifando — Rifas online con cobro por Mercado Pago' },
  description:
    'Creá tu rifa online, compartí el link y vendé cada número con Mercado Pago, transferencia o WhatsApp. Comprá números de rifas activas sin registrarte.',
};

// Pasos reales del flujo del rifante: es una secuencia, por eso van numerados.
const STEPS = [
  { icon: Trophy, title: 'Cargá la rifa', text: 'Premios con foto, cantidad de números y fecha del sorteo.' },
  { icon: Calculator, title: 'Poné tu meta', text: 'Decí cuánto querés ganar. Rifando calcula el precio por número con las comisiones descontadas.' },
  { icon: Share2, title: 'Compartí el link', text: 'Mandalo por WhatsApp o redes. Los compradores eligen números sin crear cuenta.' },
  { icon: Shuffle, title: 'Sorteá', text: 'Elegí el ganador a mano o con el sorteo automático entre los números vendidos.' },
];

const PAYMENT_METHODS = [
  {
    icon: Wallet,
    title: 'Cobro automático con Mercado Pago',
    text: 'El comprador paga con tarjeta o dinero en cuenta. El número queda vendido al acreditarse el pago, sin que hagas nada.',
    note: 'Tiene comisión de Mercado Pago.',
  },
  {
    icon: FileImage,
    title: 'Reserva con comprobante',
    text: 'El comprador reserva, transfiere a tu alias y sube el comprobante. Vos lo confirmás desde el panel.',
    note: 'Sin comisión de Mercado Pago.',
  },
  {
    icon: MessageCircle,
    title: 'Reserva por WhatsApp',
    text: 'El comprador reserva y te escribe por WhatsApp. Los números quedan ocupados el tiempo que elijas.',
    note: 'Sin comisión de Mercado Pago.',
  },
];

const FAQ = [
  {
    q: '¿Tengo que crear una cuenta para comprar un número?',
    a: 'No. Elegís los números, ponés tu nombre y pagás o reservás. La cuenta es solo para organizar rifas.',
  },
  {
    q: '¿Cuánto cuesta organizar una rifa?',
    a: 'Crear la rifa es gratis. Rifando cobra un porcentaje de lo recaudado. Al crear la rifa ves cuánto te queda limpio antes de publicarla.',
  },
  {
    q: '¿Dónde recibo la plata?',
    a: 'En tu propia cuenta. Con Mercado Pago, el pago entra a tu cuenta vinculada. Con transferencia, a tu alias o CBU.',
  },
  {
    q: '¿Qué pasa si alguien reserva y no paga?',
    a: 'La reserva vence sola y los números vuelven a estar disponibles. Vos elegís cuánto dura la reserva.',
  },
  {
    q: '¿Cómo me entero de una venta?',
    a: 'Te llega un aviso por email y, si lo vinculás, por Telegram. También lo ves en el panel de la rifa.',
  },
];

export default function LandingPage() {
  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-12 md:grid-cols-[1.1fr_1fr] md:pt-20">
        <div className="space-y-6">
          <h1 className="text-4xl font-bold leading-[1.05] tracking-tight text-zinc-50 sm:text-5xl md:text-6xl">
            Armá tu rifa online y vendé cada número desde el celular
          </h1>
          <p className="max-w-xl text-lg text-zinc-400">
            Compartí un link, los compradores eligen sus números y pagan con Mercado Pago o transferencia. Vos seguís
            cada venta en tiempo real.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <HomeCta className="w-full sm:w-auto" />
            <Link
              href="#rifas"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-700 px-5 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800 sm:h-11"
            >
              Ver rifas activas
            </Link>
          </div>
          <LiveStats />
        </div>
        <HeroGrid />
      </section>

      {/* Rifas activas */}
      <section id="rifas" className="scroll-mt-16 border-t border-zinc-900 bg-zinc-950">
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-16">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-50 sm:text-3xl">Rifas activas</h2>
            <p className="text-zinc-400">Elegí una rifa y comprá tus números en un minuto.</p>
          </div>
          <ActiveRaffles />
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="border-t border-zinc-900">
        <div className="mx-auto max-w-6xl space-y-10 px-4 py-16">
          <div className="max-w-2xl space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-50 sm:text-3xl">Cómo se organiza una rifa</h2>
            <p className="text-zinc-400">Cuatro pasos. La mayoría de los organizadores publica en menos de diez minutos.</p>
          </div>
          <ol className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="relative space-y-3 border-l border-zinc-800 pl-5">
                <span className="absolute -left-3 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 text-xs font-semibold text-white">
                  {i + 1}
                </span>
                <Icon className="h-5 w-5 text-violet-300" />
                <h3 className="font-semibold text-zinc-100">{title}</h3>
                <p className="text-sm leading-relaxed text-zinc-400">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Formas de cobro */}
      <section className="border-t border-zinc-900 bg-zinc-900/30">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-[1fr_2fr]">
          <div className="space-y-3">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-50 sm:text-3xl">Elegí cómo cobrar en cada rifa</h2>
            <p className="text-zinc-400">
              Cobrá solo con Mercado Pago o dejá que los compradores reserven y te paguen por transferencia. La plata
              entra siempre a tu cuenta.
            </p>
            <p className="flex items-start gap-2 text-sm text-zinc-400">
              <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              Antes de publicar ves cuánto vas a recibir, con todas las comisiones descontadas.
            </p>
          </div>
          <div className="divide-y divide-zinc-800 rounded-2xl border border-zinc-800 bg-zinc-950">
            {PAYMENT_METHODS.map(({ icon: Icon, title, text, note }) => (
              <div key={title} className="flex gap-4 p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600/15 text-violet-300">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-zinc-100">{title}</h3>
                  <p className="text-sm leading-relaxed text-zinc-400">{text}</p>
                  <p className="text-xs text-zinc-500">{note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Preguntas frecuentes */}
      <section className="border-t border-zinc-900">
        <div className="mx-auto max-w-3xl space-y-6 px-4 py-16">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-50 sm:text-3xl">Preguntas frecuentes</h2>
          <div className="divide-y divide-zinc-800 border-y border-zinc-800">
            {FAQ.map(({ q, a }) => (
              <details key={q} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-zinc-100 marker:hidden">
                  {q}
                  <span className="text-xl leading-none text-zinc-500 transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="border-t border-zinc-900">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-16 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-50">¿Tenés algo para rifar?</h2>
            <p className="text-zinc-400">Creá la rifa gratis y publicala cuando esté lista.</p>
          </div>
          <HomeCta className="w-full sm:w-auto" label="Crear mi rifa gratis" />
        </div>
      </section>
    </main>
  );
}
