'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  Bell, 
  AlertTriangle, 
  ShieldAlert, 
  Info, 
  CheckCircle2, 
  Search, 
  Filter, 
  Download, 
  Settings, 
  SlidersHorizontal, 
  RefreshCw, 
  Clock, 
  User, 
  Shield, 
  FileText, 
  ArrowRight, 
  Check, 
  X, 
  Copy, 
  ChevronRight, 
  Eye, 
  Server, 
  Activity, 
  Layers, 
  AlertCircle, 
  CheckCheck,
  Calendar,
  Sparkles,
  ExternalLink,
  Laptop,
  Terminal,
  Database,
  Lock,
  CreditCard,
  GraduationCap,
  Users,
  QrCode
} from 'lucide-react';
import Link from 'next/link';

// Tipos ampliados para la experiencia de Centro de Alertas y Logs
export type AlertPriority = 'critica' | 'alta' | 'media' | 'baja';
export type AlertStatus = 'pendiente' | 'en_revision' | 'atendida';
export type LogLevel = 'CRITICAL' | 'WARN' | 'INFO' | 'DEBUG' | 'SECURITY';
export type ModuleCategory = 'Matrículas' | 'Asistencia' | 'Calificaciones' | 'Pagos' | 'Seguridad' | 'Sistema' | 'CNEB' | 'Usuarios';

export interface ExtendedAlert {
  id: string;
  prioridad: AlertPriority;
  modulo: ModuleCategory;
  titulo: string;
  descripcion: string;
  tiempoRelativo: string;
  timestamp: string;
  usuarioRelacionado: string;
  ip?: string;
  estado: AlertStatus;
  accionLabel: string;
  accionUrl: string;
  detallesTecnicos?: {
    servicio: string;
    payload: Record<string, any>;
    historial: { paso: string; hora: string; usuario: string }[];
  };
}

export interface ActivityItem {
  id: string;
  timestamp: string;
  evento: string;
  usuario: string;
  rol: string;
  modulo: ModuleCategory;
  resultado: 'exitoso' | 'bloqueado' | 'error' | 'info';
  resultadoTexto: string;
  ip: string;
  detalles: string;
  metadata?: Record<string, any>;
}

export interface SystemLogItem {
  id: string;
  timestamp: string;
  nivel: LogLevel;
  evento: string;
  servicio: string;
  usuario: string;
  ip: string;
  resultado: string;
  codigoHttp: number;
  duracionMs: number;
  payload?: Record<string, any>;
}

// Datos iniciales ricos y contextualizados
const INITIAL_ALERTS: ExtendedAlert[] = [
  {
    id: 'ALT-2026-001',
    prioridad: 'critica',
    modulo: 'Matrículas',
    titulo: 'Documento pendiente de validación',
    descripcion: 'Matrícula EST-2026-004 requiere revisión de certificado de estudios previo.',
    tiempoRelativo: 'Hace 5 minutos',
    timestamp: '2026-09-16 08:37:12',
    usuarioRelacionado: 'Secretaría Académica',
    ip: '192.168.1.45',
    estado: 'pendiente',
    accionLabel: 'Validar Documento',
    accionUrl: '/admin/matriculas',
    detallesTecnicos: {
      servicio: 'enrollment-validator-v2',
      payload: {
        estudiante_id: 'EST-2026-004',
        apoderado_dni: '45892104',
        motivo: 'Certificado de 6° de primaria no legible en SIAGIE',
        grado_postulacion: '1° Secundaria'
      },
      historial: [
        { paso: 'Carga de expediente por apoderado', hora: '08:20:00', usuario: 'Portal Padres' },
        { paso: 'Fallo de verificación OCR automatizada', hora: '08:35:10', usuario: 'OCR Worker' },
        { paso: 'Alerta asignada a Secretaría', hora: '08:37:12', usuario: 'Sistema' }
      ]
    }
  },
  {
    id: 'ALT-2026-002',
    prioridad: 'alta',
    modulo: 'Asistencia',
    titulo: 'Registro de asistencia duplicado',
    descripcion: 'Se detectó un segundo registro para el estudiante en intervalo menor a 3 minutos.',
    tiempoRelativo: 'Hace 12 minutos',
    timestamp: '2026-09-16 08:30:05',
    usuarioRelacionado: 'Terminal Kiosko QR #01',
    ip: '192.168.1.80',
    estado: 'pendiente',
    accionLabel: 'Revisar Marcación',
    accionUrl: '/asistencia',
    detallesTecnicos: {
      servicio: 'attendance-ingest-engine',
      payload: {
        estudiante: 'Mateo Alejandro Silva Quispe',
        seccion: '3° Primaria A',
        primera_lectura: '08:27:14',
        segunda_lectura: '08:30:05',
        dispositivo: 'Torniquete Principal'
      },
      historial: [
        { paso: 'Marcación QR exitosa (08:27)', hora: '08:27:14', usuario: 'Kiosko QR' },
        { paso: 'Reintento detectado y prevenido', hora: '08:30:05', usuario: 'Regla Anti-Passback' }
      ]
    }
  },
  {
    id: 'ALT-2026-003',
    prioridad: 'alta',
    modulo: 'CNEB',
    titulo: 'Acta pendiente de firma digital',
    descripcion: 'Acta del II Bimestre de Ciencia y Tecnología (Secundaria) pendiente de visado.',
    tiempoRelativo: 'Hace 25 minutos',
    timestamp: '2026-09-16 08:17:40',
    usuarioRelacionado: 'Prof. Carlos Mendoza',
    ip: '192.168.1.102',
    estado: 'en_revision',
    accionLabel: 'Firmar Acta',
    accionUrl: '/admin/notas-salon',
    detallesTecnicos: {
      servicio: 'cneb-gradebook-service',
      payload: {
        curso: 'Ciencia y Tecnología',
        seccion: '3° Secundaria A',
        bimestre: 'II Bimestre',
        competencias_evaluadas: 4,
        alumnos_total: 28
      },
      historial: [
        { paso: 'Cierre de notas por docente', hora: '08:05:00', usuario: 'Prof. Carlos Mendoza' },
        { paso: 'Generación de borrador de acta', hora: '08:10:22', usuario: 'CNEB Exporter' },
        { paso: 'En espera de firma directiva', hora: '08:17:40', usuario: 'Sistema' }
      ]
    }
  },
  {
    id: 'ALT-2026-004',
    prioridad: 'critica',
    modulo: 'Seguridad',
    titulo: 'Intento de acceso reiterado bloqueado',
    descripcion: 'Se bloquearon 4 intentos sucesivos con credenciales erróneas desde IP externa.',
    tiempoRelativo: 'Hace 40 minutos',
    timestamp: '2026-09-16 08:02:18',
    usuarioRelacionado: 'Usuario desconocido',
    ip: '190.237.45.18',
    estado: 'pendiente',
    accionLabel: 'Inspeccionar IP',
    accionUrl: '#',
    detallesTecnicos: {
      servicio: 'auth-firewall-guard',
      payload: {
        ip_origen: '190.237.45.18',
        pais: 'Perú (Lima - ISP Movistar)',
        intentos_fallidos: 4,
        usuario_objetivo: 'admin@colegio.edu.pe',
        accion_tomada: 'Bloqueo temporal por 30 minutos'
      },
      historial: [
        { paso: 'Primer intento fallido', hora: '08:01:05', usuario: 'Auth Service' },
        { paso: 'Tercer intento fallido', hora: '08:02:00', usuario: 'Auth Service' },
        { paso: 'Activación de Rate Limiting y ban', hora: '08:02:18', usuario: 'Firewall Guard' }
      ]
    }
  },
  {
    id: 'ALT-2026-005',
    prioridad: 'media',
    modulo: 'Pagos',
    titulo: 'Comprobante con discrepancia de arancel',
    descripcion: 'Comprobante #BOL-2026-881 presenta diferencia de S/ 20.00 con la pensión mensual.',
    tiempoRelativo: 'Hace 1 hora',
    timestamp: '2026-09-16 07:42:00',
    usuarioRelacionado: 'Cajero Central',
    ip: '192.168.1.30',
    estado: 'en_revision',
    accionLabel: 'Revisar Comprobante',
    accionUrl: '#',
    detallesTecnicos: {
      servicio: 'billing-ledger-core',
      payload: {
        nro_comprobante: 'BOL-2026-881',
        alumno: 'Sofía Lucía Romero Benítez',
        monto_esperado: 'S/ 480.00',
        monto_pagado: 'S/ 460.00',
        diferencia: '- S/ 20.00'
      },
      historial: [
        { paso: 'Registro de pago en ventanilla', hora: '07:35:00', usuario: 'Cajero Central' },
        { paso: 'Validación contable con discrepancia', hora: '07:42:00', usuario: 'Billing Service' }
      ]
    }
  },
  {
    id: 'ALT-2026-006',
    prioridad: 'baja',
    modulo: 'Sistema',
    titulo: 'Respaldo automático en la nube completado',
    descripcion: 'Snapshot de base de datos y expedientes escolares completado exitosamente (1.4 GB).',
    tiempoRelativo: 'Hace 2 horas',
    timestamp: '2026-09-16 06:30:00',
    usuarioRelacionado: 'Job Cron Automatizado',
    ip: '127.0.0.1',
    estado: 'atendida',
    accionLabel: 'Ver Registro de Backup',
    accionUrl: '#',
    detallesTecnicos: {
      servicio: 'storage-backup-daemon',
      payload: {
        tamaño: '1.42 GB',
        duracion_segundos: 45,
        almacenamiento: 'AWS S3 Glacier (sa-east-1)',
        checksum_sha256: '9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c'
      },
      historial: [
        { paso: 'Inicio de snapshot diario', hora: '06:29:15', usuario: 'Cron Job' },
        { paso: 'Carga cifrada AES-256 finalizada', hora: '06:30:00', usuario: 'S3 Sync' }
      ]
    }
  }
];

