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
  const { currentUser, toggleCommandPalette, isSidebarCollapsed, toggleSidebar } = useApp();
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
          
          {/* Left: Mobile Hamburger / Desktop Toggle + Logo */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Mobile drawer trigger */}
            <button
              type="button"
              onClick={onOpenMobileMenu}
              className="md:hidden p-2 -ml-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              aria-label="Abrir menú"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Desktop sidebar toggle button */}
            <button
              type="button"
              onClick={toggleSidebar}
              className="hidden md:flex items-center justify-center p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl transition-all active:scale-95 cursor-pointer"
              title={isSidebarCollapsed ? "Desplegar menú lateral" : "Colapsar menú lateral"}
              aria-label="Alternar barra lateral"
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-in fade-in duration-200" />
              ) : (
                <PanelLeftClose className="w-5 h-5 text-slate-500 dark:text-slate-400 animate-in fade-in duration-200" />
              )}
            </button>

            <Link href={homeHref} className="flex items-center gap-2.5 group shrink-0" title="Ir a mi Dashboard">
              <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 via-blue-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-shadow">
                <GraduationCap className="w-5 h-5 text-white" />
                <div className="absolute inset-0 rounded-xl ring-2 ring-white/20" />
              </div>
              <div>
                <div className="text-sm font-black tracking-tight text-slate-900 dark:text-white">
                  Cole<span className="text-emerald-500">Sistema</span>
                  <span className="text-slate-400 font-semibold text-xs ml-1 hidden xs:inline">Mini</span>
                </div>
                <div className="text-[10px] text-slate-400 font-medium -mt-0.5 hidden sm:block">
                  SaaS Educativo & Asistencia QR
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
