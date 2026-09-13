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

export function Navbar() {
  const { currentUser, switchRole } = useApp();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 via-blue-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-shadow">
            <GraduationCap className="w-5 h-5 text-white" />
            <div className="absolute inset-0 rounded-xl ring-2 ring-white/20" />
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-black tracking-tight text-slate-900 dark:text-white">
              Cole<span className="text-emerald-500">Sistema</span>
              <span className="text-slate-400 font-semibold text-xs ml-1">Mini</span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium -mt-0.5">
              Gestión Escolar & Asistencia QR
            </div>
          </div>
        </Link>

        {/* Center: Clean spacing / Search or Institutional Breadcrumb */}
        <div className="flex-1" />

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Notification Bell */}
          <NotificationBell />

          {/* Divider */}
          <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 hidden sm:block" />

          {/* User Avatar + Info */}
          <div className="flex items-center gap-2.5">
            <div className="relative hidden sm:block">
              <img
                src={currentUser.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.nombres)}&background=6366f1&color=fff&size=80`}
                alt={currentUser.nombres}
                className="w-8 h-8 rounded-xl object-cover ring-2 ring-slate-200 dark:ring-slate-700"
              />
              <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 ${cfg.dot} rounded-full border-2 border-white dark:border-slate-950`} />
            </div>
            <div className="hidden md:block text-left min-w-0">
              <p className="text-xs font-bold text-slate-800 dark:text-white leading-tight truncate max-w-[100px]">
                {currentUser.nombres.split(' ')[0]}
              </p>
              <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold bg-gradient-to-r ${cfg.gradient} text-white`}>
                {cfg.icon}
                {cfg.label}
              </div>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all duration-200"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
