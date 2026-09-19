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
  Palette,
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
  const { currentUser, gradeLevels, sections, isSidebarCollapsed, getTeacherSections, brandingConfig } = useApp();

  const [isInicialOpen, setIsInicialOpen] = useState(false);
  const [isPrimariaOpen, setIsPrimariaOpen] = useState(true);
  const [isSecundariaOpen, setIsSecundariaOpen] = useState(false);
  const [isTeacherAulasOpen, setIsTeacherAulasOpen] = useState(true);

  const teacherSections = React.useMemo(() => {
    if (currentUser?.rol !== 'docente') return [];
    const fromContext = getTeacherSections(currentUser.id);
    if (fromContext && fromContext.length > 0) return fromContext;
    const defaultSec = sections.find(s => s.id === 'sec-3pri-a') || sections[0];
    return defaultSec ? [{ seccion: defaultSec, cursos: [] }] : [];
  }, [currentUser, getTeacherSections, sections]);

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
      section: 'EVALUACIÓN & LMS',
      items: [
        { href: '/admin/notas-salon', label: 'Consolidado de Calificaciones', icon: Award, badge: 'CNEB' },
        { href: '/admin/tareas', label: 'Tareas & Actividades', icon: FileText },
        { href: '/admin/evaluaciones', label: 'Evaluaciones & Exámenes', icon: CheckSquare },
      ]
    },
    {
      section: 'ASISTENCIA & QR',
      items: [
        { href: '/asistencia', label: 'Terminal Kiosco QR', icon: QrCode, badge: '● Live', badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
      ]
    },
    {
      section: 'REPORTES & ANALÍTICA',
      items: [
        { href: '/admin/reportes', label: 'Reportes & Actas Oficiales', icon: BarChart3 },
      ]
    },
    {
      section: 'SEGURIDAD & ROLES',
      items: [
        { href: '/admin/usuarios', label: 'Gestión de Usuarios & Roles', icon: ShieldCheck, badge: 'RBAC' },
      ]
    },
    {
      section: 'AUDITORÍA & ALERTAS',
      items: [
        { href: '/admin/alertas', label: 'Centro de Alertas & Logs', icon: Bell, badge: 'KPIs' },
      ]
    },
    {
      section: 'CONFIGURACIÓN & MARCA',
      items: [
        { href: '/admin/branding', label: 'Branding & SEO Institucional', icon: Palette, badge: 'Marca & SEO', badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' },
      ]
    }
  ];

  const docenteNav: NavSection[] = [
    {
      section: 'PANEL DOCENTE',
      items: [
        { href: '/docente', label: 'Mi Panel Diario', icon: LayoutDashboard },
        { href: '/docente/asistencia', label: 'Pase de Asistencia Rápido', icon: QrCode, badge: '● Live', badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
      ]
    },
    {
      section: 'GESTIÓN PEDAGÓGICA',
      items: [
        { href: '/docente/horario', label: 'Mi Horario Semanal', icon: Calendar },
        { href: '/docente/notas', label: 'Registro de Calificaciones', icon: Award, badge: 'CNEB' },
      ]
    },
    {
      section: 'LMS & AULA VIRTUAL',
      items: [
        { href: '/docente/tareas', label: 'Tareas & Actividades', icon: FileText },
        { href: '/docente/evaluaciones', label: 'Evaluaciones Programadas', icon: CheckSquare },
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
        { href: '/apoderado/tareas', label: 'Tareas y Deberes', icon: FileText, badge: 'LMS' },
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

  const sidebarStyleClasses = React.useMemo(() => {
    const style = brandingConfig?.sidebarStyle || 'dark';
    if (style === 'gradient') {
      return 'bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 text-slate-100 border-r border-indigo-500/20';
    }
    if (style === 'glass') {
      return 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-slate-200/70 dark:border-slate-800 shadow-xl';
    }
    // dark (default)
    return 'bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800';
  }, [brandingConfig?.sidebarStyle]);

  return (
    <aside 
      style={
        isMobileDrawer 
          ? undefined 
          : { 
              width: isDesktopCollapsed ? '80px' : '288px',
              minWidth: isDesktopCollapsed ? '80px' : '288px',
              transition: 'width 300ms cubic-bezier(0.4, 0, 0.2, 1), min-width 300ms cubic-bezier(0.4, 0, 0.2, 1)',
            }
      }
      className={
        isMobileDrawer 
          ? `flex flex-col h-full w-full select-none ${sidebarStyleClasses}` 
          : `hidden md:flex flex-col h-full select-none shrink-0 overflow-hidden ${sidebarStyleClasses}`
      }
    >
      {/* Header Institucional */}
      <div className={`flex items-center border-b border-slate-100 dark:border-slate-800/80 shrink-0 transition-all duration-300 ${
        isDesktopCollapsed ? 'justify-center py-4 px-2' : 'justify-between px-4 py-4'
      }`}>
        <Link 
          href={currentUser?.rol ? `/${currentUser.rol}` : '/login'}
          className="flex items-center gap-3 min-w-0 overflow-hidden group"
          title={brandingConfig?.nombreInstitucion || "ColeSistemaMini"}
        >
          {brandingConfig?.logoUrl ? (
            <img 
              src={brandingConfig.logoUrl} 
              alt={brandingConfig.nombreInstitucion || 'Logo'} 
              className="w-10 h-10 rounded-xl object-contain bg-white border border-slate-200/80 dark:border-slate-700 shadow-md shrink-0 group-hover:scale-105 transition-transform p-0.5" 
            />
          ) : (
            <div 
              style={{
                background: `linear-gradient(135deg, ${brandingConfig?.primaryColor || '#4f46e5'} 0%, ${brandingConfig?.accentColor || '#3b82f6'} 100%)`
              }}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md font-black text-base shrink-0 group-hover:scale-105 transition-transform"
            >
              {brandingConfig?.siglas || 'CS'}
            </div>
          )}
          {!isDesktopCollapsed && (
            <div className="min-w-0 overflow-hidden whitespace-nowrap animate-in fade-in duration-200">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight truncate">
                {brandingConfig?.nombreInstitucion || 'ColeSistemaMini'}
              </h2>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                {brandingConfig?.slogan || 'SaaS EdTech Multi-Nivel'}
              </p>
            </div>
          )}
        </Link>

        {/* Close button ONLY for mobile drawer */}
        {isMobileDrawer && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Scroll Area */}
      <div className={`flex-1 overflow-y-auto space-y-6 custom-scrollbar transition-all duration-300 ${
        isDesktopCollapsed ? 'px-2 py-3 space-y-3' : 'px-3.5 py-4'
      }`}>
        {currentNav.map((sec, idx) => (
          <div key={idx} className="space-y-1">
            {!isDesktopCollapsed ? (
              <h3 className="px-3 text-[10px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500 mb-1.5 whitespace-nowrap animate-in fade-in duration-200">
                {sec.section}
              </h3>
            ) : (
              idx > 0 && <div className="h-px bg-slate-100 dark:bg-slate-800 my-2 mx-1" />
            )}

            <div className="space-y-1">
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
                        <span className="truncate whitespace-nowrap">{item.label}</span>
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
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap ${
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

        {/* Explorador de Aulas por Nivel (Solo Admin, visible en modo expandido) */}
        {currentUser?.rol === 'admin' && !isDesktopCollapsed && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2 animate-in fade-in duration-200">
            <h3 className="px-3 text-[10px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500 whitespace-nowrap">
              SECCIONES POR NIVEL
            </h3>

            {/* Inicial Accordion */}
            <div className="rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden bg-slate-50/50 dark:bg-slate-800/20">
              <button
                type="button"
                onClick={() => setIsInicialOpen(!isInicialOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer whitespace-nowrap"
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
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer whitespace-nowrap"
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
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer whitespace-nowrap"
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

        {/* Mis Aulas Designadas (Solo Docente, visible en modo expandido) */}
        {currentUser?.rol === 'docente' && !isDesktopCollapsed && teacherSections.length > 0 && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center justify-between px-3">
              <h3 className="text-[10px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500 whitespace-nowrap">
                MIS AULAS DESIGNADAS
              </h3>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
                {teacherSections.length}
              </span>
            </div>

            <div className="rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden bg-slate-50/50 dark:bg-slate-800/20 p-2 space-y-1.5">
              {teacherSections.map((ts) => (
                <div
                  key={ts.seccion.id}
                  className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-white text-[11px]">
                      {ts.seccion.grado?.nombre} &quot;{ts.seccion.letra}&quot;
                    </span>
                    <span className="text-[9px] font-semibold text-slate-400 uppercase">
                      {ts.seccion.grado?.nivel}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800 text-[10px]">
                    <Link
                      href="/docente/asistencia"
                      onClick={handleLinkClick}
                      className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Asistencia
                    </Link>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <Link
                      href="/docente/notas"
                      onClick={handleLinkClick}
                      className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Calificar
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className={`border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/40 shrink-0 transition-all duration-300 ${
        isDesktopCollapsed ? 'p-2 flex flex-col items-center justify-center' : 'p-3.5'
      }`}>
        {!isDesktopCollapsed ? (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap animate-in fade-in duration-200">
              <span className="font-semibold">Año Escolar 2026</span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                II Bimestre
              </span>
            </div>
            {currentUser?.rol === 'docente' && (
              <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1 pt-0.5">
                <ShieldCheck className="w-3 h-3" />
                <span>Perfil Pedagógico Scoped</span>
              </div>
            )}
          </div>
        ) : (
          <div 
            className="text-[10px] font-bold text-slate-400 text-center py-1 cursor-default"
            title="Año Escolar 2026 – II Bimestre (Rol Docente)"
          >
            2026
          </div>
        )}
      </div>
    </aside>
  );
}
