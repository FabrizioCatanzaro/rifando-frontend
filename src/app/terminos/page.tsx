export const metadata = { title: 'Términos y Condiciones' };

export default function TerminosPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16 space-y-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-zinc-50">Términos y Condiciones</h1>
        <p className="text-zinc-500 text-sm">Última actualización: mayo 2026</p>
      </div>

      <div className="space-y-8 text-zinc-400 leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-200">1. Sobre Rifando</h2>
          <p>
            Rifando es una plataforma de software que facilita la organización y administración de rifas y sorteos entre personas. Actuamos exclusivamente como intermediario tecnológico: proveemos las herramientas para crear y gestionar rifas, pero no participamos en ningún aspecto económico, legal ni logístico de las mismas.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-200">2. Aceptación de los términos</h2>
          <p>
            Al registrarte y usar Rifando aceptás estos Términos y Condiciones en su totalidad. Si no estás de acuerdo con alguna parte, no debés usar la plataforma.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-200">3. Responsabilidad del rifante</h2>
          <p>
            El rifante (usuario registrado que crea una rifa) es el único responsable de:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Cumplir con la legislación vigente de su país respecto a sorteos, rifas y juegos de azar.</li>
            <li>La veracidad de los premios publicados y la entrega de los mismos a los ganadores.</li>
            <li>La gestión de los pagos y cobros con los compradores fuera de la plataforma.</li>
            <li>El trato con los compradores y cualquier conflicto que pueda surgir.</li>
          </ul>
          <p>
            Rifando no verifica la legitimidad de las rifas publicadas ni garantiza el cumplimiento de los premios.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-200">4. Usos prohibidos</h2>
          <p>Está prohibido usar Rifando para:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Publicar rifas fraudulentas o con premios inexistentes.</li>
            <li>Cualquier actividad ilegal, incluyendo evasión impositiva.</li>
            <li>Acceder o intentar acceder a cuentas ajenas sin autorización.</li>
            <li>Enviar contenido ofensivo, discriminatorio o violatorio de derechos de terceros.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-200">5. Limitación de responsabilidad</h2>
          <p>
            Rifando no se hace responsable por pérdidas económicas, disputas entre rifantes y compradores, ni por el incumplimiento de premios ofrecidos. La plataforma se provee &quot;tal cual está&quot;, sin garantías de disponibilidad continua.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-200">6. Suspensión de cuentas</h2>
          <p>
            Nos reservamos el derecho de suspender o eliminar cuentas que violen estos términos, publiquen contenido fraudulento o actúen de forma que perjudique a otros usuarios o a la plataforma, sin previo aviso y sin derecho a compensación.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-200">7. Modificaciones</h2>
          <p>
            Rifando puede modificar estos términos en cualquier momento. Los cambios entran en vigencia desde su publicación en esta página. El uso continuado de la plataforma implica la aceptación de los términos actualizados.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-200">8. Contacto</h2>
          <p>
            Para consultas sobre estos términos podés escribirnos a{' '}
            <a href="mailto:fabricando.dev@gmail.com" className="text-violet-400 hover:text-violet-300 transition-colors">
              fabricando.dev@gmail.com
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}
