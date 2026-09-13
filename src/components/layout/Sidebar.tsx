'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  BookOpen, 
  QrCode, 
  ClipboardCheck, 
  Award, 
  FileText, 
  Calendar, 
  Sparkles, 
  GraduationCap, 
  ChevronRight, 
  ChevronDown,
  BarChart3, 
  School,
  LucideIcon 
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
  badgeColor?: string;
}

interface NavSection {
  section: string;
  items: NavItem[];
}

interface SidebarProps {
  isMobileDrawer?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isMobileDrawer = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { currentUser, gradeLevels, sections } = useApp();

  const [isPrimariaOpen, setIsPrimariaOpen] = useState(true);
  const [isSecundariaOpen, setIsSecundariaOpen] = useState(false);
  const [openGradeId, setOpenGradeId] = useState<string | null>('grade-3pri');

  const handleLinkClick = () => {
    if (isMobileDrawer && onClose) {
      onClose();
    }
  };

  const adminNav: NavSection[] = [
    {
      section: 'Principal',
      items: [
        { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/admin/academico', label: 'Explorador Escolar', icon: School, badge: '2026', badgeColor: 'bg-purple-500/20 text-purple-600 dark:text-purple-300' },
        { href: '/admin/docentes', label: 'Docentes & Plana', icon: GraduationCap, badge: 'Asignación' },
        { href: '/admin/estudiantes', label: 'Estudiantes & QR', icon: Users, badge: 'Carnets' },
        { href: '/admin/matriculas', label: 'Matrículas', icon: UserPlus },
      ]
    },
    {
      section: 'Gestión Curricular',
      items: [
        { href: '/admin/horarios', label: 'Horarios & Asignación', icon: Calendar, badge: 'Anti-cruce' },
        { href: '/admin/notas-salon', label: 'Notas por Salón', icon: BarChart3, badge: '11 grados' },
        { href: '/admin/reportes', label: 'Reportes & Actas', icon: FileText },
      ]
    }
  ];

  const docenteNav: NavSection[] = [
    {
      section: 'Principal',
      items: [
        { href: '/docente', label: 'Mi Panel', icon: LayoutDashboard },
        { href: '/docente/asistencia', label: 'Asistencia QR', icon: QrCode, badge: '● Live', badgeColor: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' },
      ]
    },
    {
      section: 'Académico',
      items: [
        { href: '/docente/horario', label: 'Mi Horario', icon: Calendar, badge: 'Semanal' },
        { href: '/docente/notas', label: 'Notas AD–A–B–C', icon: Award },
        { href: '/docente/tareas', label: 'Tareas', icon: FileText },
        { href: '/docente/evaluaciones', label: 'Evaluaciones', icon: Calendar },
      ]
    }
  ];

  const estudianteNav: NavSection[] = [
    {
      section: 'Mi Portal',
      items: [
        { href: '/estudiante', label: 'Inicio', icon: LayoutDashboard },
        { href: '/estudiante/carnet-qr', label: 'Carnet QR', icon: QrCode, badge: 'Digital' },
      ]
    },
    {
      section: 'Académico',
      items: [
        { href: '/estudiante/horario', label: 'Horario Escolar', icon: Calendar },
        { href: '/estudiante/libreta-notas', label: 'Mis Notas', icon: Award },
        { href: '/estudiante/asistencias', label: 'Asistencias', icon: ClipboardCheck },
        { href: '/estudiante/tareas', label: 'Tareas', icon: FileText },
        { href: '/estudiante/evaluaciones', label: 'Evaluaciones', icon: Calendar },
      ]
    }
  ];

  let currentNav = adminNav;
  let roleConfig = {
    label: 'Administrador',
    color: 'from-purple-600 via-violet-600 to-indigo-600',
    lightBg: 'bg-purple-50 dark:bg-purple-950/30',
    lightText: 'text-purple-700 dark:text-purple-300',
    dot: 'bg-purple-500',
  };

  if (currentUser.rol === 'docente') {
    currentNav = docenteNav;
    roleConfig = {
      label: 'Profesor',
      color: 'from-blue-600 via-sky-600 to-cyan-600',
      lightBg: 'bg-blue-50 dark:bg-blue-950/30',
      lightText: 'text-blue-700 dark:text-blue-300',
      dot: 'bg-blue-500',
    };
  } else if (currentUser.rol === 'estudiante') {
    currentNav = estudianteNav;
    roleConfig = {
      label: 'Estudiante',
      color: 'from-emerald-600 via-teal-600 to-cyan-600',
      lightBg: 'bg-emerald-50 dark:bg-emerald-950/30',
      lightText: 'text-emerald-700 dark:text-emerald-300',
      dot: 'bg-emerald-500',
    };
  }

  const primariaGrades = gradeLevels.filter(g => g.nivel.toLowerCase() === 'primaria');
  const secundariaGrades = gradeLevels.filter(g => g.nivel.toLowerCase() === 'secundaria');

  return (
    <aside className={
      isMobileDrawer
        ? "w-full h-full flex flex-col justify-between overflow-y-auto scrollbar-thin bg-white dark:bg-slate-950"
        : "w-64 border-r border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl flex flex-col justify-between shrink-0 hidden md:flex overflow-y-auto max-h-screen scrollbar-thin"
    }>
      
      {/* User Profile Card */}
      <div className="p-4 space-y-1">
        {isMobileDrawer && (
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">Menú Principal</span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <span className="text-lg leading-none font-bold">✕</span>
            </button>
          </div>
        )}

        <div className="relative overflow-hidden rounded-2xl p-4 mb-4">
          <div className={`absolute inset-0 bg-gradient-to-br ${roleConfig.color} opacity-10 dark:opacity-20 rounded-2xl`} />
          <div className="relative z-10 flex items-center gap-3">
            <div className="relative">
              <img
                src={currentUser.avatar_url || `https://ui-avatars.com/api/?name=${currentUser.nombres}&background=6366f1&color=fff&size=80`}
                alt={currentUser.nombres}
                className="w-10 h-10 rounded-xl object-cover ring-2 ring-white dark:ring-slate-800 shadow-md"
              />
              <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 ${roleConfig.dot} rounded-full border-2 border-white dark:border-slate-950`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                {currentUser.nombres.split(' ')[0]} {currentUser.apellidos.split(' ')[0]}
              </p>
              <span className={`text-[10px] font-bold ${roleConfig.lightText}`}>
                {roleConfig.label}
              </span>
            </div>
          </div>
        </div>

        {/* Standard Navigation */}
        <nav className="space-y-4">
          {currentNav.map((section) => (
            <div key={section.section}>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600 px-3 mb-1">
                {section.section}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={handleLinkClick}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group ${
                        isActive
                          ? 'sidebar-active'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'} transition-colors`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${
                          item.badgeColor
                            ? item.badgeColor
                            : isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                      {isActive && (
                        <ChevronRight className="w-3 h-3 text-white/70 shrink-0" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {/* ── Collapsible Academic Tree (Admin only) ── */}
          {currentUser.rol === 'admin' && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between px-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  Salones 2026
                </span>
                <Link 
                  href="/admin/academico" 
                  onClick={handleLinkClick}
                  className="text-[9px] font-bold text-purple-600 dark:text-purple-400 hover:underline"
                >
                  Ver todo
                </Link>
              </div>

              {/* Primaria Accordion */}
              <div className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => setIsPrimariaOpen(!isPrimariaOpen)}
                  className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                >
                  <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                    <span>👦</span> Primaria (6 Grados)
                  </span>
                  <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isPrimariaOpen ? 'rotate-180' : ''}`} />
                </button>

                {isPrimariaOpen && (
                  <div className="pl-3 space-y-0.5 border-l border-blue-200/60 dark:border-blue-900/40 ml-3">
                    {primariaGrades.map(grade => {
                      const gradeSections = sections.filter(s => s.grado_id === grade.id);
                      const isGradeOpen = openGradeId === grade.id;

                      return (
                        <div key={grade.id}>
                          <button
                            type="button"
                            onClick={() => setOpenGradeId(isGradeOpen ? null : grade.id)}
                            className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors"
                          >
                            <span>{grade.nombre}</span>
                            <span className="text-[10px] text-slate-400">{isGradeOpen ? '▴' : '▾'}</span>
                          </button>

                          {isGradeOpen && (
                            <div className="pl-3 py-1 flex items-center gap-1.5">
                              {gradeSections.map(sec => {
                                const isSecActive = pathname === `/admin/secciones/${sec.id}`;
                                return (
                                  <Link
                                    key={sec.id}
                                    href={`/admin/secciones/${sec.id}`}
                                    onClick={handleLinkClick}
                                    className={`px-2.5 py-0.5 rounded-md text-[10px] font-black transition-all ${
                                      isSecActive
                                        ? 'bg-purple-600 text-white shadow-sm'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-purple-100 hover:text-purple-700'
                                    }`}
                                  >
                                    Sec &quot;{sec.letra}&quot;
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Secundaria Accordion */}
              <div className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => setIsSecundariaOpen(!isSecundariaOpen)}
                  className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                >
                  <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <span>🎓</span> Secundaria (5 Grados)
                  </span>
                  <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isSecundariaOpen ? 'rotate-180' : ''}`} />
                </button>

                {isSecundariaOpen && (
                  <div className="pl-3 space-y-0.5 border-l border-emerald-200/60 dark:border-emerald-900/40 ml-3">
                    {secundariaGrades.map(grade => {
                      const gradeSections = sections.filter(s => s.grado_id === grade.id);
                      const isGradeOpen = openGradeId === grade.id;

                      return (
                        <div key={grade.id}>
                          <button
                            type="button"
                            onClick={() => setOpenGradeId(isGradeOpen ? null : grade.id)}
                            className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors"
                          >
                            <span>{grade.nombre}</span>
                            <span className="text-[10px] text-slate-400">{isGradeOpen ? '▴' : '▾'}</span>
                          </button>

                          {isGradeOpen && (
                            <div className="pl-3 py-1 flex items-center gap-1.5">
                              {gradeSections.map(sec => {
                                const isSecActive = pathname === `/admin/secciones/${sec.id}`;
                                return (
                                  <Link
                                    key={sec.id}
                                    href={`/admin/secciones/${sec.id}`}
                                    onClick={handleLinkClick}
                                    className={`px-2.5 py-0.5 rounded-md text-[10px] font-black transition-all ${
                                      isSecActive
                                        ? 'bg-emerald-600 text-white shadow-sm'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-emerald-100 hover:text-emerald-700'
                                    }`}
                                  >
                                    Sec &quot;{sec.letra}&quot;
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </nav>
      </div>

      {/* Bottom: Grade Scale Info */}
      <div className="p-4 pt-2">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-800 dark:to-slate-900 text-white border border-slate-700/50 shadow-xl">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center shrink-0">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="text-[10px] font-bold text-white">Escala MINEDU CNEB</span>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {[
              { g: 'AD', c: 'bg-emerald-500' },
              { g: 'A', c: 'bg-blue-500' },
              { g: 'B', c: 'bg-amber-500' },
              { g: 'C', c: 'bg-rose-500' },
            ].map(({ g, c }) => (
              <div key={g} className="text-center">
                <div className={`${c} rounded-md py-0.5 text-[9px] font-black text-white`}>{g}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}

