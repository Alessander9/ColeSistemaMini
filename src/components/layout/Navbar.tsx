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

interface NavbarProps {
  onOpenMobileMenu?: () => void;
}

export function Navbar({ onOpenMobileMenu }: NavbarProps) {
  const { currentUser, switchRole } = useApp();
  const router = useRouter();

  const handleLogout = () => {
    router.push('/login');
  };

  const roleConfig: Record<UserRole, { label: string; icon: React.ReactNode; gradient: string; dot: string }> = {
    admin: {
      label: 'Admin',
      icon: <ShieldCheck className="w-3 h-3" />,
      gradient: 'from-purple-500 to-violet-600',
      dot: 'bg-purple-500',
    },
    docente: {
      label: 'Docente',
      icon: <BookOpen className="w-3 h-3" />,
      gradient: 'from-blue-500 to-sky-600',
      dot: 'bg-blue-500',
    },
    estudiante: {
      label: 'Estudiante',
      icon: <User className="w-3 h-3" />,
      gradient: 'from-emerald-500 to-teal-600',
      dot: 'bg-emerald-500',
    },
  };

  const cfg = roleConfig[currentUser.rol];

  return (
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

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
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
        </div>

        {/* Center: Clean spacing / Search or Institutional Breadcrumb */}
        <div className="flex-1" />

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
  );
}
