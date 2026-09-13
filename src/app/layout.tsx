import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'ColeSistema Mini – Gestión Escolar & Asistencia QR',
  description: 'Sistema escolar modular con asistencia QR, calificaciones por competencias (AD, A, B, C) y dashboards para Admin, Docente y Estudiante.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body 
        suppressHydrationWarning 
        className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased"
      >
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
