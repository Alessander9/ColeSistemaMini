'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { DataTable } from '@/components/ui/DataTable';
import { AvatarUploader } from '@/components/ui/AvatarUploader';
import { 
  Users, 
  UserPlus, 
  GraduationCap, 
  BookOpen, 
  Calendar, 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  CheckCircle2, 
  Copy, 
  Key, 
  Mail, 
  Phone, 
  Sparkles, 
  Building2, 
  School,
  Award,
  Layers,
  Clock,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import Link from 'next/link';

export default function AdminDocentesPage() {
  const { 
    teachers, 
    addTeacher, 
    courses, 
    sections, 
    gradeLevels, 
    sectionCourses, 
    assignCourseToSection, 
    removeSectionCourse,
    getTeacherSections 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'profesores' | 'asignaciones' | 'registro'>('profesores');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEspecialidad, setFilterEspecialidad] = useState('todas');
  const [filterNivel, setFilterNivel] = useState<'todos' | 'primaria' | 'secundaria'>('todos');

  // Modal Nuevo Docente
  const [isNewTeacherModalOpen, setIsNewTeacherModalOpen] = useState(false);
  const [newTeacherData, setNewTeacherData] = useState({
    nombres: '',
    apellidos: '',
    dni: '',
    telefono: '',
    email: '',
    especialidad: 'Matemática',
    avatar_url: '',
  });

  // Modal Credenciales Creadas
  const [createdCredentials, setCreatedCredentials] = useState<{
    teacherName: string;
    username: string;
    password: string;
    email: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Modal Ficha 360° del Docente (Pop-up)
  const [selectedTeacherForDetail, setSelectedTeacherForDetail] = useState<any>(null);

  // Modal Asignar Materia a Salón
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [horasSemanales, setHorasSemanales] = useState<number>(4);
  const [aulaDefecto, setAulaDefecto] = useState<string>('Aula 301');
  const [assignSuccess, setAssignSuccess] = useState(false);

  // Stats calculation
  const totalDocentes = teachers.length;
  const totalAsignaciones = sectionCourses.length;
  const totalHoras = sectionCourses.reduce((acc, curr) => acc + (curr.horas_semanales || 0), 0);
  const promedioHorasDocente = totalDocentes > 0 ? Math.round(totalHoras / totalDocentes) : 0;

  // Filtered teachers
  const filteredTeachers = teachers.filter((t) => {
    const matchesSearch = 
      `${t.nombres} ${t.apellidos}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.dni.includes(searchTerm) ||
      t.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEsp = filterEspecialidad === 'todas' || t.especialidad === filterEspecialidad;
    return matchesSearch && matchesEsp;
  });

  // Filtered assignments
  const filteredAssignments = sectionCourses.filter((sca) => {
    const sec = sections.find(s => s.id === sca.seccion_id);
    const crs = courses.find(c => c.id === sca.curso_id);
    const doc = teachers.find(t => t.id === sca.docente_id);

    const matchesNivel = filterNivel === 'todos' || sec?.grado?.nivel === filterNivel;
    const matchesSearch = 
      `${doc?.nombres} ${doc?.apellidos}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      crs?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sec?.grado?.nombre.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesNivel && matchesSearch;
  });

  const handleRegisterTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacherData.nombres || !newTeacherData.apellidos || !newTeacherData.dni) return;

    const res = addTeacher({
      nombres: newTeacherData.nombres,
      apellidos: newTeacherData.apellidos,
      dni: newTeacherData.dni,
      telefono: newTeacherData.telefono,
      email: newTeacherData.email,
      especialidad: newTeacherData.especialidad,
      avatar_url: newTeacherData.avatar_url,
    });

    setCreatedCredentials({
      teacherName: `${res.teacher.nombres} ${res.teacher.apellidos}`,
      username: res.credentials.username,
      password: res.credentials.password,
      email: res.credentials.email,
    });

    // Reset
    setNewTeacherData({
      nombres: '',
      apellidos: '',
      dni: '',
      telefono: '',
      email: '',
      especialidad: 'Matemática',
      avatar_url: '',
    });
    setIsNewTeacherModalOpen(false);
  };

  const handleAssignCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacherId || !selectedSectionId || !selectedCourseId) return;

    assignCourseToSection({
      seccionId: selectedSectionId,
      cursoId: selectedCourseId,
      docenteId: selectedTeacherId,
      horasSemanales: Number(horasSemanales),
      aulaDefecto,
    });

    setAssignSuccess(true);
    setTimeout(() => {
      setAssignSuccess(false);
      setIsAssignModalOpen(false);
    }, 1200);
  };

  const openAssignForTeacher = (teacherId: string) => {
    setSelectedTeacherId(teacherId);
    if (sections.length > 0) setSelectedSectionId(sections[4]?.id || sections[0].id);
    if (courses.length > 0) setSelectedCourseId(courses[0].id);
    setIsAssignModalOpen(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <PageHeader
        title="Gestión de Docentes & Asignación Académica"
        description="Registro de profesores, emisión de credenciales y asignación de materias y salones para Primaria y Secundaria."
      >
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              if (teachers.length > 0) setSelectedTeacherId(teachers[0].id);
              if (sections.length > 0) setSelectedSectionId(sections[4]?.id || sections[0].id);
              if (courses.length > 0) setSelectedCourseId(courses[0].id);
              setIsAssignModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
          >
            <School className="w-4 h-4 text-indigo-600" />
            Asignar Salón/Materia
          </button>
          <button
            onClick={() => setIsNewTeacherModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.02]"
          >
            <UserPlus className="w-4 h-4" />
            + Registrar Nuevo Profesor
          </button>
        </div>
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Plana Docente Activa"
          value={totalDocentes}
          subtitle="Profesores especialistas"
          icon={Users}
          trend={{ value: "100%", positive: true }}
          color="indigo"
        />
        <StatCard
          title="Asignaciones Curriculares"
          value={totalAsignaciones}
          subtitle="Cursos dictados en salones"
          icon={BookOpen}
          color="emerald"
        />
        <StatCard
          title="Carga Horaria Total"
          value={`${totalHoras} hrs`}
          subtitle="Horas pedagógicas / semana"
          icon={Clock}
          color="purple"
        />
        <StatCard
          title="Promedio por Profesor"
          value={`${promedioHorasDocente} hrs`}
          subtitle="Dedicación semanal estándar"
          icon={Award}
          color="blue"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('profesores')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'profesores'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            Plana Docente ({teachers.length})
          </button>
          <button
            onClick={() => setActiveTab('asignaciones')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'asignaciones'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <School className="w-4 h-4" />
            Matriz de Salones & Cursos ({sectionCourses.length})
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, DNI o curso..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          />
        </div>
      </div>

      {/* TAB 1: PLANA DOCENTE LIST & GRID */}
      {activeTab === 'profesores' && (
        <DataTable
          data={filteredTeachers}
          itemsPerPage={10}
          searchPlaceholder="Buscar docente por nombre, apellidos, DNI o email..."
          filterChips={[
            { id: 'todas', label: 'Todas las Especialidades', count: teachers.length },
            { id: 'Matemática', label: 'Matemática' },
            { id: 'Comunicación', label: 'Comunicación' },
            { id: 'Ciencia y Tecnología', label: 'Ciencias' },
            { id: 'Inglés', label: 'Inglés' },
            { id: 'Personal Social', label: 'Personal Social' },
            { id: 'Educación Física', label: 'Educ. Física' },
          ]}
          activeFilter={filterEspecialidad}
          onFilterChange={setFilterEspecialidad}
          searchFilter={(t, q) =>
            `${t.nombres} ${t.apellidos} ${t.dni} ${t.email} ${t.especialidad}`
              .toLowerCase()
              .includes(q)
          }
          columns={[
            {
              header: 'Docente',
              cell: (docente) => (
                <div
                  onClick={() => setSelectedTeacherForDetail(docente)}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <img
                    src={docente.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(docente.nombres)}`}
                    alt={docente.nombres}
                    className="w-10 h-10 rounded-2xl object-cover ring-2 ring-indigo-500/20 group-hover:scale-105 transition-transform shrink-0"
                  />
                  <div>
                    <p className="font-extrabold text-slate-800 dark:text-white text-xs leading-tight group-hover:text-indigo-600 transition-colors">
                      {docente.apellidos}, {docente.nombres}
                    </p>
                    <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
                      {docente.especialidad}
                    </p>
                  </div>
                </div>
              ),
            },
            {
              header: 'DNI / Contacto',
              cell: (docente) => (
                <div className="text-xs">
                  <p className="font-mono font-bold text-slate-700 dark:text-slate-300">{docente.dni}</p>
                  <p className="text-[10px] text-slate-400 truncate max-w-[150px]">{docente.email}</p>
                </div>
              ),
            },
            {
              header: 'Carga Semanal',
              cell: (docente) => {
                const asigs = sectionCourses.filter(s => s.docente_id === docente.id);
                const hrs = asigs.reduce((acc, c) => acc + (c.horas_semanales || 0), 0);
                return (
                  <span className="font-extrabold text-xs px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                    {hrs} hrs/sem
                  </span>
                );
              },
            },
            {
              header: 'Salones Asignados',
              cell: (docente) => {
                const asigs = sectionCourses.filter(s => s.docente_id === docente.id);
                const uniqueSecs = Array.from(new Set(asigs.map(s => `${s.seccion?.grado?.nombre} "${s.seccion?.letra}"`)));
                return (
                  <div className="flex flex-wrap gap-1 max-w-xs">
                    {uniqueSecs.length > 0 ? (
                      uniqueSecs.slice(0, 2).map((sec, idx) => (
                        <span key={idx} className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {sec}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">Sin salones</span>
                    )}
                    {uniqueSecs.length > 2 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                        +{uniqueSecs.length - 2}
                      </span>
                    )}
                  </div>
                );
              },
            },
            {
              header: 'Acciones',
              cell: (docente) => (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setSelectedTeacherForDetail(docente)}
                    className="px-2.5 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 font-bold text-xs transition-colors"
                  >
                    Ficha 360°
                  </button>
                  <button
                    onClick={() => openAssignForTeacher(docente.id)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Asignar
                  </button>
                  <Link
                    href="/admin/horarios"
                    className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                    title="Ver Horarios"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ),
            },
          ]}
          gridItemRender={(docente) => {
            const teacherAssignments = sectionCourses.filter(s => s.docente_id === docente.id);
            const teacherHours = teacherAssignments.reduce((acc, c) => acc + (c.horas_semanales || 0), 0);
            const uniqueSections = Array.from(new Set(teacherAssignments.map(s => s.seccion?.grado?.nombre + ' ' + s.seccion?.letra)));

            return (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full group">
                <div>
                  <div
                    onClick={() => setSelectedTeacherForDetail(docente)}
                    className="flex items-start gap-3.5 mb-4 cursor-pointer"
                  >
                    <img
                      src={docente.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(docente.nombres)}`}
                      alt={docente.nombres}
                      className="w-13 h-13 rounded-2xl object-cover ring-2 ring-indigo-500/20 shrink-0 group-hover:scale-105 transition-transform"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight truncate group-hover:text-indigo-600 transition-colors">
                        {docente.nombres} {docente.apellidos}
                      </h4>
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold mt-0.5">
                        {docente.especialidad || 'Profesor Especialista'}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        <span className="font-mono font-bold">DNI: {docente.dni}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 mb-3.5 text-center">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Carga Horaria</span>
                      <p className="text-sm font-black text-slate-800 dark:text-white">{teacherHours} hrs/sem</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Salones</span>
                      <p className="text-sm font-black text-indigo-600 dark:text-indigo-400">{uniqueSections.length} salones</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 mb-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Materias Asignadas:
                    </span>
                    {teacherAssignments.length > 0 ? (
                      <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                        {teacherAssignments.map((asig) => (
                          <span
                            key={asig.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60"
                          >
                            <BookOpen className="w-2.5 h-2.5 text-indigo-500" />
                            {asig.curso?.nombre} ({asig.seccion?.grado?.numero_grado}° &quot;{asig.seccion?.letra}&quot;)
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">Sin materias asignadas aún.</p>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedTeacherForDetail(docente)}
                    className="px-3 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 font-bold text-xs transition-colors"
                  >
                    Ficha 360°
                  </button>
                  <button
                    onClick={() => openAssignForTeacher(docente.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Asignar
                  </button>
                  <Link
                    href="/admin/horarios"
                    className="px-2.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors flex items-center gap-1"
                    title="Horario"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          }}
        />
      )}

      {/* TAB 2: MATRIZ DE ASIGNACIONES TABLE */}
      {activeTab === 'asignaciones' && (
        <DataTable
          data={filteredAssignments}
          itemsPerPage={10}
          searchPlaceholder="Buscar asignación por docente, curso o salón..."
          filterChips={[
            { id: 'todos', label: 'Todos los Niveles', count: sectionCourses.length },
            { id: 'primaria', label: 'Primaria (1° a 6°)' },
            { id: 'secundaria', label: 'Secundaria (1° a 5°)' },
          ]}
          activeFilter={filterNivel}
          onFilterChange={(id) => setFilterNivel(id as 'todos' | 'primaria' | 'secundaria')}
          searchFilter={(asig, q) => {
            const doc = teachers.find(t => t.id === asig.docente_id);
            const crs = courses.find(c => c.id === asig.curso_id);
            const sec = sections.find(s => s.id === asig.seccion_id);
            return `${doc?.nombres} ${doc?.apellidos} ${crs?.nombre} ${sec?.grado?.nombre} ${sec?.letra}`
              .toLowerCase()
              .includes(q);
          }}
          columns={[
            {
              header: 'Salón / Grado',
              cell: (asig) => {
                const sec = sections.find(s => s.id === asig.seccion_id);
                return (
                  <span className="inline-flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                    <span className={`w-2 h-2 rounded-full ${sec?.grado?.nivel === 'primaria' ? 'bg-blue-500' : 'bg-purple-500'}`} />
                    {sec?.grado?.nombre} — Sección &quot;{sec?.letra}&quot;
                  </span>
                );
              },
            },
            {
              header: 'Materia / Curso',
              cell: (asig) => {
                const crs = courses.find(c => c.id === asig.curso_id);
                return (
                  <span
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold"
                    style={{
                      backgroundColor: `${crs?.color_hex || '#3b82f6'}15`,
                      color: crs?.color_hex || '#3b82f6',
                    }}
                  >
                    {crs?.nombre}
                  </span>
                );
              },
            },
            {
              header: 'Docente Responsable',
              cell: (asig) => {
                const doc = teachers.find(t => t.id === asig.docente_id);
                return (
                  <div className="flex items-center gap-2">
                    <img
                      src={doc?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(doc?.nombres || 'Docente')}`}
                      alt={doc?.nombres}
                      className="w-7 h-7 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                    />
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">
                        {doc?.nombres} {doc?.apellidos}
                      </p>
                      <p className="text-[10px] text-slate-400">{doc?.especialidad}</p>
                    </div>
                  </div>
                );
              },
            },
            {
              header: 'Horas/Sem',
              cell: (asig) => (
                <span className="font-black text-slate-800 dark:text-slate-200">
                  {asig.horas_semanales} hrs
                </span>
              ),
            },
            {
              header: 'Aula Asignada',
              cell: (asig) => (
                <span className="text-slate-600 dark:text-slate-400 font-medium">
                  {asig.aula_defecto || 'Aula regular'}
                </span>
              ),
            },
            {
              header: 'Acciones',
              cell: (asig) => (
                <button
                  onClick={() => removeSectionCourse(asig.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                  title="Eliminar asignación"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              ),
            },
          ]}
        />
      )}

      {/* MODAL 1: REGISTRAR NUEVO DOCENTE */}
      {isNewTeacherModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-scale-up">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-indigo-600/10 to-purple-600/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">
                    Registrar Nuevo Profesor
                  </h3>
                  <p className="text-xs text-slate-500">Se generará automáticamente su usuario institucional y contraseña</p>
                </div>
              </div>
              <button
                onClick={() => setIsNewTeacherModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterTeacher} className="p-6 space-y-4">
              {/* Foto de Perfil con Cloudinary */}
              <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80">
                <AvatarUploader
                  currentAvatarUrl={newTeacherData.avatar_url}
                  userName={`${newTeacherData.nombres || 'Docente'} ${newTeacherData.apellidos || ''}`.trim()}
                  onAvatarUpdated={(url) => setNewTeacherData((prev) => ({ ...prev, avatar_url: url }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nombres *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Juan Carlos"
                    value={newTeacherData.nombres}
                    onChange={(e) => setNewTeacherData({ ...newTeacherData, nombres: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Apellidos *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Quispe Flores"
                    value={newTeacherData.apellidos}
                    onChange={(e) => setNewTeacherData({ ...newTeacherData, apellidos: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    DNI (8 dígitos) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={8}
                    placeholder="Ej. 45678912"
                    value={newTeacherData.dni}
                    onChange={(e) => setNewTeacherData({ ...newTeacherData, dni: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Teléfono Celular
                  </label>
                  <input
                    type="tel"
                    placeholder="Ej. 987654321"
                    value={newTeacherData.telefono}
                    onChange={(e) => setNewTeacherData({ ...newTeacherData, telefono: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Especialidad / Área Principal *
                </label>
                <select
                  value={newTeacherData.especialidad}
                  onChange={(e) => setNewTeacherData({ ...newTeacherData, especialidad: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="Matemática">Matemática (Aritmética, Álgebra, Geometría)</option>
                  <option value="Comunicación">Comunicación y Literatura</option>
                  <option value="Ciencia y Tecnología">Ciencia y Tecnología / Laboratorio</option>
                  <option value="Inglés">Inglés como Lengua Extranjera</option>
                  <option value="Personal Social">Personal Social / Ciencias Sociales</option>
                  <option value="Educación Física">Educación Física y Deportes</option>
                  <option value="Arte y Cultura">Arte y Cultura</option>
                  <option value="Computación y Robótica">Computación y Robótica Educativa</option>
                  <option value="Educación Religiosa">Educación Religiosa</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Correo Electrónico (Opcional - se autogenera si se deja vacío)
                </label>
                <input
                  type="email"
                  placeholder="nombre.apellido@colegio.edu.pe"
                  value={newTeacherData.email}
                  onChange={(e) => setNewTeacherData({ ...newTeacherData, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewTeacherModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all"
                >
                  Guardar y Emitir Credenciales
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ASIGNAR CURSO Y SALÓN A DOCENTE */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-scale-up">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-purple-600/10 to-indigo-600/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-purple-600 text-white flex items-center justify-center">
                  <School className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">
                    Asignar Materia y Salón a Profesor
                  </h3>
                  <p className="text-xs text-slate-500">Vincula al docente con la sección y define sus horas pedagógicas</p>
                </div>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAssignCourse} className="p-6 space-y-4">
              {/* Docente */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Profesor Responsable *
                </label>
                <select
                  required
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-purple-500 font-bold text-slate-800 dark:text-white"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombres} {t.apellidos} — ({t.especialidad})
                    </option>
                  ))}
                </select>
              </div>

              {/* Salón / Sección */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Salón / Grado y Sección *
                </label>
                <select
                  required
                  value={selectedSectionId}
                  onChange={(e) => setSelectedSectionId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-purple-500 font-medium"
                >
                  <optgroup label="Primaria (6 Grados)">
                    {sections.filter(s => s.grado?.nivel === 'primaria').map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.grado?.nombre} — Sección &quot;{s.letra}&quot; (Cap. {s.capacidad_maxima})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Secundaria (5 Grados)">
                    {sections.filter(s => s.grado?.nivel === 'secundaria').map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.grado?.nombre} — Sección &quot;{s.letra}&quot; (Cap. {s.capacidad_maxima})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Curso / Materia */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Área Curricular / Materia *
                </label>
                <select
                  required
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-purple-500 font-medium"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} ({c.codigo})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Horas Semanales *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    required
                    value={horasSemanales}
                    onChange={(e) => setHorasSemanales(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-purple-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Aula por Defecto
                  </label>
                  <input
                    type="text"
                    value={aulaDefecto}
                    onChange={(e) => setAulaDefecto(e.target.value)}
                    placeholder="Ej. Aula 301 / Lab 1"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-purple-500 font-medium"
                  />
                </div>
              </div>

              {assignSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  ¡Materia asignada correctamente al salón!
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-md transition-all"
                >
                  Guardar Asignación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: FICHA 360° DEL DOCENTE (POP-UP EXPEDIENTE) */}
      {selectedTeacherForDetail && (() => {
        const teacherAssignments = sectionCourses.filter(s => s.docente_id === selectedTeacherForDetail.id);
        const teacherHours = teacherAssignments.reduce((acc, c) => acc + (c.horas_semanales || 0), 0);
        const uniqueSections = Array.from(new Set(teacherAssignments.map(s => s.seccion?.grado?.nombre + ' ' + s.seccion?.letra)));

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-scale-up">
              
              {/* Header Modal */}
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-purple-600/10 via-indigo-600/10 to-blue-600/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-slate-900 dark:text-white">
                      Expediente Digital del Docente
                    </h3>
                    <p className="text-xs text-slate-500">Ficha curricular 360°, carga horaria y salones asignados</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTeacherForDetail(null)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto space-y-5 flex-1">
                {/* Teacher Profile Card */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70">
                  <img
                    src={selectedTeacherForDetail.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedTeacherForDetail.nombres)}`}
                    alt={selectedTeacherForDetail.nombres}
                    className="w-20 h-20 rounded-2xl object-cover ring-4 ring-indigo-500/20 shadow-md"
                  />
                  <div className="flex-1 text-center sm:text-left space-y-1">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <h4 className="text-base font-black text-slate-900 dark:text-white">
                        {selectedTeacherForDetail.nombres} {selectedTeacherForDetail.apellidos}
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200">
                        Docente Activo
                      </span>
                    </div>
                    <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      Especialidad: {selectedTeacherForDetail.especialidad || 'Educación General'}
                    </p>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-slate-500 dark:text-slate-400 pt-1 font-medium">
                      <span className="font-mono"><strong>DNI:</strong> {selectedTeacherForDetail.dni}</span>
                      <span><strong>Email:</strong> {selectedTeacherForDetail.email}</span>
                      {selectedTeacherForDetail.telefono && (
                        <span><strong>Tel:</strong> {selectedTeacherForDetail.telefono}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900">
                    <span className="text-[10px] font-bold uppercase text-indigo-600 dark:text-indigo-400 block">Carga Total</span>
                    <span className="text-lg font-black text-indigo-900 dark:text-indigo-200">{teacherHours} hrs/sem</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-purple-50/50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900">
                    <span className="text-[10px] font-bold uppercase text-purple-600 dark:text-purple-400 block">Salones</span>
                    <span className="text-lg font-black text-purple-900 dark:text-purple-200">{uniqueSections.length} aulas</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900">
                    <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 block">Asignaturas</span>
                    <span className="text-lg font-black text-emerald-900 dark:text-emerald-200">{teacherAssignments.length} cursos</span>
                  </div>
                </div>

                {/* Assigned Courses Detailed List */}
                <div className="space-y-2.5">
                  <h5 className="font-black text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                    Materias y Salones a su Cargo ({teacherAssignments.length})
                  </h5>

                  {teacherAssignments.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {teacherAssignments.map((asig) => (
                        <div
                          key={asig.id}
                          className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 shadow-sm"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0"
                              style={{ backgroundColor: asig.curso?.color_hex || '#6366f1' }}
                            >
                              <BookOpen className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-extrabold text-slate-900 dark:text-white text-xs truncate">
                                {asig.curso?.nombre}
                              </p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                {asig.seccion?.grado?.nombre} &quot;{asig.seccion?.letra}&quot; ({asig.aula_defecto || 'Aula 301'})
                              </p>
                            </div>
                          </div>
                          <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 shrink-0">
                            {asig.horas_semanales} hrs
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-dashed border-slate-200 dark:border-slate-700 text-center text-xs text-slate-400">
                      Este profesor aún no tiene asignaturas ni salones asignados.
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Modal */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTeacherForDetail(null)}
                  className="px-4 py-2 font-bold text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl"
                >
                  Cerrar
                </button>
                <div className="flex items-center gap-2">
                  <Link
                    href="/admin/horarios"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    Ver Horario Completo
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      const tId = selectedTeacherForDetail.id;
                      setSelectedTeacherForDetail(null);
                      openAssignForTeacher(tId);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Asignar Salón/Materia
                  </button>
                </div>
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
}
