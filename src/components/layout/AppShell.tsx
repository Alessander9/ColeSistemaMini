'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { AppProvider, useApp } from '@/context/AppContext';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { ToastContainer } from '@/components/ui/ToastContainer';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Download, X, Bell } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// PWA Install Banner
// ─────────────────────────────────────────────────────────────────────────────
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function PwaInstallBanner() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');
  const { requestPermission } = usePushNotifications();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ('Notification' in window) setNotifPermission(Notification.permission);

    // Check if already dismissed
    if (sessionStorage.getItem('pwa-banner-dismissed')) {
      setDismissed(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setInstallPrompt(null);
    setDismissed(true);
    sessionStorage.setItem('pwa-banner-dismissed', '1');
  };

  const handleEnableNotifications = async () => {
    const perm = await requestPermission();
    setNotifPermission(perm);
    if (perm === 'granted') {
      sessionStorage.setItem('pwa-banner-dismissed', '1');
      setDismissed(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('pwa-banner-dismissed', '1');
  };

  // Show if: install available OR notifications not yet granted
  const shouldShow = !dismissed && (installPrompt !== null || notifPermission === 'default');
  if (!shouldShow) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-3 md:left-6 z-[9998] max-w-xs animate-in slide-in-from-bottom-4 duration-500">
      <div
        className="relative rounded-2xl overflow-hidden border border-blue-400/30 bg-gradient-to-br from-blue-700 to-indigo-800"
        style={{ boxShadow: '0 8px 32px rgba(59,130,246,0.4), 0 0 0 1px rgba(255,255,255,0.08)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 pointer-events-none" />
        <div className="relative p-4 pr-10">
          <p className="font-extrabold text-white text-sm mb-0.5 flex items-center gap-1.5">
            📱 ColeSistema
          </p>
          <p className="text-blue-100 text-xs leading-relaxed mb-3">
            {installPrompt
              ? 'Instala la app para acceso rápido y notificaciones nativas en tu celular'
              : 'Activa notificaciones para recibir alertas de asistencia en tiempo real'}
          </p>
          <div className="flex gap-2">
            {installPrompt && (
              <button
                type="button"
                onClick={handleInstall}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-blue-700 font-bold text-xs rounded-xl shadow active:scale-95 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Instalar App
              </button>
            )}
            {notifPermission === 'default' && (
              <button
                type="button"
                onClick={handleEnableNotifications}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs rounded-xl shadow active:scale-95 transition-all cursor-pointer border border-blue-400"
              >
                <Bell className="w-3.5 h-3.5" /> Activar Notif.
              </button>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-2 right-2 w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 cursor-pointer transition-colors"
          aria-label="Cerrar"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

import { CommandPalette } from '@/components/layout/CommandPalette';

// ─────────────────────────────────────────────────────────────────────────────
// Inner shell (needs AppProvider context for toasts)
// ─────────────────────────────────────────────────────────────────────────────
function InnerShell({ children }: { children: React.ReactNode }) {
  const { toasts, removeToast } = useApp();
  const { requestPermission, sendNotification } = usePushNotifications();
  const prevToastsRef = useRef<typeof toasts>([]);

  // When a new toast appears, also fire a push notification
  useEffect(() => {
    const prev = prevToastsRef.current;
    const newToasts = toasts.filter((t) => !prev.find((p) => p.id === t.id));
    if (newToasts.length > 0) {
      newToasts.forEach(async (t) => {
        await sendNotification({
          title: t.titulo || 'ColeSistema',
          body: t.mensaje,
          tag: t.tipo,
          url: '/',
        });
      });
    }
    prevToastsRef.current = toasts;
  }, [toasts, sendNotification]);

  // Ask for notification permission after 3 seconds on first meaningful interaction
  useEffect(() => {
    const timer = setTimeout(async () => {
      if ('Notification' in window && Notification.permission === 'default') {
        await requestPermission();
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [requestPermission]);

  return (
    <>
      {children}
      <CommandPalette />
      <ToastContainer
        toasts={toasts}
        onRemove={removeToast}
      />
      <PwaInstallBanner />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AppShell: top-level layout
// ─────────────────────────────────────────────────────────────────────────────
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isStandalonePage = pathname === '/login' || pathname === '/despedida' || pathname === '/bienvenida' || pathname === '/asistencia';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  if (isStandalonePage) {
    return (
      <AppProvider>
        <InnerShell>
          <div className="min-h-screen">{children}</div>
        </InnerShell>
      </AppProvider>
    );
  }

  return (
    <AppProvider>
      <Navbar onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-200">
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <div className="relative w-72 sm:w-80 max-w-[85vw] h-full bg-white dark:bg-slate-950 shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            <Sidebar isMobileDrawer onClose={() => setIsMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex overflow-hidden" style={{ height: 'calc(100dvh - 64px)' }}>
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 lg:p-8 pb-24 md:pb-8">
          <InnerShell>{children}</InnerShell>
        </main>
      </div>

      <BottomNav />
    </AppProvider>
  );
}
