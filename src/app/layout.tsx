import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from '@/components/ui/sonner';

const geist = Geist({
  variable: '--font-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: { default: 'Rifando', template: '%s | Rifando' },
  description: 'Creá y administrá tus rifas online de forma simple y profesional.',
  keywords: ['rifas', 'sorteos', 'online', 'argentina'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geist.variable} font-sans h-full antialiased dark`}>
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-50">
        <Providers>
          {children}
          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
