export const metadata = { title: 'Política de Privacidad' };

export default function PrivacidadPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16 space-y-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-zinc-50">Política de Privacidad</h1>
        <p className="text-zinc-500 text-sm">Última actualización: mayo 2026</p>
      </div>

      <div className="space-y-8 text-zinc-400 leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-200">1. ¿Qué datos recopilamos?</h2>
          <p>
            Al crear una cuenta en Rifando recopilamos tu nombre de usuario, dirección de email y contraseña (almacenada de forma encriptada). De forma opcional, podés agregar tu nombre visible, número de WhatsApp y datos bancarios para transferencias (alias, titular, CUIT y banco).
          </p>
          <p>
            Los compradores que participan en una rifa ingresan únicamente su nombre al momento de reservar números. Ese dato queda asociado a la rifa y es visible solo para el rifante correspondiente.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-200">2. ¿Cómo usamos tus datos?</h2>
          <p>
            Usamos tu información exclusivamente para operar la plataforma: autenticarte, mostrarte tus rifas, permitirte gestionar compradores y generar los links de WhatsApp. No utilizamos tus datos para publicidad, ni los compartimos con terceros con fines comerciales.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-200">3. Almacenamiento y seguridad</h2>
          <p>
            Los datos de tu cuenta se guardan en una base de datos con conexiones cifradas (TLS). Las imágenes que subís se almacenan en una plataforma de gestión de medios con altos estándares de seguridad. Las contraseñas nunca se guardan en texto plano: usamos un encriptador.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-200">4. Visibilidad de tu perfil</h2>
          <p>
            Tu perfil y tus rifas activas son públicas por defecto, lo que permite que los compradores accedan a ellas por URL. Podés configurar tu perfil como privado desde la sección de Configuración, lo que ocultará tus rifas de la vista pública.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-200">5. Tus derechos</h2>
          <p>
            Tenés derecho a acceder, corregir o eliminar los datos asociados a tu cuenta en cualquier momento. Para solicitar la eliminación de tu cuenta y todos sus datos, escribinos a{' '}
            <a href="mailto:fabricando.dev@gmail.com" className="text-violet-400 hover:text-violet-300 transition-colors">
              fabricando.dev@gmail.com
            </a>.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-200">6. Cambios a esta política</h2>
          <p>
            Podemos actualizar esta política en cualquier momento. Los cambios sustanciales serán notificados por email. El uso continuado de la plataforma implica la aceptación de la versión vigente.
          </p>
        </section>
      </div>
    </div>
  );
}
