'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { UserRole } from '@/types';
import { 
  GraduationCap, 
  ShieldCheck, 
  BookOpen, 
  User, 
  LogOut,
  Search,
  Menu,
  X,
} from 'lucide-react';
import { NotificationBell } from '@/components/notificaciones/NotificationBell';
import { ProfileDropdown } from '@/components/layout/ProfileDropdown';
import { QuickQrModal } from '@/components/qr/QuickQrModal';
import { QrCode } from 'lucide-react';

interface NavbarProps {
  onOpenMobileMenu?: () => void;
}

export function Navbar({ onOpenMobileMenu }: NavbarProps) {
  const { currentUser } = useApp();
  const [isQrOpen, setIsQrOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/70 dark:border-slate-800/70 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl">
        <div className="px-3 sm:px-6 h-16 flex items-center justify-between gap-3">
          
          {/* Left: Mobile Hamburger + Logo */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenMobileMenu}
              className="md:hidden p-2 -ml-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              aria-label="Abrir menú"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Logo - Strictly links to the active role's dashboard */}
            {(() => {
              const roleHomeUrl: Record<UserRole, string> = {
                admin: '/admin',
                docente: '/docente',
                estudiante: '/estudiante',
                asistencia: '/asistencia',
              };
              const homeHref = currentUser?.rol ? (roleHomeUrl[currentUser.rol] || '/login') : '/login';

              return (
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
                      Gestión Escolar & Asistencia QR
                    </div>
                  </div>
                </Link>
              );
            })()}
          </div>

          {/* Center: Quick QR Reader Button for High Visibility */}
          <div className="flex-1 flex justify-center max-w-xs mx-auto">
            <button
              onClick={() => setIsQrOpen(true)}
              className="group flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-semibold text-xs shadow-sm hover:shadow transition-all duration-200 active:scale-95"
              title="Abrir Lector de Asistencia QR"
            >
              <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center group-hover:rotate-12 transition-transform">
                <QrCode className="w-3 h-3" />
              </div>
              <span className="hidden sm:inline">Lector QR</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </button>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Notification Bell */}
            <NotificationBell />

            {/* Divider */}
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 hidden sm:block" />

            {/* User Profile Dropdown */}
            <ProfileDropdown />
          </div>
        </div>
      </header>

      {/* Quick QR Scanner Modal */}
      <QuickQrModal isOpen={isQrOpen} onClose={() => setIsQrOpen(false)} />
    </>
  );
}