const INITIAL_ACTIVITIES: ActivityItem[] = [
  {
    id: 'ACT-901',
    timestamp: '08:42:15',
    evento: 'Nueva matrícula registrada',
    usuario: 'María Elena Vargas (Directora)',
    rol: 'Administrador',
    modulo: 'Matrículas',
    resultado: 'exitoso',
    resultadoTexto: '✓ Exitoso',
    ip: '192.168.1.45',
    detalles: 'Matriculó al estudiante Mateo Silva Quispe en 3° de Primaria A (Vacante #18/25).'
  },
  {
    id: 'ACT-902',
    timestamp: '08:39:21',
    evento: 'Asistencia registrada mediante QR',
    usuario: 'Terminal Kiosko #01',
    rol: 'Portería',
    modulo: 'Asistencia',
    resultado: 'exitoso',
    resultadoTexto: '✓ Exitoso',
    ip: '192.168.1.80',
    detalles: 'Lectura de carnet escolar QR - Alumno: Camila Fernández López. Estado: A TIEMPO.'
  },
  {
    id: 'ACT-903',
    timestamp: '08:35:08',
    evento: 'Calificación actualizada',
    usuario: 'Prof. Carlos Mendoza',
    rol: 'Docente',
    modulo: 'Calificaciones',
    resultado: 'exitoso',
    resultadoTexto: '✓ Exitoso',
    ip: '192.168.1.102',
    detalles: 'Actualizó nota de Competencia C1 en Matemática (3° Primaria A) de A (15) a AD (19).'
  },
  {
    id: 'ACT-904',
    timestamp: '08:31:44',
    evento: 'Intento de acceso rechazado',
    usuario: 'Usuario desconocido',
    rol: 'Invitado',
    modulo: 'Seguridad',
    resultado: 'bloqueado',
    resultadoTexto: '⚠ Bloqueado',
    ip: '190.237.45.18',
    detalles: 'Intento de login con usuario "admin" falló: Contraseña incorrecta. Trigger de bloqueo activado.'
  },
  {
    id: 'ACT-905',
    timestamp: '08:28:10',
    evento: 'Emisión de boleta de pago',
    usuario: 'Rosa Quispe',
    rol: 'Cajero Central',
    modulo: 'Pagos',
    resultado: 'exitoso',
    resultadoTexto: '✓ Exitoso',
    ip: '192.168.1.30',
    detalles: 'Emisión de Boleta B001-002492 por concepto de Pensión Septiembre 2026 (S/ 450.00).'
  },
  {
    id: 'ACT-906',
    timestamp: '08:20:05',
    evento: 'Generación de acta de notas CNEB',
    usuario: 'Prof. Ana Morales',
    rol: 'Docente',
    modulo: 'Calificaciones',
    resultado: 'exitoso',
    resultadoTexto: '✓ Exitoso',
    ip: '192.168.1.108',
    detalles: 'Generó borrador oficial de acta de evaluación bimestral de Comunicación para 2° Secundaria.'
  },
  {
    id: 'ACT-907',
    timestamp: '08:15:30',
    evento: 'Sincronización SIAGIE',
    usuario: 'Job Sistema',
    rol: 'Servicio',
    modulo: 'Sistema',
    resultado: 'exitoso',
    resultadoTexto: '✓ Exitoso',
    ip: '127.0.0.1',
    detalles: 'Sincronización de 1,248 códigos de matrícula con el padrón del Ministerio de Educación.'
  },
  {
    id: 'ACT-908',
    timestamp: '08:02:11',
    evento: 'Modificación de horario escolar',
    usuario: 'Coordinador Académico',
    rol: 'Administrador',
    modulo: 'Sistema',
    resultado: 'exitoso',
    resultadoTexto: '✓ Exitoso',
    ip: '192.168.1.48',
    detalles: 'Reasignación de aula de cómputo para el bloque de Viernes 10:00 - 11:30 AM sin cruces.'
  }
];

