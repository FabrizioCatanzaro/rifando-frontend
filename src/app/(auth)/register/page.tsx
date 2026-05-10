import Link from 'next/link';

export const metadata = { title: 'Registrarse' };

export default function RegisterPage() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-violet-600/10 border border-violet-500/20 mx-auto">
          <img src="/logo-mark.png" alt="Rifando" className="h-9 w-9" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-zinc-50">Próximamente</h1>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Muy pronto cualquier persona podrá crear su cuenta en Rifando y empezar a organizar rifas online de forma gratuita.
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4 text-sm text-zinc-400">
          Estamos en fase de acceso cerrado mientras terminamos de pulir la plataforma.
        </div>

        <p className="text-sm text-zinc-500">
          ¿Ya tenés cuenta?{' '}
          <Link href="/login" className="text-violet-400 hover:text-violet-300">
            Iniciá sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
