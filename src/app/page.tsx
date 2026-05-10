import { LinkButton } from '@/components/ui/link-button';

export default function LandingPage() {
  return (
    <main className="flex flex-col flex-1 items-center justify-center px-4 py-24 text-center">
      <div className="max-w-2xl space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-sm text-violet-400">
          🎟️ Rifas online simples y profesionales
        </div>

        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-zinc-50">
          Creá tu rifa online en{' '}
          <span className="text-violet-400">minutos</span>
        </h1>

        <p className="text-lg text-zinc-400 max-w-lg mx-auto">
          Creá, administrá y compartí tus rifas. Los compradores eligen sus números y confirman por WhatsApp. Sin complicaciones.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <LinkButton href="/register" size="lg" className="bg-violet-600 hover:bg-violet-500 text-white w-full sm:w-auto">
            Empezar gratis
          </LinkButton>
          <LinkButton href="/login" size="lg" variant="outline" className="w-full sm:w-auto border-zinc-700 text-zinc-300 hover:bg-zinc-800">
            Iniciar sesión
          </LinkButton>
        </div>
      </div>

      <div className="mt-24 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl w-full text-left">
        {[
          { icon: '🎯', title: 'Grilla visual', desc: 'Números claros y ordenados. Disponibles, reservados y vendidos.' },
          { icon: '💬', title: 'WhatsApp directo', desc: 'Los compradores confirman automáticamente por WhatsApp.' },
          { icon: '📊', title: 'Estadísticas', desc: 'Seguí en tiempo real cuánto vendiste y quiénes compraron.' },
        ].map((f) => (
          <div key={f.title} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="text-2xl mb-3">{f.icon}</div>
            <h3 className="font-semibold text-zinc-100 mb-1">{f.title}</h3>
            <p className="text-sm text-zinc-400">{f.desc}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