const INITIAL_SYSTEM_LOGS: SystemLogItem[] = [
  {
    id: 'LOG-884920',
    timestamp: '2026-09-16 08:42:15.102',
    nivel: 'INFO',
    evento: 'POST /api/v1/matriculas/crear',
    servicio: 'enrollment-api',
    usuario: 'admin@colegio.edu.pe',
    ip: '192.168.1.45',
    resultado: '201 CREATED',
    codigoHttp: 201,
    duracionMs: 42,
    payload: { matriculaId: 'MAT-2026-001', studentDni: '72839102', section: '3PRI-A' }
  },
  {
    id: 'LOG-884919',
    timestamp: '2026-09-16 08:39:21.054',
    nivel: 'INFO',
    evento: 'WS /kiosko/qr/stream/scan',
    servicio: 'attendance-worker',
    usuario: 'kiosko-terminal-01',
    ip: '192.168.1.80',
    resultado: '200 OK',
    codigoHttp: 200,
    duracionMs: 18,
    payload: { qrToken: 'QR-STU-8841', readerPort: 'COM3', matched: true }
  },
  {
    id: 'LOG-884918',
    timestamp: '2026-09-16 08:35:08.882',
    nivel: 'INFO',
    evento: 'PUT /api/v1/calificaciones/cneb',
    servicio: 'grades-service',
    usuario: 'carlos.mendoza@colegio.edu.pe',
    ip: '192.168.1.102',
    resultado: '200 OK',
    codigoHttp: 200,
    duracionMs: 65,
    payload: { courseId: 'cur-mat-3', competency: 'C1', newGrade: 'AD', oldValue: 'A' }
  },
  {
    id: 'LOG-884917',
    timestamp: '2026-09-16 08:31:44.219',
    nivel: 'SECURITY',
    evento: 'POST /api/v1/auth/login',
    servicio: 'auth-service',
    usuario: 'anonymous',
    ip: '190.237.45.18',
    resultado: '401 UNAUTHORIZED',
    codigoHttp: 401,
    duracionMs: 120,
    payload: { reason: 'INVALID_CREDENTIALS', attemptCount: 4, action: 'IP_TEMPORARY_BAN' }
  },
  {
    id: 'LOG-884916',
    timestamp: '2026-09-16 08:28:10.741',
    nivel: 'INFO',
    evento: 'POST /api/v1/pagos/emitir-boleta',
    servicio: 'billing-engine',
    usuario: 'rosa.quispe@colegio.edu.pe',
    ip: '192.168.1.30',
    resultado: '200 OK',
    codigoHttp: 200,
    duracionMs: 145,
    payload: { ticketNo: 'BOL-2026-881', amount: 450.00, sunatAck: 'ACCEPTED' }
  },
  {
    id: 'LOG-884915',
    timestamp: '2026-09-16 08:20:05.312',
    nivel: 'INFO',
    evento: 'GET /api/v1/cneb/acta/export-pdf',
    servicio: 'pdf-generator',
    usuario: 'ana.morales@colegio.edu.pe',
    ip: '192.168.1.108',
    resultado: '200 OK',
    codigoHttp: 200,
    duracionMs: 380,
    payload: { grade: '2SEC-B', period: 'BIM-2', renderedPages: 4 }
  },
  {
    id: 'LOG-884914',
    timestamp: '2026-09-16 08:15:30.900',
    nivel: 'INFO',
    evento: 'CRON /jobs/siagie-sync-daily',
    servicio: 'siagie-bridge',
    usuario: 'system-daemon',
    ip: '127.0.0.1',
    resultado: '200 OK',
    codigoHttp: 200,
    duracionMs: 1420,
    payload: { recordsSynced: 1248, conflicts: 0, status: 'SYNCED_HEALTHY' }
  },
  {
    id: 'LOG-884913',
    timestamp: '2026-09-16 08:02:11.410',
    nivel: 'WARN',
    evento: 'PATCH /api/v1/horarios/slot/reassign',
    servicio: 'schedule-validator',
    usuario: 'admin@colegio.edu.pe',
    ip: '192.168.1.48',
    resultado: '200 OK (With Warnings)',
    codigoHttp: 200,
    duracionMs: 35,
    payload: { slotId: 'slot-14', teacherId: 'doc-8', note: 'Near weekly maximum hours threshold' }
  }
];

