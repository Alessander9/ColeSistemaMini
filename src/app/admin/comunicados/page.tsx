'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  Megaphone, 
  Plus, 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Users, 
  Trash2, 
  Eye, 
  Send, 
  Sparkles, 
  Building2, 
  GraduationCap, 
  School, 
  BookOpen, 
  FileText, 
  Tag, 
  Info,
  X,
  Pin,
  MessageCircle,
  Mail,
  Bell,
  CheckSquare,
  Copy,
  ExternalLink,
  Layers,
  MapPin,
  Video
} from 'lucide-react';
import { UserRole, EducationalLevel, Announcement } from '@/types';

// Predefined quick templates for rapid official school broadcasting
const QUICK_TEMPLATES: {
  title: string;
  category: Announcement['categoria'];
  isUrgent: boolean;
  requiresConfirmation: boolean;
  subject: string;
  body: string;
}[] = [
  {
    title: '📢 Citación a Reunión de Padres de Familia',
    category: 'citacion',
    isUrgent: true,
    requiresConfirmation: true,
    subject: 'Citación Oficial a Reunión de Apoderados — I Bimestre',
    body: 'Estimados Padres de Familia y Apoderados:\n\nSe les convoca cordialmente a la Primera Reunión Ordinaria de Padres de Familia con la finalidad de coordinar el progreso pedagógico y normativo del presente año lectivo. Su asistencia y puntualidad son de suma importancia para el acompañamiento educativo de su menor hijo(a).\n\nFavor de confirmar su asistencia a través de este medio.',
  },
  {
    title: '📄 Entrega Oficial de Libretas de Calificaciones',
    category: 'academico',
    isUrgent: false,
    requiresConfirmation: true,
    subject: 'Publicación y Entrega de Libretas de Calificaciones CNEB',
    body: 'Estimada Comunidad Educativa:\n\nCumplimos con informarles que las Libretas de Calificaciones correspondientes al presente periodo lectivo ya se encuentran disponibles para su consulta y descarga en formato PDF a través del Portal del Apoderado.\n\nLos tutores atenderán consultas individuales en el horario de atención a padres.',
  },
  {
    title: '🏖️ Feriado Calendario Escolar & Suspensión de Labores',
    category: 'general',
    isUrgent: false,
    requiresConfirmation: false,
    subject: 'Suspensión de Actividades Escolares por Feriado Nacional',
    body: 'Estimadas familias y personal institucional:\n\nDe acuerdo con la calendarización oficial del Ministerio de Educación (MINEDU), se informa que este día no habrá actividades escolares ni administrativas. Las clases se reanudarán con normalidad el siguiente día hábil.',
  },
  {
    title: '📝 Cronograma de Evaluaciones Bimestrales',
    category: 'academico',
    isUrgent: false,
    requiresConfirmation: false,
    subject: 'Cronograma Oficial de Evaluaciones y Entrega de Evidencias',
    body: 'Estimados estudiantes y apoderados:\n\nPonemos a su disposición el rol oficial de evaluaciones bimestrales. Les recordamos que los estudiantes deben asistir puntualmente y portar sus útiles completos. En caso de inasistencia justificada por salud, presentar la constancia respectiva para la reprogramación.',
  },
  {
    title: '🚨 Comunicado Urgente de Seguridad / Emergencia',
    category: 'urgente',
    isUrgent: true,
    requiresConfirmation: true,
    subject: 'Alerta Institucional — Medidas Preventivas de Seguridad',
    body: 'COMUNICADO URGENTE A TODA LA COMUNIDAD EDUCATIVA:\n\nPor disposición de la Dirección General y en salvaguarda de la integridad de nuestros estudiantes, se informa una modificación en el horario de ingreso/salida. Rogamos tomar las previsiones del caso.',
  },
];

