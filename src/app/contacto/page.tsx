export const metadata = { title: 'Contacto' };

export default function ContactoPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-zinc-50">Contacto</h1>
        <p className="text-zinc-400 leading-relaxed">
          ¿Tenés preguntas, sugerencias o encontraste un problema? Escribinos por cualquiera de estos canales y te respondemos a la brevedad.
        </p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl divide-y divide-zinc-800">
        <div className="flex items-center gap-4 px-6 py-4">
          <span className="text-xl">✉️</span>
          <div>
            <p className="text-xs text-zinc-500 mb-0.5">Email</p>
            <a
              href="mailto:fabricando.dev@gmail.com"
              className="text-violet-400 hover:text-violet-300 transition-colors text-sm"
            >
              fabricando.dev@gmail.com
            </a>
          </div>
        </div>

        <div className="flex items-center gap-4 px-6 py-4">
          <span className="text-xl">💬</span>
          <div>
            <p className="text-xs text-zinc-500 mb-0.5">WhatsApp</p>
            <a
              href="https://wa.me/541125031107"
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-400 hover:text-violet-300 transition-colors text-sm"
            >
              +54 11 2503-1107
            </a>
          </div>
        </div>

        <div className="flex items-center gap-4 px-6 py-4">
          <span className="text-xl">📸</span>
          <div>
            <p className="text-xs text-zinc-500 mb-0.5">Instagram</p>
            <a
              href="https://instagram.com/fabrycatanzaro"
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-400 hover:text-violet-300 transition-colors text-sm"
            >
              @fabrycatanzaro
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
