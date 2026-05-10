import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950 mt-auto">
      <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col items-center gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <img src="/logo-mark.png" alt="" className="h-8 w-8" aria-hidden />
          <img src="/logo-text.png" alt="Rifando" className="h-5 w-auto" />
        </div>

        {/* Links */}
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-zinc-500">
          <Link href="/terminos" className="hover:text-zinc-300 transition-colors">
            Términos y Condiciones
          </Link>
          <Link href="/privacidad" className="hover:text-zinc-300 transition-colors">
            Privacidad
          </Link>
          <Link href="/contacto" className="hover:text-zinc-300 transition-colors">
            Contacto
          </Link>
        </nav>

        {/* Copyright */}
        <p className="text-xs text-zinc-600 text-center">
          Hecho por Fabrizio Catanzaro Pfahler &copy; 2026
        </p>
      </div>
    </footer>
  );
}