export default function AdminComunicadosPage() {
  const { 
    announcements, 
    addAnnouncement, 
    deleteAnnouncement, 
    currentUser,
    gradeLevels,
    sections,
    students,
    enrollments,
    teachers,
    users,
    showToast
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('todos');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>('todos');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('todos');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>('todos');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('todos');
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  // Form State for new Mass Announcement
  const [formData, setFormData] = useState({
    titulo: '',
    contenido: '',
    categoria: 'general' as Announcement['categoria'],
    destinatarios_rol: 'todos' as UserRole | 'todos',
    nivel_destinatario: 'todos' as EducationalLevel | 'todos',
    grado_id: '',
    seccion_id: '',
    es_urgente: false,
    requiere_confirmacion: false,
    fecha_expiracion: '',
    canales: ['sistema'] as ('sistema' | 'email' | 'whatsapp')[],
    fecha_citacion: '',
    hora_citacion: '',
    lugar_citacion: 'Aula de Clases',
    enlace_reunion: '',
  });

  // Filter available grades in form according to selected educational level
  const formAvailableGrades = useMemo(() => {
    if (formData.nivel_destinatario === 'todos') return gradeLevels;
    return gradeLevels.filter(g => g.nivel === formData.nivel_destinatario);
  }, [gradeLevels, formData.nivel_destinatario]);

  // Filter available sections in form according to selected grade
  const formAvailableSections = useMemo(() => {
    if (!formData.grado_id) {
      if (formData.nivel_destinatario === 'todos') return sections;
      return sections.filter(s => s.grado?.nivel === formData.nivel_destinatario);
    }
    return sections.filter(s => s.grado_id === formData.grado_id);
  }, [sections, formData.grado_id, formData.nivel_destinatario]);

  // Real-time audience calculation (reach estimate)
  const targetAudienceEstimate = useMemo(() => {
    // 1. Students / Enrollments
    let targetEnrollments = enrollments.filter(e => e.estado === 'activo');
    if (formData.nivel_destinatario !== 'todos') {
      targetEnrollments = targetEnrollments.filter(e => e.seccion?.grado?.nivel === formData.nivel_destinatario);
    }
    if (formData.grado_id) {
      targetEnrollments = targetEnrollments.filter(e => e.seccion?.grado_id === formData.grado_id);
    }
    if (formData.seccion_id) {
      targetEnrollments = targetEnrollments.filter(e => e.seccion_id === formData.seccion_id);
    }

    const studentsCount = targetEnrollments.length;
    
    // 2. Teachers / Staff
    let teachersCount = teachers.filter(t => t.activo).length;
    if (formData.seccion_id) {
      const sec = sections.find(s => s.id === formData.seccion_id);
      teachersCount = sec?.tutor_id ? 1 : 0;
    }

    // Role filtering multiplier
    if (formData.destinatarios_rol === 'apoderado') {
      return { totalRecipients: studentsCount, breakdown: `${studentsCount} Familias / Apoderados` };
    }
    if (formData.destinatarios_rol === 'estudiante') {
      return { totalRecipients: studentsCount, breakdown: `${studentsCount} Estudiantes` };
    }
    if (formData.destinatarios_rol === 'docente') {
      return { totalRecipients: teachersCount, breakdown: `${teachersCount} Docentes` };
    }
    if (formData.destinatarios_rol === 'admin') {
      return { totalRecipients: 3, breakdown: `3 Miembros de Dirección` };
    }

    return { 
      totalRecipients: studentsCount * 2 + teachersCount, 
      breakdown: `${studentsCount} Estudiantes, ${studentsCount} Apoderados y ${teachersCount} Docentes` 
    };
  }, [formData, enrollments, teachers, sections]);

  // Main announcements table filter
  const filteredAnnouncements = useMemo(() => {
    return announcements.filter(ann => {
      const matchSearch = 
        ann.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ann.contenido.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ann.remitente_nombre.toLowerCase().includes(searchTerm.toLowerCase());

      const matchRole = selectedRoleFilter === 'todos' || ann.destinatarios_rol === selectedRoleFilter || ann.destinatarios_rol === 'todos';
      const matchLevel = selectedLevelFilter === 'todos' || ann.nivel_destinatario === selectedLevelFilter || ann.nivel_destinatario === 'todos';
      const matchGrade = selectedGradeFilter === 'todos' || !ann.grado_id || ann.grado_id === selectedGradeFilter;
      const matchSection = selectedSectionFilter === 'todos' || !ann.seccion_id || ann.seccion_id === selectedSectionFilter;
      const matchCategory = selectedCategoryFilter === 'todos' || ann.categoria === selectedCategoryFilter;

      return matchSearch && matchRole && matchLevel && matchGrade && matchSection && matchCategory;
    });
  }, [announcements, searchTerm, selectedRoleFilter, selectedLevelFilter, selectedGradeFilter, selectedSectionFilter, selectedCategoryFilter]);

  const stats = useMemo(() => {
    const total = announcements.length;
    const urgentCount = announcements.filter(a => a.es_urgente).length;
    const citacionesCount = announcements.filter(a => a.categoria === 'citacion').length;
    const withConfirmationCount = announcements.filter(a => a.requiere_confirmacion).length;

    return { total, urgentCount, citacionesCount, withConfirmationCount };
  }, [announcements]);

  const handleApplyTemplate = (tpl: typeof QUICK_TEMPLATES[0]) => {
    setFormData(prev => ({
      ...prev,
      titulo: tpl.subject,
      contenido: tpl.body,
      categoria: tpl.category,
      es_urgente: tpl.isUrgent,
      requiere_confirmacion: tpl.requiresConfirmation,
    }));
    showToast(`Plantilla "${tpl.title}" cargada`, 'info', 'Plantilla Aplicada');
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titulo.trim() || !formData.contenido.trim()) {
      showToast('Por favor complete el título y contenido del comunicado', 'warning');
      return;
    }

    addAnnouncement({
      titulo: formData.titulo.trim(),
      contenido: formData.contenido.trim(),
      categoria: formData.categoria,
      remitente_nombre: `${currentUser.nombres} ${currentUser.apellidos}`,
      remitente_rol: currentUser.rol,
      destinatarios_rol: formData.destinatarios_rol,
      nivel_destinatario: formData.nivel_destinatario,
      grado_id: formData.grado_id || undefined,
      seccion_id: formData.seccion_id || undefined,
      es_urgente: formData.es_urgente,
      requiere_confirmacion: formData.requiere_confirmacion,
      canales: formData.canales,
      fecha_publicacion: new Date().toISOString().split('T')[0],
      fecha_expiracion: formData.fecha_expiracion || undefined,
      fecha_citacion: formData.categoria === 'citacion' ? formData.fecha_citacion : undefined,
      hora_citacion: formData.categoria === 'citacion' ? formData.hora_citacion : undefined,
      lugar_citacion: formData.categoria === 'citacion' ? formData.lugar_citacion : undefined,
      enlace_reunion: formData.categoria === 'citacion' ? formData.enlace_reunion : undefined,
      confirmado_por: [],
      leido_por: [currentUser.id],
    });

    setIsCreateModalOpen(false);
    setFormData({
      titulo: '',
      contenido: '',
      categoria: 'general',
      destinatarios_rol: 'todos',
      nivel_destinatario: 'todos',
      grado_id: '',
      seccion_id: '',
      es_urgente: false,
      requiere_confirmacion: false,
      fecha_expiracion: '',
      canales: ['sistema'],
      fecha_citacion: '',
      hora_citacion: '',
      lugar_citacion: 'Aula de Clases',
      enlace_reunion: '',
    });

    showToast(`Comunicado difundido exitosamente a ${targetAudienceEstimate.totalRecipients} destinatarios`, 'success', '📢 Difusión Masiva');
  };

  const handleCopyWhatsAppText = (ann: Announcement) => {
    const text = `*COLEGIO - COMUNICADO OFICIAL*\n\n📌 *${ann.titulo}*\n\n${ann.contenido}\n\n📅 Fecha: ${ann.fecha_publicacion}\n👤 Emitido por: ${ann.remitente_nombre}`;
    navigator.clipboard.writeText(text);
    showToast('Texto copiado para enviar por WhatsApp Web o grupos de aula', 'success', '📋 Copiado');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-16 font-sans">
      
      {/* ── 1. HEADER BANNER CON GRADIENT PREMIUM ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0d153a] via-[#172054] to-[#0f1738] text-white p-6 sm:p-8 shadow-2xl border border-slate-800">
        
        {/* Glow Effects */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
        <div className="absolute bottom-0 right-10 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl pointer-events-none translate-y-1/3" />
        <div className="absolute -left-10 top-1/2 w-60 h-60 bg-purple-600/15 rounded-full blur-2xl pointer-events-none -translate-y-1/2" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#21163e]/80 text-purple-200 border border-purple-500/30 flex items-center gap-1.5 shadow-xs">
              <Megaphone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Plataforma de Comunicación Masiva & Citaciones</span>
            </span>
            <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#0d2828]/80 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Canales Activos • Web, Email & WhatsApp</span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all active:scale-95 cursor-pointer self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Emitir Nuevo Comunicado</span>
          </button>
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 my-6">
          <div className="max-w-2xl">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              Circulares & <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-300 bg-clip-text text-transparent">
                Comunicados Escolares
              </span>
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-3 leading-relaxed max-w-xl">
              Difunde avisos oficiales, circulares normativas y citaciones a padres con segmentación precisa por Nivel (Inicial, Primaria, Secundaria), Grados y Secciones específicas.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
            <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-md">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">Total Emitidos</span>
              <span className="text-2xl font-black text-white mt-1 block">{stats.total}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-md">
              <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">Urgentes</span>
              <span className="text-2xl font-black text-amber-300 mt-1 block">{stats.urgentCount}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-md">
              <span className="text-[10px] font-bold text-rose-300 uppercase tracking-wider block">Citaciones</span>
              <span className="text-2xl font-black text-rose-300 mt-1 block">{stats.citacionesCount}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-md">
              <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider block">Con Confirmación</span>
              <span className="text-2xl font-black text-emerald-300 mt-1 block">{stats.withConfirmationCount}</span>
            </div>
          </div>
        </div>

      </div>

      {/* ── 2. FILTROS Y BÚSQUEDA MULTINIVEL ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Search Box */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Buscar por título, contenido o autor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          {/* Quick Clear Filter */}
          {(selectedRoleFilter !== 'todos' || selectedLevelFilter !== 'todos' || selectedGradeFilter !== 'todos' || selectedSectionFilter !== 'todos' || selectedCategoryFilter !== 'todos') && (
            <button
              onClick={() => {
                setSelectedRoleFilter('todos');
                setSelectedLevelFilter('todos');
                setSelectedGradeFilter('todos');
                setSelectedSectionFilter('todos');
                setSelectedCategoryFilter('todos');
              }}
              className="text-xs text-rose-600 dark:text-rose-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" /> Limpiar filtros
            </button>
          )}

        </div>

        {/* Granular Segment Selectors */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          
          {/* Nivel */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Nivel Educativo</label>
            <select
              value={selectedLevelFilter}
              onChange={(e) => {
                setSelectedLevelFilter(e.target.value);
                setSelectedGradeFilter('todos');
                setSelectedSectionFilter('todos');
              }}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="todos">Todos los Niveles</option>
              <option value="inicial">Inicial (3, 4, 5 años)</option>
              <option value="primaria">Primaria (1° a 6°)</option>
              <option value="secundaria">Secundaria (1° a 5°)</option>
            </select>
          </div>

          {/* Grado */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Grado Escolar</label>
            <select
              value={selectedGradeFilter}
              onChange={(e) => {
                setSelectedGradeFilter(e.target.value);
                setSelectedSectionFilter('todos');
              }}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="todos">Todos los Grados</option>
              {gradeLevels
                .filter(g => selectedLevelFilter === 'todos' || g.nivel === selectedLevelFilter)
                .map(g => (
                  <option key={g.id} value={g.id}>{g.nombre}</option>
                ))}
            </select>
          </div>

          {/* Sección */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Sección / Aula</label>
            <select
              value={selectedSectionFilter}
              onChange={(e) => setSelectedSectionFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="todos">Todas las Secciones</option>
              {sections
                .filter(s => (selectedGradeFilter === 'todos' || s.grado_id === selectedGradeFilter) && (selectedLevelFilter === 'todos' || s.grado?.nivel === selectedLevelFilter))
                .map(s => (
                  <option key={s.id} value={s.id}>{s.grado?.nombre} &quot;{s.letra}&quot;</option>
                ))}
            </select>
          </div>

          {/* Destinatario Rol */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Dirigido A</label>
            <select
              value={selectedRoleFilter}
              onChange={(e) => setSelectedRoleFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="todos">Toda la Comunidad</option>
              <option value="apoderado">Solo Apoderados / Padres</option>
              <option value="estudiante">Solo Estudiantes</option>
              <option value="docente">Solo Docentes</option>
            </select>
          </div>

          {/* Categoría */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Tipo de Circular</label>
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="todos">Todas las Categorías</option>
              <option value="general">Circular General</option>
              <option value="academico">Académico / Evaluaciones</option>
              <option value="citacion">Citación a Reunión</option>
              <option value="urgente">Alerta Urgente</option>
              <option value="evento">Evento / Actividad</option>
            </select>
          </div>

        </div>
      </div>

      {/* ── 3. LISTA DE COMUNICADOS EMITIDOS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAnnouncements.map((ann) => {
          const targetSection = sections.find(s => s.id === ann.seccion_id);
          const targetGrade = gradeLevels.find(g => g.id === ann.grado_id);
          const confirmCount = ann.confirmado_por?.length || 0;
          const readCount = ann.leido_por?.length || 1;

          return (
            <div 
              key={ann.id}
              className={`p-5 rounded-3xl border transition-all hover:shadow-md bg-white dark:bg-slate-900 flex flex-col justify-between ${
                ann.es_urgente 
                  ? 'border-rose-500/40 dark:border-rose-500/30 ring-1 ring-rose-500/20' 
                  : 'border-slate-200/80 dark:border-slate-800'
              }`}
            >
              <div className="space-y-3">
                
                {/* Badges Header */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      ann.categoria === 'citacion' ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800' :
                      ann.categoria === 'urgente' ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800' :
                      ann.categoria === 'academico' ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800' :
                      'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}>
                      {ann.categoria}
                    </span>

                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                      {ann.nivel_destinatario === 'todos' ? 'Todos los Niveles' : `Educación ${ann.nivel_destinatario}`}
                    </span>

                    {targetGrade && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {targetGrade.nombre}
                      </span>
                    )}

                    {targetSection && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        Sec. &quot;{targetSection.letra}&quot;
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {ann.fecha_publicacion}
                  </span>
                </div>

                {/* Title & Body Preview */}
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1">
                    {ann.titulo}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 line-clamp-3 leading-relaxed whitespace-pre-line">
                    {ann.contenido}
                  </p>
                </div>

                {/* If Citation: Detailed meeting pill */}
                {ann.categoria === 'citacion' && (ann.fecha_citacion || ann.hora_citacion) && (
                  <div className="p-3 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40 text-xs text-rose-950 dark:text-rose-200 space-y-1">
                    <div className="flex items-center gap-2 font-bold">
                      <Calendar className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                      <span>Fecha: {ann.fecha_citacion || 'Por coordinar'} · {ann.hora_citacion || '08:00 AM'}</span>
                    </div>
                    {ann.lugar_citacion && (
                      <div className="flex items-center gap-2 text-[11px] text-rose-700 dark:text-rose-300">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Lugar: {ann.lugar_citacion}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Delivery Channels */}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Canales:</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    <Bell className="w-3 h-3 text-indigo-500" /> Web
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    <Mail className="w-3 h-3 text-blue-500" /> Email
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    <MessageCircle className="w-3 h-3 text-emerald-500" /> WhatsApp
                  </span>
                </div>

              </div>

              {/* Footer Actions */}
              <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span title="Lecturas en el sistema">👁️ {readCount} leídos</span>
                  {ann.requiere_confirmacion && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold" title="Confirmaciones de asistencia">
                      ✓ {confirmCount} confirmados
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleCopyWhatsAppText(ann)}
                    className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200/60 dark:border-emerald-900/60 transition-colors cursor-pointer"
                    title="Copiar texto para WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedAnnouncement(ann)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Ver Detalle
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteAnnouncement(ann.id)}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    title="Eliminar comunicado"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          );
        })}

        {filteredAnnouncements.length === 0 && (
          <div className="col-span-full text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
            <Megaphone className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No se encontraron comunicados</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Ajusta los filtros de nivel, grado o destinatario, o emite una nueva circular institucional.
            </p>
          </div>
        )}
      </div>

      {/* ── 4. MODAL: EMITIR NUEVO COMUNICADO MASIVO ── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-2xl w-full my-8 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">Emitir Comunicado Masivo</h3>
                  <p className="text-xs text-slate-500">Configure la segmentación de destinatarios y canales de difusión.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Quick Templates Selector */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Cargar Plantilla Rápida
              </label>
              <div className="flex flex-wrap gap-2">
                {QUICK_TEMPLATES.map((tpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyTemplate(tpl)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-700 dark:text-slate-300 hover:text-indigo-600 text-[11px] font-semibold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                  >
                    {tpl.title}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              
              {/* Título */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Asunto / Título Oficial</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Citación a Reunión de Padres de Familia..."
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* Segmentación Granular (Nivel, Grado, Sección, Rol) */}
              <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-3">
                <span className="text-xs font-black text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" /> Segmentación de Audiencia
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Nivel</label>
                    <select
                      value={formData.nivel_destinatario}
                      onChange={(e) => setFormData({ ...formData, nivel_destinatario: e.target.value as any, grado_id: '', seccion_id: '' })}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs font-semibold"
                    >
                      <option value="todos">Todos los Niveles</option>
                      <option value="inicial">Inicial</option>
                      <option value="primaria">Primaria</option>
                      <option value="secundaria">Secundaria</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Grado</label>
                    <select
                      value={formData.grado_id}
                      onChange={(e) => setFormData({ ...formData, grado_id: e.target.value, seccion_id: '' })}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs font-semibold"
                    >
                      <option value="">Todos los Grados</option>
                      {formAvailableGrades.map(g => (
                        <option key={g.id} value={g.id}>{g.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Sección</label>
                    <select
                      value={formData.seccion_id}
                      onChange={(e) => setFormData({ ...formData, seccion_id: e.target.value })}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs font-semibold"
                    >
                      <option value="">Todas las Aulas</option>
                      {formAvailableSections.map(s => (
                        <option key={s.id} value={s.id}>{s.grado?.nombre} &quot;{s.letra}&quot;</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Dirigido a</label>
                    <select
                      value={formData.destinatarios_rol}
                      onChange={(e) => setFormData({ ...formData, destinatarios_rol: e.target.value as any })}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs font-semibold"
                    >
                      <option value="todos">Toda la Comunidad</option>
                      <option value="apoderado">Solo Apoderados</option>
                      <option value="estudiante">Solo Estudiantes</option>
                      <option value="docente">Solo Docentes</option>
                    </select>
                  </div>
                </div>

                {/* Audience reach banner */}
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200/50 dark:border-indigo-900/50 flex items-center justify-between text-xs font-bold text-indigo-950 dark:text-indigo-200">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-indigo-600" /> Alcance Estimado:
                  </span>
                  <span className="text-indigo-600 dark:text-indigo-400">{targetAudienceEstimate.breakdown}</span>
                </div>
              </div>

              {/* Categoría & Urgente */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Categoría</label>
                  <select
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value as any })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold"
                  >
                    <option value="general">Circular General</option>
                    <option value="citacion">Citación a Reunión</option>
                    <option value="academico">Académico / Evaluaciones</option>
                    <option value="urgente">Alerta Urgente</option>
                    <option value="evento">Evento Cultural / Deportivo</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Fecha de Expiración (Opcional)</label>
                  <input
                    type="date"
                    value={formData.fecha_expiracion}
                    onChange={(e) => setFormData({ ...formData, fecha_expiracion: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              {/* Si es Citación: Campos de fecha y lugar */}
              {formData.categoria === 'citacion' && (
                <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-900/40 space-y-3">
                  <span className="text-xs font-black text-rose-900 dark:text-rose-300 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-rose-600" /> Datos de la Citación
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Fecha</label>
                      <input
                        type="date"
                        required={formData.categoria === 'citacion'}
                        value={formData.fecha_citacion}
                        onChange={(e) => setFormData({ ...formData, fecha_citacion: e.target.value })}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Hora</label>
                      <input
                        type="time"
                        value={formData.hora_citacion}
                        onChange={(e) => setFormData({ ...formData, hora_citacion: e.target.value })}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Lugar / Aula</label>
                      <input
                        type="text"
                        placeholder="Ej: Aula 3° Primaria o Auditorio"
                        value={formData.lugar_citacion}
                        onChange={(e) => setFormData({ ...formData, lugar_citacion: e.target.value })}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Contenido */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Cuerpo del Comunicado</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Escriba el contenido completo del comunicado oficial..."
                  value={formData.contenido}
                  onChange={(e) => setFormData({ ...formData, contenido: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* Toggles: Urgente & Confirmación */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.es_urgente}
                    onChange={(e) => setFormData({ ...formData, es_urgente: e.target.checked })}
                    className="w-4 h-4 rounded-md text-rose-600 focus:ring-rose-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">Marcar como URGENTE</span>
                    <span className="text-[10px] text-slate-400">Aparecerá en rojo destacado en todos los portales</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.requiere_confirmacion}
                    onChange={(e) => setFormData({ ...formData, requiere_confirmacion: e.target.checked })}
                    className="w-4 h-4 rounded-md text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">Requiere Confirmación</span>
                    <span className="text-[10px] text-slate-400">El apoderado debe confirmar asistencia/recepción</span>
                  </div>
                </label>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white text-xs font-black shadow-lg shadow-indigo-600/30 cursor-pointer transition-all hover:scale-102"
                >
                  📢 Difundir Comunicado
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ── 5. MODAL: DETALLE DEL COMUNICADO ── */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                selectedAnnouncement.categoria === 'citacion' ? 'bg-rose-100 text-rose-700' : 'bg-indigo-100 text-indigo-700'
              }`}>
                {selectedAnnouncement.categoria}
              </span>
              <button
                type="button"
                onClick={() => setSelectedAnnouncement(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {selectedAnnouncement.titulo}
              </h3>
              <p className="text-xs text-slate-400">
                Emitido el {selectedAnnouncement.fecha_publicacion} por <strong>{selectedAnnouncement.remitente_nombre}</strong>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed max-h-60 overflow-y-auto">
              {selectedAnnouncement.contenido}
            </div>

            {selectedAnnouncement.categoria === 'citacion' && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-xs text-rose-900 dark:text-rose-200 space-y-1">
                <p><strong>Fecha Citación:</strong> {selectedAnnouncement.fecha_citacion || '---'} a las {selectedAnnouncement.hora_citacion || '---'}</p>
                <p><strong>Lugar:</strong> {selectedAnnouncement.lugar_citacion || 'Aula escolar'}</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
              <span>Leído por {selectedAnnouncement.leido_por?.length || 1} personas</span>
              <button
                type="button"
                onClick={() => handleCopyWhatsAppText(selectedAnnouncement)}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" /> Copiar para WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
