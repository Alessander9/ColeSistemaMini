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
  Award, 
  FileText, 
  Calendar, 
  Sparkles, 
  GraduationCap, 
  ChevronRight, 
  ChevronLeft,
  ChevronDown,
  BarChart3, 
  School,
  Layers,
  Bell,
  Settings,
  ShieldCheck,
  CheckSquare,
  Clock,
  HelpCircle,
  LucideIcon,
  HeartHandshake,
  PanelLeftClose,
  PanelLeftOpen,
  X
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
  const { currentUser, gradeLevels, sections, isSidebarCollapsed, toggleSidebar } = useApp();

  const [isInicialOpen, setIsInicialOpen] = useState(false);
  const [isPrimariaOpen, setIsPrimariaOpen] = useState(true);
  const [isSecundariaOpen, setIsSecundariaOpen] = useState(false);

  // In mobile drawer, always expand full width
  const isCollapsed = !isMobileDrawer && isSidebarCollapsed;

  const handleLinkClick = () => {
    if (isMobileDrawer && onClose) {
      onClose();
    }
  };

  // 10 Secciones Estructuradas para Administrador
  const adminNav: NavSection[] = [
    {
      section: 'INICIO',
      items: [
        { href: '/admin', label: 'Dashboard General', icon: LayoutDashboard },
      ]
    },
    {
      section: 'ACADÉMICO',
      items: [
        { href: '/admin/academico', label: 'Estructura & Niveles', icon: School, badge: '3 Niveles' },
        { href: '/admin/horarios', label: 'Malla de Horarios', icon: Calendar, badge: 'Anti-cruce' },
      ]
    },
    {
      section: 'ESTUDIANTES',
      items: [
        { href: '/admin/estudiantes', label: 'Directorio Estudiantil', icon: Users },
        { href: '/admin/matriculas', label: 'Matrículas (Wizard)', icon: UserPlus, badge: '2026' },
      ]
    },
    {
      section: 'DOCENTES',
      items: [
        { href: '/admin/docentes', label: 'Plana Docente & Tutorías', icon: GraduationCap },
      ]
    },
    {
      section: 'EVALUACIÓN',
      items: [
        { href: '/admin/notas-salon', label: 'Consolidado de Calificaciones', icon: Award, badge: 'CNEB' },
      ]
    },
    {
      section: 'ASISTENCIA & QR',
      items: [
        { href: '/asistencia', label: 'Terminal Kiosco QR', icon: QrCode, badge: '● Live', badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
      ]
    },
    {
      section: 'LMS & AULA VIRTUAL',
      items: [
        { href: '/docente/tareas', label: 'Tareas & Actividades', icon: FileText },
        { href: '/docente/evaluaciones', label: 'Evaluaciones Programadas', icon: CheckSquare },
      ]
    },
    {
      section: 'REPORTES & ANALÍTICA',
      items: [
        { href: '/admin/reportes', label: 'Reportes & Actas Oficiales', icon: BarChart3 },
      ]
    },
    {
      section: 'AUDITORÍA & ALERTAS',
      items: [
        { href: '/admin', label: 'Centro de Alertas & Logs', icon: Bell, badge: 'KPIs' },
      ]
    }
  ];

  const docenteNav: NavSection[] = [
    {
      section: 'INICIO',
      items: [
        { href: '/docente', label: 'Mi Panel Diario', icon: LayoutDashboard },
        { href: '/docente/asistencia', label: 'Pase de Asistencia Rápido', icon: QrCode, badge: '● Live', badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
      ]
    },
    {
      section: 'GESTIÓN PEDAGÓGICA',
      items: [
        { href: '/docente/horario', label: 'Mi Horario Semanal', icon: Calendar },
        { href: '/docente/notas', label: 'Registro de Notas (Spreadsheet)', icon: Award, badge: '4 Bim' },
      ]
    },
    {
      section: 'LMS & TAREAS',
      items: [
        { href: '/docente/tareas', label: 'Tareas & Entregas', icon: FileText },
        { href: '/docente/evaluaciones', label: 'Exámenes & Prácticas', icon: CheckSquare },
      ]
    }
  ];

  const estudianteNav: NavSection[] = [
    {
      section: 'INICIO',
      items: [
        { href: '/estudiante', label: 'Mi Panel de Aprendizaje', icon: LayoutDashboard },
      ]
    },
    {
      section: 'RENDIMIENTO ACADÉMICO',
      items: [
        { href: '/estudiante/libreta-notas', label: 'Libreta Oficial de Notas', icon: Award, badge: 'PDF' },
        { href: '/estudiante/asistencias', label: 'Historial de Asistencia', icon: Clock },
        { href: '/estudiante/horario', label: 'Mi Horario Escolar', icon: Calendar },
      ]
    },
    {
      section: 'LMS & DEBERES',
      items: [
        { href: '/estudiante/tareas', label: 'Mis Tareas & Entregas', icon: FileText },
        { href: '/estudiante/evaluaciones', label: 'Calendario de Exámenes', icon: CheckSquare },
      ]
    },
    {
      section: 'CREDENCIAL DIGITAL',
      items: [
        { href: '/estudiante/carnet-qr', label: 'Mi Carnet con Código QR', icon: QrCode },
      ]
    }
  ];

  const apoderadoNav: NavSection[] = [
    {
      section: 'PANEL DE FAMILIA',
      items: [
        { href: '/apoderado', label: 'Seguimiento de Hijos', icon: HeartHandshake, badge: 'Multi-Hijo' },
      ]
    },
    {
      section: 'REPORTES & CONSULTAS',
      items: [
        { href: '/estudiante/libreta-notas', label: 'Libreta de Notas del Hijo', icon: Award },
        { href: '/estudiante/asistencias', label: 'Asistencia y Puntualidad', icon: Clock },
        { href: '/estudiante/tareas', label: 'Tareas y Deberes', icon: FileText },
      ]
    }
  ];

  const asistenciaNav: NavSection[] = [
    {
      section: 'CONTROL DE INGRESO',
      items: [
        { href: '/asistencia', label: 'Terminal Kiosco QR', icon: QrCode, badge: 'Portería' },
        { href: '/admin/reportes', label: 'Reporte de Asistencias', icon: FileText },
      ]
    }
  ];

  const currentNav = 
    currentUser?.rol === 'admin' ? adminNav :
    currentUser?.rol === 'docente' ? docenteNav :
    currentUser?.rol === 'apoderado' ? apoderadoNav :
    currentUser?.rol === 'asistencia' ? asistenciaNav :
    estudianteNav;

  const inicialGrades = gradeLevels.filter(g => g.nivel === 'inicial');
  const primariaGrades = gradeLevels.filter(g => g.nivel === 'primaria');
  const secundariaGrades = gradeLevels.filter(g => g.nivel === 'secundaria');

  const isDesktopCollapsed = !isMobileDrawer && isSidebarCollapsed;

  return (
    <aside 
      className={
        isMobileDrawer 
          ? 'flex flex-col h-full w-full bg-white dark:bg-slate-900 select-none' 
          : `hidden md:flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 select-none shrink-0 transition-all duration-300 ease-in-out ${
              isDesktopCollapsed ? 'w-20' : 'w-72'
            }`
      }
    >
      {/* Header Institucional */}
      <div className={`flex items-center border-b border-slate-100 dark:border-slate-800/80 shrink-0 transition-all duration-300 ${
        isDesktopCollapsed ? 'flex-col justify-center py-3.5 px-2 gap-2' : 'justify-between px-4 py-4'
      }`}>
        <Link 
          href={currentUser?.rol ? `/${currentUser.rol}` : '/login'}
          className="flex items-center gap-3 min-w-0 overflow-hidden group"
          title="ColeSistemaMini"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 font-black text-lg shrink-0 group-hover:scale-105 transition-transform">
            CS
          </div>
          {!isDesktopCollapsed && (
            <div className="min-w-0 overflow-hidden animate-in fade-in duration-200">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight truncate">
                ColeSistemaMini
              </h2>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                SaaS EdTech Multi-Nivel
              </p>
            </div>
          )}
        </Link>

        {/* Toggle Button / Close Mobile Button */}
        {isMobileDrawer ? (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={toggleSidebar}
            className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors cursor-pointer"
            title={isDesktopCollapsed ? "Expandir barra lateral" : "Colapsar barra lateral"}
            aria-label={isDesktopCollapsed ? "Expandir menú" : "Colapsar menú"}
          >
            {isDesktopCollapsed ? (
              <PanelLeftOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-in zoom-in-75 duration-150" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* Navigation Scroll Area */}
      <div className={`flex-1 overflow-y-auto space-y-6 custom-scrollbar transition-all duration-300 ${
        isDesktopCollapsed ? 'px-2 py-3 space-y-4' : 'px-3.5 py-4'
      }`}>
        {currentNav.map((sec, idx) => (
          <div key={idx} className="space-y-1">
            {!isDesktopCollapsed ? (
              <h3 className="px-3 text-[10px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500 mb-1.5 animate-in fade-in duration-200">
                {sec.section}
              </h3>
            ) : (
              idx > 0 && <div className="h-px bg-slate-100 dark:bg-slate-800 my-2 mx-1" />
            )}

            <div className="space-y-0.5">
              {sec.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleLinkClick}
                    title={isDesktopCollapsed ? `${item.label} (${sec.section})` : undefined}
                    className={`relative flex items-center rounded-xl text-xs font-medium transition-all group ${
                      isDesktopCollapsed
                        ? `justify-center w-11 h-11 mx-auto ${
                            isActive
                              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 ring-2 ring-indigo-400/20'
                              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400'
                          }`
                        : `justify-between px-3 py-2 ${
                            isActive
                              ? 'bg-indigo-600 text-white font-semibold shadow-sm shadow-indigo-600/20'
                              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                          }`
                    }`}
                  >
                    <div className={`flex items-center gap-2.5 min-w-0 ${isDesktopCollapsed ? 'justify-center' : ''}`}>
                      <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                      }`} />
                      {!isDesktopCollapsed && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </div>

                    {/* Badge display */}
                    {item.badge && (
                      isDesktopCollapsed ? (
                        <span 
                          className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900"
                          title={item.badge}
                        />
                      ) : (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : item.badgeColor || 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                        }`}>
                          {item.badge}
                        </span>
                      )
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* Explorador de Aulas por Nivel (Solo Admin) */}
        {currentUser?.rol === 'admin' && !isDesktopCollapsed && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2 animate-in fade-in duration-200">
            <h3 className="px-3 text-[10px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500">
              SECCIONES POR NIVEL
            </h3>

            {/* Inicial Accordion */}
            <div className="rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden bg-slate-50/50 dark:bg-slate-800/20">
              <button
                type="button"
                onClick={() => setIsInicialOpen(!isInicialOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span>🧸</span> Inicial (3-5 Años)
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isInicialOpen ? 'rotate-180' : ''}`} />
              </button>
              {isInicialOpen && (
                <div className="p-2 space-y-1 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                  {inicialGrades.map(grade => {
                    const gradeSections = sections.filter(s => s.grado_id === grade.id);
                    return (
                      <div key={grade.id} className="text-xs">
                        <span className="text-[11px] font-medium text-slate-500 px-2 block py-0.5">{grade.nombre}:</span>
                        <div className="flex flex-wrap gap-1 px-2 pb-1">
                          {gradeSections.map(sec => (
                            <Link
                              key={sec.id}
                              href={`/admin/secciones/${sec.id}`}
                              onClick={handleLinkClick}
                              className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition-colors"
                            >
                              Aula {sec.letra}
                            </Link>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Primaria Accordion */}
            <div className="rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden bg-slate-50/50 dark:bg-slate-800/20">
              <button
                type="button"
                onClick={() => setIsPrimariaOpen(!isPrimariaOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span>📚</span> Primaria (1°-6° Grado)
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isPrimariaOpen ? 'rotate-180' : ''}`} />
              </button>
              {isPrimariaOpen && (
                <div className="p-2 space-y-1 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                  {primariaGrades.map(grade => {
                    const gradeSections = sections.filter(s => s.grado_id === grade.id);
                    return (
                      <div key={grade.id} className="text-xs">
                        <span className="text-[11px] font-medium text-slate-500 px-2 block py-0.5">{grade.nombre}:</span>
                        <div className="flex flex-wrap gap-1 px-2 pb-1">
                          {gradeSections.map(sec => (
                            <Link
                              key={sec.id}
                              href={`/admin/secciones/${sec.id}`}
                              onClick={handleLinkClick}
                              className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition-colors"
                            >
                              Aula {sec.letra}
                            </Link>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Secundaria Accordion */}
            <div className="rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden bg-slate-50/50 dark:bg-slate-800/20">
              <button
                type="button"
                onClick={() => setIsSecundariaOpen(!isSecundariaOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span>🎓</span> Secundaria (1°-5° Año)
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isSecundariaOpen ? 'rotate-180' : ''}`} />
              </button>
              {isSecundariaOpen && (
                <div className="p-2 space-y-1 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                  {secundariaGrades.map(grade => {
                    const gradeSections = sections.filter(s => s.grado_id === grade.id);
                    return (
                      <div key={grade.id} className="text-xs">
                        <span className="text-[11px] font-medium text-slate-500 px-2 block py-0.5">{grade.nombre}:</span>
                        <div className="flex flex-wrap gap-1 px-2 pb-1">
                          {gradeSections.map(sec => (
                            <Link
                              key={sec.id}
                              href={`/admin/secciones/${sec.id}`}
                              onClick={handleLinkClick}
                              className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition-colors"
                            >
                              Aula {sec.letra}
                            </Link>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className={`border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/40 shrink-0 transition-all duration-300 ${
        isDesktopCollapsed ? 'p-2 flex flex-col items-center gap-1.5' : 'p-3.5 flex items-center justify-between'
      }`}>
        {!isDesktopCollapsed ? (
          <>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 w-full">
              <span className="font-semibold">Año Escolar 2026</span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                II Bimestre
              </span>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={toggleSidebar}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer transition-all hover:scale-105 active:scale-95"
            title="Expandir menú lateral"
            aria-label="Expandir menú lateral"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
}
