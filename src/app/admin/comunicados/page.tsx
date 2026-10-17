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
import { sendResendEmail } from '@/lib/services/resendService';

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

const CATEGORY_STYLE = {
  general: { label: 'Circular general', icon: Megaphone, chip: 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300', solid: 'bg-sky-500' },
  academico: { label: 'Académico', icon: BookOpen, chip: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300', solid: 'bg-blue-600' },
  citacion: { label: 'Citación', icon: Users, chip: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300', solid: 'bg-rose-500' },
  urgente: { label: 'Urgente', icon: AlertTriangle, chip: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300', solid: 'bg-amber-500' },
  evento: { label: 'Evento', icon: Sparkles, chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300', solid: 'bg-emerald-500' },
};
const categoryStyle = (c?: string) => CATEGORY_STYLE[c as keyof typeof CATEGORY_STYLE] || CATEGORY_STYLE.general;
const ROLE_LABEL: Record<string, string> = { todos: 'Toda la comunidad', apoderado: 'Padres / apoderados', estudiante: 'Alumnos', docente: 'Docentes', admin: 'Dirección' };
const LEVEL_LABEL: Record<string, string> = { inicial: 'Inicial', primaria: 'Primaria', secundaria: 'Secundaria' };
const CHANNEL_STYLE: Record<string, { label: string; icon: React.ElementType; cls: string }> = {
  sistema: { label: 'Web', icon: Bell, cls: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300' },
  email: { label: 'Correo', icon: Mail, cls: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' },
  whatsapp: { label: 'WhatsApp', icon: MessageCircle, cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' },
};
// "2026-09-29" → "29 set 2026" (sin desfase de zona horaria)
const niceDate = (iso?: string) => {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' }).replace('.', '');
};

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
    showToast,
    brandingConfig
  } = useApp();
  const [isSendingEmails, setIsSendingEmails] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('todos');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>('todos');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('todos');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>('todos');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('todos');
  const [quickFilter, setQuickFilter] = useState<'todos' | 'urgentes' | 'citaciones' | 'confirmacion'>('todos');
  const [showMoreFilters, setShowMoreFilters] = useState(false);

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
      const matchQuick =
        quickFilter === 'todos' ||
        (quickFilter === 'urgentes' && ann.es_urgente) ||
        (quickFilter === 'citaciones' && ann.categoria === 'citacion') ||
        (quickFilter === 'confirmacion' && ann.requiere_confirmacion);

      return matchSearch && matchRole && matchLevel && matchGrade && matchSection && matchCategory && matchQuick;
    });
  }, [announcements, searchTerm, selectedRoleFilter, selectedLevelFilter, selectedGradeFilter, selectedSectionFilter, selectedCategoryFilter, quickFilter]);

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

  // Correos reales de los destinatarios según la segmentación elegida (sin repetidos)
  const recipientEmails = useMemo(() => {
    const sectionOf = (id: string) => sections.find(s => s.id === id);
    let targetEnrollments = enrollments.filter(e => e.estado === 'activo');
    if (formData.nivel_destinatario !== 'todos') {
      targetEnrollments = targetEnrollments.filter(e => (sectionOf(e.seccion_id)?.grado?.nivel || e.seccion?.grado?.nivel) === formData.nivel_destinatario);
    }
    if (formData.grado_id) {
      targetEnrollments = targetEnrollments.filter(e => (sectionOf(e.seccion_id)?.grado_id || e.seccion?.grado_id) === formData.grado_id);
    }
    if (formData.seccion_id) {
      targetEnrollments = targetEnrollments.filter(e => e.seccion_id === formData.seccion_id);
    }
    const targetStudents = targetEnrollments
      .map(e => students.find(s => s.id === e.estudiante_id) || e.estudiante)
      .filter((s): s is NonNullable<typeof s> => !!s);

    const rol = formData.destinatarios_rol;
    const out: { email: string; name?: string }[] = [];
    if (rol === 'todos' || rol === 'apoderado') {
      targetStudents.forEach(s => {
        const parent = users.find(u => u.id === s.apoderado_id);
        out.push({ email: parent?.email || s.email_apoderado || '', name: parent ? `${parent.nombres} ${parent.apellidos}`.trim() : s.nombre_apoderado });
      });
    }
    if (rol === 'todos' || rol === 'estudiante') {
      targetStudents.forEach(s => {
        const account = users.find(u => u.id === s.profile_id) || s.profile;
        out.push({ email: account?.email || '', name: `${s.nombres || account?.nombres || ''} ${s.apellidos || account?.apellidos || ''}`.trim() });
      });
    }
    if (rol === 'todos' || rol === 'docente') {
      const tutorId = formData.seccion_id ? sectionOf(formData.seccion_id)?.tutor_id : undefined;
      teachers
        .filter(t => t.activo !== false && (!formData.seccion_id || t.id === tutorId))
        .forEach(t => out.push({ email: t.email || '', name: `${t.nombres} ${t.apellidos}` }));
    }
    if (rol === 'admin') {
      users.filter(u => u.rol === 'admin' && u.activo !== false).forEach(u => out.push({ email: u.email || '', name: `${u.nombres} ${u.apellidos}` }));
    }

    const seen = new Set<string>();
    return out.filter(r => {
      const key = r.email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(key) || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [formData.destinatarios_rol, formData.nivel_destinatario, formData.grado_id, formData.seccion_id, enrollments, sections, students, users, teachers]);

  const sendAnnouncementEmails = async (titulo: string, contenido: string, esUrgente: boolean) => {
    const recipients = recipientEmails;
    if (recipients.length === 0) {
      showToast('Ningún destinatario tiene correo registrado. El comunicado quedó solo en el portal.', 'warning', 'Sin correos');
      return;
    }
    setIsSendingEmails(true);
    let sent = 0, failed = 0, simulated = false;
    for (const r of recipients) {
      const res = await sendResendEmail({
        type: 'comunicado',
        recipientEmail: r.email,
        recipientName: r.name,
        titulo,
        contenido,
        esUrgente,
        remitente: `${currentUser.nombres} ${currentUser.apellidos}`.trim(),
        loginUrl: typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined,
        branding: brandingConfig,
      });
      if (res.success) { sent++; if (res.simulated) simulated = true; } else { failed++; }
    }
    setIsSendingEmails(false);
    if (simulated) {
      showToast(`Resend no está configurado: se simularon ${sent} correos y no salió ninguno. Configura RESEND_API_KEY para enviarlos de verdad.`, 'warning', 'Correo simulado', 7000);
    } else if (failed > 0) {
      showToast(`Se enviaron ${sent} correos y fallaron ${failed}.`, 'warning', 'Envío parcial');
    } else {
      showToast(`Se enviaron ${sent} correos.`, 'success', '✉️ Correos enviados');
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titulo.trim() || !formData.contenido.trim()) {
      showToast('Por favor complete el título y contenido del comunicado', 'warning');
      return;
    }
    const emailCopy = formData.canales.includes('email')
      ? { titulo: formData.titulo.trim(), contenido: formData.contenido.trim(), esUrgente: formData.es_urgente }
      : null;

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

    showToast(`Comunicado publicado en el portal para ${targetAudienceEstimate.totalRecipients} destinatarios`, 'success', '📢 Comunicado publicado');
    if (emailCopy) void sendAnnouncementEmails(emailCopy.titulo, emailCopy.contenido, emailCopy.esUrgente);
  };

  const handleCopyWhatsAppText = (ann: Announcement) => {
    const text = `*COLEGIO - COMUNICADO OFICIAL*\n\n📌 *${ann.titulo}*\n\n${ann.contenido}\n\n📅 Fecha: ${ann.fecha_publicacion}\n👤 Emitido por: ${ann.remitente_nombre}`;
    navigator.clipboard.writeText(text);
    showToast('Texto copiado para enviar por WhatsApp Web o grupos de aula', 'success', '📋 Copiado');
  };

  const activeFilters = [selectedRoleFilter, selectedLevelFilter, selectedGradeFilter, selectedSectionFilter].filter(v => v !== 'todos').length;
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedRoleFilter('todos');
    setSelectedLevelFilter('todos');
    setSelectedGradeFilter('todos');
    setSelectedSectionFilter('todos');
    setSelectedCategoryFilter('todos');
    setQuickFilter('todos');
  };
  const hasAnyFilter = !!searchTerm || activeFilters > 0 || selectedCategoryFilter !== 'todos' || quickFilter !== 'todos';

  return (
    <div className="space-y-5 max-w-7xl mx-auto animate-fade-in pb-16 font-sans">

      {/* ── 1. ENCABEZADO (claro y sobrio) ── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-500" />
        <div className="p-5 sm:p-6 space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div className="max-w-2xl space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Portal web, correo y texto para WhatsApp
              </span>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                <Megaphone className="w-8 h-8 text-violet-600" /> Comunicados
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Envía avisos, circulares y citaciones a padres, alumnos o docentes. Puedes dirigirlos a todo el colegio, a un nivel, a un grado o a una sola aula.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-black text-sm shadow-md shadow-violet-600/20 transition-all active:scale-95 cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" /> {isSendingEmails ? 'Enviando correos…' : 'Nuevo comunicado'}
            </button>
          </div>

          {/* Resumen: cada tarjeta filtra la lista */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {([
              { id: 'todos', label: 'Enviados', value: stats.total, icon: Megaphone, hint: 'en total', tone: 'bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300', ring: 'ring-violet-500' },
              { id: 'urgentes', label: 'Urgentes', value: stats.urgentCount, icon: AlertTriangle, hint: 'marcados urgentes', tone: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300', ring: 'ring-amber-500' },
              { id: 'citaciones', label: 'Citaciones', value: stats.citacionesCount, icon: Users, hint: 'reuniones con padres', tone: 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300', ring: 'ring-rose-500' },
              { id: 'confirmacion', label: 'Piden confirmar', value: stats.withConfirmationCount, icon: CheckSquare, hint: 'esperan respuesta', tone: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300', ring: 'ring-emerald-500' },
            ] as const).map(k => {
              const active = quickFilter === k.id;
              return (
                <button
                  key={k.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setQuickFilter(active && k.id !== 'todos' ? 'todos' : k.id)}
                  className={`text-left p-3.5 rounded-2xl border bg-slate-50 dark:bg-slate-800/50 transition-all cursor-pointer hover:shadow-sm ${active ? `border-transparent ring-2 ${k.ring} bg-white dark:bg-slate-900` : 'border-slate-100 dark:border-slate-800'}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${k.tone}`}><k.icon className="w-5 h-5" /></span>
                    <div className="min-w-0">
                      <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">{k.value}</p>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mt-1">{k.label}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{k.hint}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── 2. BUSCAR Y FILTRAR ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por título, contenido o quién lo envió..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowMoreFilters(v => !v)}
              aria-expanded={showMoreFilters}
              className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm font-bold cursor-pointer ${showMoreFilters || activeFilters > 0 ? 'bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}
            >
              <Filter className="w-4 h-4" /> ¿A quién va dirigido?{activeFilters > 0 && <span className="px-1.5 rounded-full bg-violet-600 text-white text-xs">{activeFilters}</span>}
            </button>
            {hasAnyFilter && (
              <button type="button" onClick={clearFilters} className="inline-flex items-center gap-1 px-3 py-2.5 rounded-xl text-sm font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer">
                <X className="w-4 h-4" /> Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Tipo de comunicado en chips de color */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedCategoryFilter('todos')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border cursor-pointer transition-all ${selectedCategoryFilter === 'todos' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-400'}`}
          >
            Todos
          </button>
          {(Object.keys(CATEGORY_STYLE) as (keyof typeof CATEGORY_STYLE)[]).map(key => {
            const c = CATEGORY_STYLE[key];
            const active = selectedCategoryFilter === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedCategoryFilter(active ? 'todos' : key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border cursor-pointer transition-all ${active ? `${c.solid} text-white border-transparent shadow-sm` : `${c.chip} border-transparent hover:shadow-sm`}`}
              >
                <c.icon className="w-3.5 h-3.5" /> {c.label}
                <span className={`px-1.5 rounded-full text-[10px] ${active ? 'bg-white/25' : 'bg-white/70 dark:bg-slate-900/40'}`}>{announcements.filter(a => a.categoria === key).length}</span>
              </button>
            );
          })}
        </div>

        {showMoreFilters && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-top-1 duration-150">
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Dirigido a</label>
              <select value={selectedRoleFilter} onChange={(e) => setSelectedRoleFilter(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-sm font-semibold rounded-xl px-3 py-2">
                <option value="todos">Toda la comunidad</option>
                <option value="apoderado">Padres / apoderados</option>
                <option value="estudiante">Alumnos</option>
                <option value="docente">Docentes</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Nivel</label>
              <select
                value={selectedLevelFilter}
                onChange={(e) => { setSelectedLevelFilter(e.target.value); setSelectedGradeFilter('todos'); setSelectedSectionFilter('todos'); }}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-sm font-semibold rounded-xl px-3 py-2"
              >
                <option value="todos">Todos los niveles</option>
                <option value="inicial">Inicial</option>
                <option value="primaria">Primaria</option>
                <option value="secundaria">Secundaria</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Grado</label>
              <select
                value={selectedGradeFilter}
                onChange={(e) => { setSelectedGradeFilter(e.target.value); setSelectedSectionFilter('todos'); }}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-sm font-semibold rounded-xl px-3 py-2"
              >
                <option value="todos">Todos los grados</option>
                {gradeLevels.filter(g => selectedLevelFilter === 'todos' || g.nivel === selectedLevelFilter).map(g => (
                  <option key={g.id} value={g.id}>{g.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Aula</label>
              <select value={selectedSectionFilter} onChange={(e) => setSelectedSectionFilter(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-sm font-semibold rounded-xl px-3 py-2">
                <option value="todos">Todas las aulas</option>
                {sections
                  .filter(s => (selectedGradeFilter === 'todos' || s.grado_id === selectedGradeFilter) && (selectedLevelFilter === 'todos' || s.grado?.nivel === selectedLevelFilter))
                  .map(s => (
                    <option key={s.id} value={s.id}>{s.grado?.nombre} &quot;{s.letra}&quot;</option>
                  ))}
              </select>
            </div>
          </div>
        )}

        <p className="text-sm text-slate-500 dark:text-slate-400">
          <strong className="text-slate-900 dark:text-white">{filteredAnnouncements.length}</strong> {filteredAnnouncements.length === 1 ? 'comunicado' : 'comunicados'}
        </p>
      </div>

      {/* ── 3. LISTA DE COMUNICADOS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAnnouncements.map((ann) => {
          const targetSection = sections.find(s => s.id === ann.seccion_id);
          const targetGrade = gradeLevels.find(g => g.id === ann.grado_id);
          const confirmCount = ann.confirmado_por?.length || 0;
          const readCount = ann.leido_por?.length || 1;
          const c = categoryStyle(ann.categoria);
          const channels = ann.canales && ann.canales.length > 0 ? ann.canales : ['sistema'];
          const audience = [
            ann.nivel_destinatario === 'todos' ? 'Todo el colegio' : LEVEL_LABEL[ann.nivel_destinatario] || ann.nivel_destinatario,
            targetGrade?.nombre,
            targetSection ? `Aula "${targetSection.letra}"` : undefined,
          ].filter(Boolean).join(' · ');

          return (
            <div
              key={ann.id}
              className={`relative rounded-2xl border bg-white dark:bg-slate-900 overflow-hidden flex flex-col transition-all hover:shadow-lg hover:-translate-y-0.5 ${ann.es_urgente ? 'border-rose-300 dark:border-rose-800' : 'border-slate-200/80 dark:border-slate-800'}`}
            >
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${c.solid}`} />
              <div className="p-4 pl-5 space-y-3 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${c.chip}`}>
                      <c.icon className="w-3.5 h-3.5" /> {c.label}
                    </span>
                    {ann.es_urgente && ann.categoria !== 'urgente' && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                        <AlertTriangle className="w-3.5 h-3.5" /> Urgente
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-violet-500" /> {niceDate(ann.fecha_publicacion)}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white line-clamp-1">{ann.titulo}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed whitespace-pre-line">{ann.contenido}</p>
                </div>

                {ann.categoria === 'citacion' && (ann.fecha_citacion || ann.hora_citacion) && (
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-xs font-semibold text-rose-800 dark:text-rose-200">
                    <span className="inline-flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {ann.fecha_citacion ? niceDate(ann.fecha_citacion) : 'Por coordinar'} · {ann.hora_citacion || '08:00'}</span>
                    {ann.lugar_citacion && <span className="inline-flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {ann.lugar_citacion}</span>}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold">
                    <Users className="w-3.5 h-3.5" /> {ROLE_LABEL[ann.destinatarios_rol || 'todos'] || 'Toda la comunidad'}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 font-semibold">
                    <School className="w-3.5 h-3.5" /> {audience}
                  </span>
                  {channels.map(ch => {
                    const cs = CHANNEL_STYLE[ch];
                    return cs ? (
                      <span key={ch} className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg font-semibold ${cs.cls}`}><cs.icon className="w-3.5 h-3.5" /> {cs.label}</span>
                    ) : null;
                  })}
                </div>
              </div>

              <div className="px-4 pl-5 py-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30 flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
                  <span className="inline-flex items-center gap-1" title="Personas que lo leyeron"><Eye className="w-3.5 h-3.5 text-violet-500" /> {readCount} {readCount === 1 ? 'lectura' : 'lecturas'}</span>
                  {ann.requiere_confirmacion && (
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400" title="Confirmaciones recibidas"><CheckCircle2 className="w-3.5 h-3.5" /> {confirmCount} {confirmCount === 1 ? 'confirmó' : 'confirmaron'}</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <button type="button" onClick={() => handleCopyWhatsAppText(ann)} className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 transition-colors cursor-pointer" title="Copiar texto para WhatsApp">
                    <MessageCircle className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => setSelectedAnnouncement(ann)} className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-colors cursor-pointer">
                    Ver detalle
                  </button>
                  <button type="button" onClick={() => deleteAnnouncement(ann.id)} className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer" title="Eliminar comunicado">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredAnnouncements.length === 0 && (
          <div className="col-span-full text-center py-14 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 p-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white flex items-center justify-center mx-auto mb-3"><Megaphone className="w-7 h-7" /></div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">{announcements.length === 0 ? 'Aún no has enviado comunicados' : 'No hay comunicados con estos filtros'}</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              {announcements.length === 0 ? 'Envía el primero con el botón "Nuevo comunicado".' : 'Prueba con otro tipo o quita los filtros.'}
            </p>
            {hasAnyFilter && (
              <button type="button" onClick={clearFilters} className="mt-3 inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 text-sm font-bold cursor-pointer"><X className="w-4 h-4" /> Quitar filtros</button>
            )}
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

                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={formData.canales.includes('email')}
                    onChange={(e) => setFormData({
                      ...formData,
                      canales: e.target.checked
                        ? Array.from(new Set([...formData.canales, 'email' as const]))
                        : formData.canales.filter(c => c !== 'email'),
                    })}
                    className="w-4 h-4 rounded-md text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">Enviar también por correo</span>
                    <span className="text-[10px] text-slate-400">
                      {recipientEmails.length > 0
                        ? `${recipientEmails.length} ${recipientEmails.length === 1 ? 'destinatario tiene' : 'destinatarios tienen'} correo registrado`
                        : 'Ningún destinatario de esta segmentación tiene correo registrado'}
                    </span>
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