export default function CentroAlertasLogsPage() {
  const { alerts: contextAlerts, resolveAlert: contextResolveAlert } = useApp();

  // Estados locales para la supervisión interactiva
  const [alertsList, setAlertsList] = useState<ExtendedAlert[]>(INITIAL_ALERTS);
  const [activitiesList, setActivitiesList] = useState<ActivityItem[]>(INITIAL_ACTIVITIES);
  const [systemLogsList, setSystemLogsList] = useState<SystemLogItem[]>(INITIAL_SYSTEM_LOGS);

  // Pestaña activa principal
  const [activeTab, setActiveTab] = useState<'alertas' | 'actividad' | 'logs'>('alertas');

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuickFilter, setSelectedQuickFilter] = useState<string>('Todos');
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);
  
  // Filtros avanzados
  const [filterDateRange, setFilterDateRange] = useState<string>('todos');
  const [filterUser, setFilterUser] = useState<string>('todos');
  const [filterModule, setFilterModule] = useState<string>('todos');
  const [filterStatus, setFilterStatus] = useState<string>('todos');

  // Drawer lateral de detalle
  const [selectedEvent, setSelectedEvent] = useState<{
    tipo: 'alerta' | 'actividad' | 'log';
    data: ExtendedAlert | ActivityItem | SystemLogItem;
  } | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Modales de Exportar y Configuración
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Reloj en tiempo real
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDateFormatted, setCurrentDateFormatted] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
      setCurrentDateFormatted(now.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Mostrar Toast efímero
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Contadores de tarjetas de resumen
  const criticalCount = useMemo(() => alertsList.filter(a => a.prioridad === 'critica' && a.estado !== 'atendida').length, [alertsList]);
  const warningCount = useMemo(() => alertsList.filter(a => (a.prioridad === 'alta' || a.prioridad === 'media') && a.estado !== 'atendida').length, [alertsList]);
  const infoCount = useMemo(() => alertsList.filter(a => a.prioridad === 'baja' || a.modulo === 'Sistema').length, [alertsList]);
  const totalPending = useMemo(() => alertsList.filter(a => a.estado !== 'atendida').length, [alertsList]);

  // Lista de filtros rápidos tipo pills
  const quickFilters = [
    'Todos',
    'Críticas',
    'Advertencias',
    'Información',
    'Sistema',
    'Usuarios',
    'Matrículas',
    'Asistencia',
    'Calificaciones',
    'Pagos',
    'Seguridad'
  ];

  // Marcar alerta como atendida
  const handleMarkAsAttended = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setAlertsList(prev => prev.map(a => a.id === id ? { ...a, estado: 'atendida' } : a));
    
    // Si el evento actual en el drawer es esta alerta, actualizarlo
    if (selectedEvent && selectedEvent.tipo === 'alerta' && (selectedEvent.data as ExtendedAlert).id === id) {
      setSelectedEvent(prev => prev ? {
        ...prev,
        data: { ...(prev.data as ExtendedAlert), estado: 'atendida' }
      } : null);
    }
    
    showToast(`✓ Alerta ${id} marcada como atendida exitosamente.`);
  };

  // Cambiar estado desde el drawer
  const handleChangeStatus = (id: string, newStatus: AlertStatus) => {
    setAlertsList(prev => prev.map(a => a.id === id ? { ...a, estado: newStatus } : a));
    if (selectedEvent && selectedEvent.tipo === 'alerta' && (selectedEvent.data as ExtendedAlert).id === id) {
      setSelectedEvent(prev => prev ? {
        ...prev,
        data: { ...(prev.data as ExtendedAlert), estado: newStatus }
      } : null);
    }
    showToast(`Estado de la alerta actualizado a "${newStatus.toUpperCase()}".`);
  };

  // Abrir Drawer de detalle
  const openDetailDrawer = (tipo: 'alerta' | 'actividad' | 'log', data: ExtendedAlert | ActivityItem | SystemLogItem) => {
    setSelectedEvent({ tipo, data });
    setIsDrawerOpen(true);
    setCopiedId(false);
  };

  // Copiar ID al portapapeles
  const handleCopyId = (id: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  // Filtrado reactivo de Alertas
  const filteredAlerts = useMemo(() => {
    return alertsList.filter(item => {
      // Búsqueda textual
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = item.titulo.toLowerCase().includes(query);
        const matchDesc = item.descripcion.toLowerCase().includes(query);
        const matchMod = item.modulo.toLowerCase().includes(query);
        const matchUser = item.usuarioRelacionado.toLowerCase().includes(query);
        const matchId = item.id.toLowerCase().includes(query);
        if (!matchTitle && !matchDesc && !matchMod && !matchUser && !matchId) return false;
      }

      // Quick filter
      if (selectedQuickFilter === 'Críticas' && item.prioridad !== 'critica') return false;
      if (selectedQuickFilter === 'Advertencias' && item.prioridad !== 'alta' && item.prioridad !== 'media') return false;
      if (selectedQuickFilter === 'Información' && item.prioridad !== 'baja' && item.modulo !== 'Sistema') return false;
      if (selectedQuickFilter === 'Sistema' && item.modulo !== 'Sistema') return false;
      if (selectedQuickFilter === 'Usuarios' && !item.usuarioRelacionado.toLowerCase().includes('admin') && !item.usuarioRelacionado.toLowerCase().includes('secretaría') && !item.usuarioRelacionado.toLowerCase().includes('prof')) return false;
      if (selectedQuickFilter === 'Matrículas' && item.modulo !== 'Matrículas') return false;
      if (selectedQuickFilter === 'Asistencia' && item.modulo !== 'Asistencia') return false;
      if (selectedQuickFilter === 'Calificaciones' && item.modulo !== 'Calificaciones' && item.modulo !== 'CNEB') return false;
      if (selectedQuickFilter === 'Pagos' && item.modulo !== 'Pagos') return false;
      if (selectedQuickFilter === 'Seguridad' && item.modulo !== 'Seguridad') return false;

      // Filtros avanzados
      if (filterModule !== 'todos' && item.modulo.toLowerCase() !== filterModule.toLowerCase()) return false;
      if (filterStatus !== 'todos' && item.estado !== filterStatus) return false;
      if (filterUser !== 'todos' && !item.usuarioRelacionado.toLowerCase().includes(filterUser.toLowerCase())) return false;

      return true;
    });
  }, [alertsList, searchQuery, selectedQuickFilter, filterModule, filterStatus, filterUser]);

  // Filtrado reactivo de Actividades
  const filteredActivities = useMemo(() => {
    return activitiesList.filter(item => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchEvento = item.evento.toLowerCase().includes(query);
        const matchUser = item.usuario.toLowerCase().includes(query);
        const matchMod = item.modulo.toLowerCase().includes(query);
        const matchDet = item.detalles.toLowerCase().includes(query);
        if (!matchEvento && !matchUser && !matchMod && !matchDet) return false;
      }

      if (selectedQuickFilter === 'Matrículas' && item.modulo !== 'Matrículas') return false;
      if (selectedQuickFilter === 'Asistencia' && item.modulo !== 'Asistencia') return false;
      if (selectedQuickFilter === 'Calificaciones' && item.modulo !== 'Calificaciones') return false;
      if (selectedQuickFilter === 'Pagos' && item.modulo !== 'Pagos') return false;
      if (selectedQuickFilter === 'Seguridad' && item.modulo !== 'Seguridad') return false;
      if (selectedQuickFilter === 'Sistema' && item.modulo !== 'Sistema') return false;

      if (filterModule !== 'todos' && item.modulo.toLowerCase() !== filterModule.toLowerCase()) return false;
      if (filterUser !== 'todos' && !item.usuario.toLowerCase().includes(filterUser.toLowerCase())) return false;

      return true;
    });
  }, [activitiesList, searchQuery, selectedQuickFilter, filterModule, filterUser]);

  // Filtrado reactivo de Logs
  const filteredLogs = useMemo(() => {
    return systemLogsList.filter(item => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchEv = item.evento.toLowerCase().includes(query);
        const matchSrv = item.servicio.toLowerCase().includes(query);
        const matchUsr = item.usuario.toLowerCase().includes(query);
        const matchIp = item.ip.toLowerCase().includes(query);
        const matchId = item.id.toLowerCase().includes(query);
        if (!matchEv && !matchSrv && !matchUsr && !matchIp && !matchId) return false;
      }

      if (selectedQuickFilter === 'Críticas' && item.nivel !== 'CRITICAL') return false;
      if (selectedQuickFilter === 'Advertencias' && item.nivel !== 'WARN') return false;
      if (selectedQuickFilter === 'Información' && item.nivel !== 'INFO') return false;
      if (selectedQuickFilter === 'Seguridad' && item.nivel !== 'SECURITY') return false;

      return true;
    });
  }, [systemLogsList, searchQuery, selectedQuickFilter]);

  // Manejo de exportación a CSV/JSON
  const handleExportData = (format: 'csv' | 'json') => {
    const dataToExport = {
      timestamp: new Date().toISOString(),
      modulo: 'Centro de Alertas y Logs',
      total_alertas: alertsList.length,
      alertas: alertsList,
      actividades: activitiesList,
      logs: systemLogsList
    };

    if (format === 'json') {
      const jsonStr = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `alertas-logs-colegio-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // CSV format
      let csv = 'ID,MODULO,PRIORIDAD/NIVEL,TITULO/EVENTO,USUARIO,ESTADO/RESULTADO,TIMESTAMP\n';
      alertsList.forEach(a => {
        csv += `"${a.id}","${a.modulo}","${a.prioridad}","${a.titulo}","${a.usuarioRelacionado}","${a.estado}","${a.timestamp}"\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `auditoria-alertas-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }

    setIsExportModalOpen(false);
    showToast(`✓ Archivo ${format.toUpperCase()} exportado y descargado exitosamente.`);
  };

  // Helper de colores semánticos estrictos
  const getPriorityBadge = (priority: AlertPriority) => {
    switch (priority) {
      case 'critica':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-400 text-[11px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
            Crítica
          </span>
        );
      case 'alta':
      case 'media':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/60 text-amber-700 dark:text-amber-400 text-[11px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Advertencia
          </span>
        );
      case 'baja':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/60 text-blue-700 dark:text-blue-400 text-[11px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Información
          </span>
        );
    }
  };

  const getStatusBadge = (status: AlertStatus) => {
    switch (status) {
      case 'pendiente':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 text-rose-700 dark:text-rose-300 text-[11px] font-semibold">
            ● Pendiente
          </span>
        );
      case 'en_revision':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 text-amber-700 dark:text-amber-300 text-[11px] font-semibold">
            ◐ En revisión
          </span>
        );
      case 'atendida':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold">
            ✓ Atendida
          </span>
        );
    }
  };

  const getLogLevelBadge = (level: LogLevel) => {
    switch (level) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-mono text-[10px] font-bold border border-rose-200 dark:border-rose-900">CRITICAL</span>;
      case 'WARN':
        return <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-mono text-[10px] font-bold border border-amber-200 dark:border-amber-900">WARN</span>;
      case 'SECURITY':
        return <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-mono text-[10px] font-bold border border-purple-200 dark:border-purple-900">SECURITY</span>;
      case 'DEBUG':
        return <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono text-[10px] font-bold">DEBUG</span>;
      case 'INFO':
      default:
        return <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono text-[10px] font-bold border border-blue-200 dark:border-blue-900">INFO</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      
      {/* Toast de notificación rápida */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900/95 text-white backdrop-blur-md px-5 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-top-3 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━
          1. ENCABEZADO COMPACTO
          ━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Título y Subtítulo */}
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Centro de Alertas y Logs
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 pl-10.5">
            Supervisa eventos, incidencias y actividad del sistema en tiempo real.
          </p>
        </div>

        {/* Lado derecho: Estado, Fecha/Hora, Acciones */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          
          {/* Indicador Sistema Operativo */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold" title="Uptime 99.98% • Latencia 22ms • Servicios OK">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>● Sistema operativo</span>
          </div>

          {/* Fecha y Hora en tiempo real */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 text-xs font-medium">
            <Clock className="w-3.5 h-3.5 text-indigo-500" />
            <span suppressHydrationWarning className="font-mono font-semibold">
              {currentTime || '08:42:15 AM'}
            </span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span suppressHydrationWarning className="capitalize text-[11px]">
              {currentDateFormatted || '16 de Septiembre 2026'}
            </span>
          </div>

          {/* Botón Exportar */}
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Exportar</span>
          </button>

          {/* Botón Configuración */}
          <button
            onClick={() => setIsConfigModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold hover:bg-indigo-100/70 transition-colors shadow-2xs cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-indigo-600" />
            <span>Configuración</span>
          </button>

        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━
          2. RESUMEN DE ALERTAS (4 TARJETAS COMPACTAS)
          ━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* 🔴 ALERTAS CRÍTICAS */}
        <div 
          onClick={() => { setActiveTab('alertas'); setSelectedQuickFilter('Críticas'); }}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-rose-300 dark:hover:border-rose-900/60 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
              Alertas Críticas
            </span>
            <div className="w-7 h-7 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
              {criticalCount}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">pendientes</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 truncate">
            Requieren atención inmediata
          </p>
        </div>

        {/* 🟠 ADVERTENCIAS */}
        <div 
          onClick={() => { setActiveTab('alertas'); setSelectedQuickFilter('Advertencias'); }}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-amber-300 dark:hover:border-amber-900/60 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Advertencias
            </span>
            <div className="w-7 h-7 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
              {warningCount}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">por revisar</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 truncate">
            Eventos que requieren revisión
          </p>
        </div>

        {/* 🔵 INFORMACIÓN */}
        <div 
          onClick={() => { setActiveTab('alertas'); setSelectedQuickFilter('Información'); }}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-blue-300 dark:hover:border-blue-900/60 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Información
            </span>
            <div className="w-7 h-7 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Info className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400 tracking-tight">
              {infoCount}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">recientes</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 truncate">
            Eventos informativos del sistema
          </p>
        </div>

        {/* 🟢 SISTEMA */}
        <div 
          onClick={() => { setActiveTab('logs'); setSelectedQuickFilter('Todos'); }}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:border-emerald-300 dark:hover:border-emerald-900/60 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Sistema
            </span>
            <div className="w-7 h-7 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Server className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
              100% OK
            </span>
            <span className="text-[11px] text-slate-500 font-medium">0 caídas</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 truncate">
            Latencia promedio: 22ms
          </p>
        </div>

      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━
          3. BARRA DE FILTROS MODERNA
          ━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs space-y-3">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Buscador */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar en alertas y registros por título, usuario, módulo, IP o ID..."
              className="w-full pl-10 pr-10 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Botón Filtros Avanzados */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsAdvancedFiltersOpen(!isAdvancedFiltersOpen)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                isAdvancedFiltersOpen || filterModule !== 'todos' || filterStatus !== 'todos' || filterUser !== 'todos'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200/80'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filtros avanzados</span>
              {(filterModule !== 'todos' || filterStatus !== 'todos' || filterUser !== 'todos') && (
                <span className="w-2 h-2 rounded-full bg-amber-300" />
              )}
            </button>
          </div>
        </div>

        {/* Chips / Pills de Filtros Rápidos */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin text-xs">
          {quickFilters.map((pill) => {
            const isSelected = selectedQuickFilter === pill;
            return (
              <button
                key={pill}
                onClick={() => setSelectedQuickFilter(pill)}
                className={`px-3 py-1 rounded-xl whitespace-nowrap font-medium transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white font-bold shadow-xs scale-102'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {pill}
              </button>
            );
          })}
        </div>

        {/* Panel Desplegable de Filtros Avanzados */}
        {isAdvancedFiltersOpen && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-in fade-in duration-150">
            
            {/* Filtro Fecha */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Rango de Fecha
              </label>
              <select
                value={filterDateRange}
                onChange={(e) => setFilterDateRange(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              >
                <option value="todos">Cualquier fecha</option>
                <option value="hoy">Hoy (últimas 24h)</option>
                <option value="semana">Últimos 7 días</option>
                <option value="mes">Este mes</option>
              </select>
            </div>

            {/* Filtro Usuario */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Usuario / Rol
              </label>
              <select
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              >
                <option value="todos">Todos los usuarios</option>
                <option value="admin">Administrador</option>
                <option value="secretaría">Secretaría</option>
                <option value="prof">Docentes</option>
                <option value="cajero">Cajero</option>
                <option value="terminal">Kiosko QR</option>
              </select>
            </div>

            {/* Filtro Módulo */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Módulo Origen
              </label>
              <select
                value={filterModule}
                onChange={(e) => setFilterModule(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              >
                <option value="todos">Todos los módulos</option>
                <option value="matrículas">Matrículas</option>
                <option value="asistencia">Asistencia</option>
                <option value="calificaciones">Calificaciones</option>
                <option value="pagos">Pagos</option>
                <option value="seguridad">Seguridad</option>
                <option value="cneb">CNEB</option>
                <option value="sistema">Sistema</option>
              </select>
            </div>

            {/* Filtro Estado */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Estado de la Alerta
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="todos">Todos los estados</option>
                  <option value="pendiente">Pendientes</option>
                  <option value="en_revision">En revisión</option>
                  <option value="atendida">Atendidas</option>
                </select>

                <button
                  onClick={() => {
                    setFilterDateRange('todos');
                    setFilterUser('todos');
                    setFilterModule('todos');
                    setFilterStatus('todos');
                    setSelectedQuickFilter('Todos');
                    setSearchQuery('');
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[11px] font-semibold text-slate-600 dark:text-slate-300"
                  title="Restablecer filtros"
                >
                  Limpiar
                </button>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━
          4. TABS PRINCIPALES (ALERTAS | ACTIVIDAD | LOGS)
          ━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          
          {/* Tab 1: Alertas */}
          <button
            onClick={() => setActiveTab('alertas')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'alertas'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Alertas que requieren atención</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === 'alertas' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
            }`}>
              {totalPending}
            </span>
          </button>

          {/* Tab 2: Actividad del Sistema */}
          <button
            onClick={() => setActiveTab('actividad')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'actividad'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Actividad reciente</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === 'actividad' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
            }`}>
              {filteredActivities.length}
            </span>
          </button>

          {/* Tab 3: Logs del Sistema */}
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'logs'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Logs del sistema</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === 'logs' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
            }`}>
              {filteredLogs.length}
            </span>
          </button>

        </div>

        {/* Contador de resultados */}
        <span className="hidden sm:inline-block text-xs text-slate-400">
          Mostrando {activeTab === 'alertas' ? filteredAlerts.length : activeTab === 'actividad' ? filteredActivities.length : filteredLogs.length} registros
        </span>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━
          5. CONTENIDO DE LAS VISTAS
          ━━━━━━━━━━━━━━━━━━━━━━ */}

      {/* VISTA 1: ALERTAS PENDIENTES */}
      {activeTab === 'alertas' && (
        <div className="space-y-3">
          {filteredAlerts.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCheck className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                No se encontraron alertas pendientes con los filtros aplicados
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Todas las incidencias han sido resueltas o los criterios de búsqueda no coinciden con ninguna alerta activa.
              </p>
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              const isResolved = alert.estado === 'atendida';
              return (
                <div
                  key={alert.id}
                  onClick={() => openDetailDrawer('alerta', alert)}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 hover:shadow-md cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                    isResolved
                      ? 'bg-slate-50/70 dark:bg-slate-800/30 border-slate-200/70 dark:border-slate-800 opacity-60'
                      : alert.prioridad === 'critica'
                        ? 'bg-white dark:bg-slate-900 border-l-4 border-l-rose-500 border-slate-200/80 dark:border-slate-800 shadow-2xs'
                        : alert.prioridad === 'alta' || alert.prioridad === 'media'
                          ? 'bg-white dark:bg-slate-900 border-l-4 border-l-amber-500 border-slate-200/80 dark:border-slate-800 shadow-2xs'
                          : 'bg-white dark:bg-slate-900 border-l-4 border-l-blue-500 border-slate-200/80 dark:border-slate-800 shadow-2xs'
                  }`}
                >
                  {/* Contenido principal de la tarjeta */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {getPriorityBadge(alert.prioridad)}
                      
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {alert.modulo}
                      </span>

                      <span className="text-[11px] text-slate-400 font-medium">
                        {alert.tiempoRelativo}
                      </span>

                      <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">•</span>

                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        {alert.usuarioRelacionado}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {alert.titulo}
                    </h3>

                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                      {alert.descripcion}
                    </p>
                  </div>

                  {/* Lado derecho: Estado y Acciones */}
                  <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                    {getStatusBadge(alert.estado)}

                    {/* Botón Ver Detalle */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openDetailDrawer('alerta', alert);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                    >
                      Ver detalle
                    </button>

                    {/* Botón Marcar como atendida */}
                    {!isResolved ? (
                      <button
                        onClick={(e) => handleMarkAsAttended(alert.id, e)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                        title="Marcar incidencia como atendida"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Marcar atendida</span>
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold px-2 py-1 flex items-center gap-1">
                        <CheckCheck className="w-4 h-4" />
                        Resuelta
                      </span>
                    )}
                  </div>

                </div>
              );
            })
          )}
        </div>
      )}

      {/* VISTA 2: ACTIVIDAD RECIENTE */}
      {activeTab === 'actividad' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Fecha / Hora</th>
                  <th className="py-3 px-4">Evento</th>
                  <th className="py-3 px-4">Usuario</th>
                  <th className="py-3 px-4">Módulo</th>
                  <th className="py-3 px-4">Resultado</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredActivities.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No se registraron actividades que coincidan con la búsqueda.
                    </td>
                  </tr>
                ) : (
                  filteredActivities.map((act) => (
                    <tr 
                      key={act.id} 
                      onClick={() => openDetailDrawer('actividad', act)}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4 font-mono font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {act.timestamp}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {act.evento}
                        <div className="text-[11px] text-slate-400 font-normal truncate max-w-xs sm:max-w-md">
                          {act.detalles}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        <div className="font-semibold">{act.usuario}</div>
                        <div className="text-[10px] text-slate-400">{act.rol}</div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold border border-indigo-200/60 dark:border-indigo-800/40">
                          {act.modulo}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {act.resultado === 'exitoso' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Exitoso
                          </span>
                        ) : act.resultado === 'bloqueado' ? (
                          <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold text-xs">
                            <AlertTriangle className="w-3.5 h-3.5" /> Bloqueado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold text-xs">
                            <AlertCircle className="w-3.5 h-3.5" /> Error
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openDetailDrawer('actividad', act);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors"
                        >
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* VISTA 3: LOGS DEL SISTEMA (TABLA DENSA Y TÉCNICA) */}
      {activeTab === 'logs' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5 font-semibold">
              <Terminal className="w-3.5 h-3.5 text-indigo-500" />
              Logs de auditoría y microservicios en vivo
            </span>
            <span className="font-mono text-[11px]">
              Retención: 90 días • Cifrado AES-256
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-[11px]">
              <thead>
                <tr className="bg-slate-100/70 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Nivel</th>
                  <th className="py-2.5 px-3">Evento / Endpoint</th>
                  <th className="py-2.5 px-3">Servicio</th>
                  <th className="py-2.5 px-3">Usuario / Agente</th>
                  <th className="py-2.5 px-3">IP</th>
                  <th className="py-2.5 px-3">Resultado</th>
                  <th className="py-2.5 px-3">ID Evento</th>
                  <th className="py-2.5 px-3 text-right">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400 font-sans">
                      No se encontraron registros de logs técnicos coincidentes.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr 
                      key={log.id} 
                      onClick={() => openDetailDrawer('log', log)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                    >
                      <td className="py-2 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {log.timestamp}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        {getLogLevelBadge(log.nivel)}
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-900 dark:text-slate-200">
                        {log.evento}
                      </td>
                      <td className="py-2 px-3 text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                        {log.servicio}
                      </td>
                      <td className="py-2 px-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {log.usuario}
                      </td>
                      <td className="py-2 px-3 text-slate-500 whitespace-nowrap">
                        {log.ip}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          log.codigoHttp >= 200 && log.codigoHttp < 300 
                            ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            : log.codigoHttp === 401 || log.codigoHttp === 403
                              ? 'bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                              : 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                        }`}>
                          {log.resultado}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-400 font-mono whitespace-nowrap">
                        {log.id}
                      </td>
                      <td className="py-2 px-3 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openDetailDrawer('log', log);
                          }}
                          className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-[10px] font-bold font-sans"
                        >
                          JSON
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━
          6. DRAWER LATERAL DE DETALLE DEL EVENTO
          ━━━━━━━━━━━━━━━━━━━━━━ */}
      {isDrawerOpen && selectedEvent && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          
          {/* Backdrop */}
          <div 
            onClick={() => setIsDrawerOpen(false)}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          />

          {/* Panel Lateral */}
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-lg bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col h-full animate-in slide-in-from-right duration-300">
              
              {/* Header del Drawer */}
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black tracking-wider uppercase text-indigo-600 dark:text-indigo-400">
                      {selectedEvent.tipo === 'alerta' ? 'Detalle de la Alerta' : selectedEvent.tipo === 'actividad' ? 'Detalle de Actividad' : 'Inspección de Log'}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Detalle del Evento
                  </h2>
                </div>
                
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Contenido Scrollable */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
                
                {/* ID del evento y Copy */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Identificador Único
                    </div>
                    <div className="font-mono font-bold text-slate-800 dark:text-slate-100 text-sm mt-0.5">
                      {'id' in selectedEvent.data ? selectedEvent.data.id : 'N/A'}
                    </div>
                  </div>
                  <button
                    onClick={() => handleCopyId('id' in selectedEvent.data ? selectedEvent.data.id : '')}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-2xs"
                  >
                    {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId ? 'Copiado' : 'Copiar ID'}</span>
                  </button>
                </div>

                {/* Grid de Metadatos Clave */}
                <div className="grid grid-cols-2 gap-3">
                  
                  {/* Fecha y Hora */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Fecha / Timestamp</span>
                    <p className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {'timestamp' in selectedEvent.data ? selectedEvent.data.timestamp : 'N/A'}
                    </p>
                  </div>

                  {/* Prioridad o Nivel */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Prioridad / Nivel</span>
                    <div>
                      {'prioridad' in selectedEvent.data ? (
                        getPriorityBadge((selectedEvent.data as ExtendedAlert).prioridad)
                      ) : 'nivel' in selectedEvent.data ? (
                        getLogLevelBadge((selectedEvent.data as SystemLogItem).nivel)
                      ) : (
                        <span className="font-bold text-emerald-600">Informativo</span>
                      )}
                    </div>
                  </div>

                  {/* Usuario */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Usuario / Agente</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                      {'usuarioRelacionado' in selectedEvent.data ? (selectedEvent.data as ExtendedAlert).usuarioRelacionado : 'usuario' in selectedEvent.data ? (selectedEvent.data as ActivityItem).usuario : 'Sistema'}
                    </p>
                  </div>

                  {/* Módulo / Servicio */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Módulo / Servicio</span>
                    <p className="font-bold text-indigo-600 dark:text-indigo-400 truncate">
                      {'modulo' in selectedEvent.data ? (selectedEvent.data as ExtendedAlert).modulo : 'servicio' in selectedEvent.data ? (selectedEvent.data as SystemLogItem).servicio : 'General'}
                    </p>
                  </div>

                </div>

                {/* Descripción / Título */}
                <div className="space-y-1.5 p-4 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Descripción del Evento
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {'titulo' in selectedEvent.data ? (selectedEvent.data as ExtendedAlert).titulo : 'evento' in selectedEvent.data ? (selectedEvent.data as ActivityItem).evento : 'Evento Registrado'}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {'descripcion' in selectedEvent.data ? (selectedEvent.data as ExtendedAlert).descripcion : 'detalles' in selectedEvent.data ? (selectedEvent.data as ActivityItem).detalles : JSON.stringify((selectedEvent.data as SystemLogItem).payload)}
                  </p>
                </div>

                {/* Estado (Si es Alerta) con cambio rápido */}
                {selectedEvent.tipo === 'alerta' && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Estado Actual
                      </span>
                      {getStatusBadge((selectedEvent.data as ExtendedAlert).estado)}
                    </div>
                    
                    <div className="pt-2 flex items-center gap-2">
                      <button
                        onClick={() => handleChangeStatus((selectedEvent.data as ExtendedAlert).id, 'pendiente')}
                        className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          (selectedEvent.data as ExtendedAlert).estado === 'pendiente'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                        }`}
                      >
                        Pendiente
                      </button>
                      <button
                        onClick={() => handleChangeStatus((selectedEvent.data as ExtendedAlert).id, 'en_revision')}
                        className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          (selectedEvent.data as ExtendedAlert).estado === 'en_revision'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                        }`}
                      >
                        En revisión
                      </button>
                      <button
                        onClick={() => handleChangeStatus((selectedEvent.data as ExtendedAlert).id, 'atendida')}
                        className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          (selectedEvent.data as ExtendedAlert).estado === 'atendida'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                        }`}
                      >
                        Atendida
                      </button>
                    </div>
                  </div>
                )}

                {/* Datos Relacionados / Payload JSON */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Database className="w-3 h-3 text-indigo-500" />
                    Datos Relacionados (Payload Estructurado)
                  </span>
                  <div className="p-3.5 rounded-2xl bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto border border-slate-800">
                    <pre>
                      {JSON.stringify(
                        'detallesTecnicos' in selectedEvent.data 
                          ? (selectedEvent.data as ExtendedAlert).detallesTecnicos?.payload 
                          : 'payload' in selectedEvent.data 
                            ? (selectedEvent.data as SystemLogItem).payload 
                            : { ip: (selectedEvent.data as ActivityItem).ip, resultado: (selectedEvent.data as ActivityItem).resultado }, 
                        null, 
                        2
                      )}
                    </pre>
                  </div>
                </div>

                {/* Historial / Trazabilidad paso a paso */}
                {'detallesTecnicos' in selectedEvent.data && (selectedEvent.data as ExtendedAlert).detallesTecnicos?.historial && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-indigo-500" />
                      Historial del Evento & Auditoría
                    </span>
                    <div className="space-y-2.5 pl-2 border-l-2 border-slate-200 dark:border-slate-700">
                      {(selectedEvent.data as ExtendedAlert).detallesTecnicos?.historial.map((h, i) => (
                        <div key={i} className="pl-3 relative space-y-0.5">
                          <span className="w-2 h-2 rounded-full bg-indigo-500 absolute -left-[17px] top-1.5" />
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-slate-800 dark:text-slate-200">{h.paso}</span>
                            <span className="font-mono text-[10px] text-slate-400">{h.hora}</span>
                          </div>
                          <div className="text-[10px] text-slate-400">Por: {h.usuario}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              {/* Footer del Drawer con Acciones */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-3">
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors"
                >
                  Cerrar
                </button>

                {selectedEvent.tipo === 'alerta' && (selectedEvent.data as ExtendedAlert).estado !== 'atendida' && (
                  <button
                    onClick={() => handleMarkAsAttended((selectedEvent.data as ExtendedAlert).id)}
                    className="flex-1 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Marcar como atendida</span>
                  </button>
                )}

                {'accionUrl' in selectedEvent.data && (selectedEvent.data as ExtendedAlert).accionUrl !== '#' && (
                  <Link
                    href={(selectedEvent.data as ExtendedAlert).accionUrl}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <span>Ir al módulo</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>

            </div>
          </div>

        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━
          7. MODAL DE EXPORTACIÓN
          ━━━━━━━━━━━━━━━━━━━━━━ */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Download className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Exportar Registros y Auditoría
                </h3>
              </div>
              <button 
                onClick={() => setIsExportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Selecciona el formato en el que deseas descargar el consolidado de alertas activas, bitácora de actividad reciente y registros técnicos del sistema escolar.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => handleExportData('csv')}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 flex flex-col items-center text-center gap-2 transition-all cursor-pointer group"
              >
                <FileText className="w-6 h-6 text-emerald-600 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Formato CSV</div>
                  <div className="text-[10px] text-slate-400">Compatible con Excel y Google Sheets</div>
                </div>
              </button>

              <button
                onClick={() => handleExportData('json')}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 flex flex-col items-center text-center gap-2 transition-all cursor-pointer group"
              >
                <Terminal className="w-6 h-6 text-indigo-600 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Formato JSON</div>
                  <div className="text-[10px] text-slate-400">Para auditoría técnica y APIs</div>
                </div>
              </button>
            </div>

            <div className="pt-2 flex items-center justify-end">
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
              >
                Cancelar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━
          8. MODAL DE CONFIGURACIÓN
          ━━━━━━━━━━━━━━━━━━━━━━ */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Settings className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Configuración del Centro de Alertas
                </h3>
              </div>
              <button 
                onClick={() => setIsConfigModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              
              {/* Opción 1: Umbral de Severidad */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-800 dark:text-slate-200">
                  Umbral de Notificación Automática
                </label>
                <select className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200">
                  <option>Críticas y Advertencias (Recomendado)</option>
                  <option>Únicamente Alertas Críticas</option>
                  <option>Todas las incidencias (Incluye Informativas)</option>
                </select>
              </div>

              {/* Opción 2: Frecuencia de Auto-Refresh */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-800 dark:text-slate-200">
                  Frecuencia de Actualización en Vivo (Polling)
                </label>
                <select className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200">
                  <option>Tiempo real (WebSockets / Push)</option>
                  <option>Cada 30 segundos</option>
                  <option>Cada 5 minutos</option>
                </select>
              </div>

              {/* Opción 3: Toggles de Notificaciones */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Sonido para Alertas Críticas
                  </span>
                  <input type="checkbox" defaultChecked className="w-4 h-4 accent-indigo-600 rounded" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Resumen diario por correo al Director
                  </span>
                  <input type="checkbox" defaultChecked className="w-4 h-4 accent-indigo-600 rounded" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Auto-bloqueo ante intentos de intrusión reiterados
                  </span>
                  <input type="checkbox" defaultChecked className="w-4 h-4 accent-indigo-600 rounded" />
                </div>
              </div>

            </div>

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setIsConfigModalOpen(false);
                  showToast('✓ Configuración guardada correctamente.');
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Guardar Cambios
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
