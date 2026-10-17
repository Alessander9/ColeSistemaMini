'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { UserRole } from '@/types';
import { 
  GraduationCap, 
  Search,
  Menu,
  QrCode,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { NotificationBell } from '@/components/notificaciones/NotificationBell';
import { ProfileDropdown } from '@/components/layout/ProfileDropdown';
import { QuickQrModal } from '@/components/qr/QuickQrModal';
import { AcademicContextSelector } from '@/components/layout/AcademicContextSelector';

interface NavbarProps {
  onOpenMobileMenu?: () => void;
}

export function Navbar({ onOpenMobileMenu }: NavbarProps) {
  const { currentUser, toggleCommandPalette, isSidebarCollapsed, toggleSidebar, brandingConfig } = useApp();
  const [isQrOpen, setIsQrOpen] = useState(false);

  // Permiso para escanear asistencia QR: Solo Admin, Docente y Asistencia (Portero)
  const canScanQr = currentUser?.rol === 'admin' || currentUser?.rol === 'docente' || currentUser?.rol === 'asistencia';

  const roleHomeUrl: Record<UserRole, string> = {
    admin: '/admin',
    docente: '/docente',
    estudiante: '/estudiante',
    apoderado: '/apoderado',
    asistencia: '/asistencia',
  };
  const homeHref = currentUser?.rol ? (roleHomeUrl[currentUser.rol] || '/login') : '/login';

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/70 dark:border-slate-800/70 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl">
        <div className="px-3 sm:px-6 h-16 flex items-center justify-between gap-3">
          
          {/* Left: Sidebar Toggle + Logo */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Sidebar toggle button (Desplegable / Colapsable) */}
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined' && window.innerWidth < 768) {
                  if (onOpenMobileMenu) onOpenMobileMenu();
                } else {
                  toggleSidebar();
                }
              }}
              className={`flex items-center justify-center p-2 rounded-xl transition-all active:scale-95 cursor-pointer ${
                isSidebarCollapsed
                  ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800/60 shadow-sm'
                  : 'text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800/80'
              }`}
              title={isSidebarCollapsed ? "Desplegar menú lateral" : "Ocultar menú lateral"}
              aria-label="Alternar menú lateral"
            >
              {/* Mobile hamburger icon */}
              <Menu className="w-5 h-5 text-slate-700 dark:text-slate-300 md:hidden" />
              {/* Desktop collapse / expand icon */}
              <span className="hidden md:inline-flex">
                {isSidebarCollapsed ? (
                  <PanelLeftOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-in zoom-in-75 duration-150" />
                ) : (
                  <PanelLeftClose className="w-5 h-5 text-slate-500 dark:text-slate-400 animate-in zoom-in-75 duration-150" />
                )}
              </span>
            </button>

            <Link href={homeHref} className="flex items-center gap-2 sm:gap-2.5 group shrink-0" title="Ir a mi Dashboard">
              {brandingConfig?.logoUrl ? (
                <img 
                  src={brandingConfig.logoUrl} 
                  alt={brandingConfig.nombreInstitucion || 'Logo'} 
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-contain bg-white border border-slate-200/80 dark:border-slate-700 shadow-md shrink-0 group-hover:scale-105 transition-transform p-0.5" 
                />
              ) : (
                <div 
                  style={{
                    background: `linear-gradient(135deg, ${brandingConfig?.primaryColor || '#4f46e5'} 0%, ${brandingConfig?.accentColor || '#3b82f6'} 50%, ${brandingConfig?.secondaryColor || '#10b981'} 100%)`
                  }}
                  className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-shadow text-white font-black text-xs sm:text-sm"
                >
                  {brandingConfig?.siglas || 'CS'}
                  <div className="absolute inset-0 rounded-xl ring-2 ring-white/20" />
                </div>
              )}
              {/* En teléfonos angostos solo cabe el logo: el nombre empujaba avisos y perfil fuera de la pantalla */}
              <div className="hidden sm:block sm:max-w-xs">
                <div className="text-xs sm:text-sm font-black tracking-tight text-slate-900 dark:text-white truncate">
                  {brandingConfig?.nombreInstitucion || 'ColeSistema Mini'}
                </div>
                <div className="text-[10px] text-slate-400 font-medium -mt-0.5 hidden sm:block truncate">
                  {brandingConfig?.slogan || 'SaaS Educativo & Asistencia QR'}
                </div>
              </div>
            </Link>
          </div>

          {/* Center: Persistent Academic Context Selector + Search shortcut + Quick QR */}
          <div className="flex-1 flex items-center justify-center gap-2 max-w-xl mx-auto">
            <AcademicContextSelector />
            
            {/* Command Palette Trigger Button (CTRL+K) */}
            <button
              onClick={toggleCommandPalette}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-500 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700/80 text-xs transition-all active:scale-95 shadow-sm"
              title="Buscar en todo el sistema (Ctrl + K)"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden lg:inline text-[11px]">Buscar...</span>
              <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.2 text-[10px] font-semibold text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded shadow-2xs">
                Ctrl K
              </kbd>
            </button>

            {/* Solo Administrador, Docente y Portero (Asistencia) pueden abrir el escáner QR de toma de asistencia */}
            {canScanQr && (
              <button
                onClick={() => setIsQrOpen(true)}
                className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-semibold text-xs shadow-sm hover:shadow transition-all duration-200 active:scale-95 shrink-0"
                title="Abrir Lector de Asistencia QR"
              >
                <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                  <QrCode className="w-2.5 h-2.5" />
                </div>
                <span className="text-[11px]">Escanear QR</span>
              </button>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <NotificationBell />
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 hidden sm:block" />
            <ProfileDropdown />
          </div>
        </div>
      </header>

      {/* Quick QR Scanner Modal (Solo usuarios autorizados) */}
      {canScanQr && (
        <QuickQrModal isOpen={isQrOpen} onClose={() => setIsQrOpen(false)} />
      )}
    </>
  );
}
