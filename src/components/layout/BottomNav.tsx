'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { 
  LayoutDashboard, 
  Calendar, 
  GraduationCap, 
  Users, 
  School,
  QrCode, 
  Award, 
  FileText,
  ClipboardCheck,
  LucideIcon
} from 'lucide-react';

interface BottomNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
}

export function BottomNav() {
  const pathname = usePathname();
  const { currentUser } = useApp();

  // Navigation per role
  const adminItems: BottomNavItem[] = [
    { href: '/admin', label: 'Inicio', icon: LayoutDashboard },
    { href: '/admin/horarios', label: 'Horarios', icon: Calendar },
    { href: '/admin/docentes', label: 'Docentes', icon: GraduationCap },
    { href: '/admin/estudiantes', label: 'Alumnos', icon: Users },
    { href: '/admin/academico', label: 'Salones', icon: School },
  ];

  const docenteItems: BottomNavItem[] = [
    { href: '/docente', label: 'Panel', icon: LayoutDashboard },
    { href: '/docente/asistencia', label: 'QR Asist.', icon: QrCode, badge: 'Live' },
    { href: '/docente/horario', label: 'Horario', icon: Calendar },
    { href: '/docente/notas', label: 'Notas', icon: Award },
    { href: '/docente/tareas', label: 'Tareas', icon: FileText },
  ];

  const estudianteItems: BottomNavItem[] = [
    { href: '/estudiante', label: 'Inicio', icon: LayoutDashboard },
    { href: '/estudiante/libreta-notas', label: 'Notas', icon: Award },
    { href: '/estudiante/horario', label: 'Horario', icon: Calendar },
    { href: '/estudiante/tareas', label: 'Tareas', icon: FileText },
    { href: '/estudiante/carnet-qr', label: 'Carnet QR', icon: QrCode },
  ];

  const asistenciaItems: BottomNavItem[] = [
    { href: '/asistencia', label: 'Terminal QR', icon: QrCode, badge: 'Live' },
  ];

  let items = adminItems;
  let activeColor = 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40';
  let activeIconColor = 'text-purple-600 dark:text-purple-400';

  if (currentUser.rol === 'docente') {
    items = docenteItems;
    activeColor = 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40';
    activeIconColor = 'text-blue-600 dark:text-blue-400';
  } else if (currentUser.rol === 'estudiante') {
    items = estudianteItems;
    activeColor = 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40';
    activeIconColor = 'text-emerald-600 dark:text-emerald-400';
  } else if (currentUser.rol === 'asistencia') {
    items = asistenciaItems;
    activeColor = 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40';
    activeIconColor = 'text-amber-600 dark:text-amber-400';
  }

  return (
    <nav 
      aria-label="Navegación móvil"
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800/80 px-2 py-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 6px)' }}
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-2xl transition-all duration-200 ${
                isActive ? activeColor : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? activeIconColor : 'text-slate-500 dark:text-slate-400'} transition-transform ${isActive ? 'scale-110' : ''}`} />
                {item.badge && (
                  <span className="absolute -top-1 -right-2 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse" />
                )}
              </div>
              <span className={`text-[10px] tracking-tight mt-0.5 truncate max-w-[62px] ${
                isActive ? 'font-extrabold' : 'font-medium'
              }`}>
                {item.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 w-4 h-0.5 rounded-full bg-current opacity-70" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
