'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Modal } from '@/components/ui/Modal';
import { PaymentRecord, Student, Enrollment } from '@/types';
import { 
  DollarSign, 
  CreditCard, 
  Calendar, 
  Search, 
  Filter, 
  Download, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileText, 
  Users, 
  ArrowUpDown,
  Building,
  TrendingUp,
  Receipt,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { generateReceiptPdf } from '@/lib/pdf/receiptPdfGenerator';
import confetti from 'canvas-confetti';

export default function AdminTesoreriaPage() {
  /* 
   * =========================================================================
   * [MÓDULO DESACTIVADO / COMENTADO]
   * Esta institución educativa no maneja pensiones, tesorería ni recaudación.
   * El módulo ha sido retirado del menú lateral y de los perfiles de estudiantes.
   * =========================================================================
   */
  const isModuleDisabled = true;

  const { 
    payments, 
    addPayment, 
    updatePaymentStatus, 
    generateMonthlyFeeRecords, 
    students, 
    enrollments, 
    sections, 
    gradeLevels, 
    brandingConfig, 
    showToast 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'cobranzas' | 'emision' | 'morosidad'>('cobranzas');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'todos' | 'pagado' | 'pendiente' | 'mora'>('todos');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState('todos');
  const [selectedConceptFilter, setSelectedConceptFilter] = useState('todos');

  // Modals
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [selectedPaymentToPay, setSelectedPaymentToPay] = useState<PaymentRecord | null>(null);

  // Pay Form
  const [payFormData, setPayFormData] = useState({
    metodoPago: 'efectivo' as 'efectivo' | 'yape' | 'plin' | 'transferencia' | 'tarjeta',
    numeroOperacion: '',
    descuento: 0,
    mora: 0,
  });

  // Bulk Generation Form
  const [bulkFormData, setBulkFormData] = useState({
    mesNombre: 'Pensión de Octubre 2026',
    montoInicial: 350,
    montoPrimaria: 420,
    montoSecundaria: 480,
    fechaVencimiento: '2026-10-31',
  });

  // Financial KPIs
  const financialKpis = useMemo(() => {
    let totalFacturado = 0;
    let totalRecaudado = 0;
    let totalPendiente = 0;
    let totalMora = 0;
    let countPagados = 0;
    let countPendientes = 0;
    let countMora = 0;

    payments.forEach(p => {
      totalFacturado += p.total;
      if (p.estado === 'pagado') {
        totalRecaudado += p.total;
        countPagados++;
      } else if (p.estado === 'vencido') {
        // Fix 1.5: Usar solo estado === 'vencido' como fuente única de mora
        totalMora += p.total;
        countMora++;
      } else {
        totalPendiente += p.total;
        countPendientes++;
      }
    });

    const recaudacionPct = totalFacturado > 0 ? Math.round((totalRecaudado / totalFacturado) * 100) : 0;

    return {
      totalFacturado,
      totalRecaudado,
      totalPendiente,
      totalMora,
      countPagados,
      countPendientes,
      countMora,
      recaudacionPct
    };
  }, [payments]);

  // Unique Concepts
  const uniqueConcepts = useMemo(() => {
    const list = Array.from(new Set(payments.map(p => p.concepto)));
    return list;
  }, [payments]);

  // Filtered Payments List
  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      const student = students.find(s => s.id === p.estudiante_id);
      const studentName = student ? `${student.profile?.apellidos || student.apellidos || ''} ${student.profile?.nombres || student.nombres || ''} ${student.codigo_estudiante || ''}`.toLowerCase() : '';
      
      const matchSearch = !searchQuery || 
        studentName.includes(searchQuery.toLowerCase()) || 
        p.concepto.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = selectedStatusFilter === 'todos' || p.estado === selectedStatusFilter;
      const matchConcept = selectedConceptFilter === 'todos' || p.concepto === selectedConceptFilter;

      let matchSection = true;
      if (selectedSectionFilter !== 'todos') {
        const enrollment = enrollments.find(e => e.estudiante_id === p.estudiante_id);
        matchSection = enrollment?.seccion_id === selectedSectionFilter;
      }

      return matchSearch && matchStatus && matchConcept && matchSection;
    });
  }, [payments, students, enrollments, searchQuery, selectedStatusFilter, selectedConceptFilter, selectedSectionFilter]);

  // Morosidad per section summary
  const morosidadBySection = useMemo(() => {
    return sections.map(sec => {
      const secEnrollments = enrollments.filter(e => e.seccion_id === sec.id && e.estado === 'activo');
      const studentIds = secEnrollments.map(e => e.estudiante_id);
      
      const secPayments = payments.filter(p => studentIds.includes(p.estudiante_id));
      const moraPayments = secPayments.filter(p => p.estado === 'vencido'); // Fix 1.5: solo 'vencido'
      const pendientePayments = secPayments.filter(p => p.estado === 'pendiente');
      
      const moraAmount = moraPayments.reduce((acc, p) => acc + p.total, 0);
      const debtorStudentsCount = new Set([...moraPayments, ...pendientePayments].map(p => p.estudiante_id)).size;

      return {
        seccion: sec,
        totalStudents: secEnrollments.length,
        debtorStudentsCount,
        moraAmount,
        totalPaymentsCount: secPayments.length,
        pendingCount: moraPayments.length + pendientePayments.length
      };
    });
  }, [sections, enrollments, payments]);

  // Handle Pay Submission
  const handleConfirmPayment = () => {
    if (!selectedPaymentToPay) return;

    updatePaymentStatus(
      selectedPaymentToPay.id,
      'pagado',
      {
        metodo_pago: payFormData.metodoPago,
        numero_operacion: payFormData.numeroOperacion || undefined
      }
    );

    confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
    showToast(`Pago de "${selectedPaymentToPay.concepto}" registrado con éxito`, 'success', 'Caja');
    setIsPayModalOpen(false);
    setSelectedPaymentToPay(null);
  };

  // Handle Bulk Generation
  const handleBulkGeneration = (e: React.FormEvent) => {
    e.preventDefault();

    generateMonthlyFeeRecords(
      bulkFormData.mesNombre,
      bulkFormData.fechaVencimiento,
      {
        inicial: Number(bulkFormData.montoInicial),
        primaria: Number(bulkFormData.montoPrimaria),
        secundaria: Number(bulkFormData.montoSecundaria),
      }
    );

    confetti({ particleCount: 50, spread: 70, origin: { y: 0.5 } });
    showToast(`Pensiones de "${bulkFormData.mesNombre}" generadas para todos los alumnos activos`, 'success', 'Tesorería');
    setIsBulkModalOpen(false);
  };

  // Download PDF Receipt
  const handleDownloadReceipt = async (payment: PaymentRecord) => {
    try {
      const student = students.find(s => s.id === payment.estudiante_id);
      const enrollment = enrollments.find(e => e.estudiante_id === payment.estudiante_id);

      const doc = await generateReceiptPdf({
        payment,
        student,
        enrollment,
        brandingConfig
      });

      doc.save(`Recibo_Caja_${payment.id}.pdf`);
      showToast('Recibo A5 generado exitosamente', 'success', 'Descarga');
    } catch (err) {
      console.error(err);
      showToast('Error al generar el recibo PDF', 'error');
    }
  };

  const getStudentInfo = (estudianteId: string) => {
    const s = students.find(item => item.id === estudianteId);
    const en = enrollments.find(item => item.estudiante_id === estudianteId);
    const sec = sections.find(item => item.id === en?.seccion_id);
    return {
      nombre: s ? `${s.profile?.apellidos || s.apellidos || ''}, ${s.profile?.nombres || s.nombres || ''}` : 'Estudiante',
      codigo: s?.codigo_estudiante || '—',
      dni: s?.profile?.dni || s?.dni || '—',
      aula: sec ? `${sec.grado?.nombre} "${sec.letra}"` : 'Sin aula'
    };
  };

  if (isModuleDisabled) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-10">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-8 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-sm">
            <DollarSign className="w-8 h-8" />
          </div>
          <div className="space-y-1.5 max-w-lg mx-auto">
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              Módulo de Tesorería & Pensiones Desactivado
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Esta institución educativa no realiza cobro de pensiones ni recaudación económica. El sistema opera 100% enfocado en la gestión académica, pedagógica CNEB y control de asistencia.
            </p>
          </div>
          <div className="pt-3">
            <a
              href="/admin"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 text-white text-xs font-bold shadow-md hover:bg-indigo-700 transition-all cursor-pointer"
            >
              Ir al Panel General
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in-50 duration-200">
      
      {/* ── 1. HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Tesorería & Gestión de Pensiones Escolares
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200">
                Finanzas 2026
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Control de cronogramas de pensiones por nivel, cobros en caja con recibos A5 y reporte de morosidad.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setIsBulkModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm shadow-xl shadow-emerald-600/25 transition-all duration-200 active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>+ Generar Pensiones del Mes</span>
          </button>
        </div>
      </div>

      {/* ── 2. KPIS FINANCIEROS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Total Facturado</span>
            <Building className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            S/ {financialKpis.totalFacturado.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] font-semibold text-slate-500">{payments.length} obligaciones generadas</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Recaudado (Caja)</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            S/ {financialKpis.totalRecaudado.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${financialKpis.recaudacionPct}%` }} />
            </div>
            <span className="text-[11px] font-bold text-emerald-600">{financialKpis.recaudacionPct}%</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Por Cobrar (Pendiente)</span>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">
            S/ {financialKpis.totalPendiente.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] font-semibold text-slate-500">{financialKpis.countPendientes} cuotas por vencer</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">En Mora (Vencidas)</span>
            <AlertCircle className="w-5 h-5 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">
            S/ {financialKpis.totalMora.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] font-semibold text-rose-500 font-bold">{financialKpis.countMora} recibos vencidos</span>
        </div>
      </div>

      {/* ── 3. TABS DE NAVEGACIÓN ── */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('cobranzas')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'cobranzas'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
          }`}
        >
          🧾 Registro de Cobranzas & Recibos ({filteredPayments.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('morosidad')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'morosidad'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
          }`}
        >
          📊 Morosidad por Aula ({sections.length} Aulas)
        </button>
      </div>

      {/* ── 4. CONTENIDO TAB COBRANZAS ── */}
      {activeTab === 'cobranzas' && (
        <div className="space-y-4">
          {/* Filtros */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar por estudiante, DNI o concepto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
                className="px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
              >
                <option value="todos">Todos los Estados</option>
                <option value="pagado">Pagados (Cancelados)</option>
                <option value="pendiente">Pendientes</option>
                <option value="mora">En Mora</option>
              </select>

              <select
                value={selectedSectionFilter}
                onChange={(e) => setSelectedSectionFilter(e.target.value)}
                className="px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
              >
                <option value="todos">Todas las Aulas</option>
                {sections.map(sec => (
                  <option key={sec.id} value={sec.id}>{sec.grado?.nombre} &quot;{sec.letra}&quot;</option>
                ))}
              </select>

              <select
                value={selectedConceptFilter}
                onChange={(e) => setSelectedConceptFilter(e.target.value)}
                className="px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
              >
                <option value="todos">Todos los Conceptos</option>
                {uniqueConcepts.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tabla de Cobranzas */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Recibo / ID</th>
                    <th className="py-3 px-4">Estudiante & Aula</th>
                    <th className="py-3 px-4">Concepto</th>
                    <th className="py-3 px-4">Importe</th>
                    <th className="py-3 px-4">Vencimiento</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredPayments.map((payment) => {
                    const studentInfo = getStudentInfo(payment.estudiante_id);
                    return (
                      <tr key={payment.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                            {payment.id.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">{studentInfo.nombre}</div>
                          <div className="text-[11px] text-slate-400">DNI: {studentInfo.dni} • {studentInfo.aula}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{payment.concepto}</span>
                          {payment.metodo_pago && (
                            <div className="text-[10px] text-slate-400 capitalize">Vía: {payment.metodo_pago}</div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-black text-slate-900 dark:text-white">
                            S/ {payment.total.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-slate-600 dark:text-slate-300">{payment.fecha_vencimiento}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                            payment.estado === 'pagado' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            payment.estado === 'vencido' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                            'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {payment.estado}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {payment.estado !== 'pagado' ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedPaymentToPay(payment);
                                  setIsPayModalOpen(true);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                              >
                                Cobrar
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleDownloadReceipt(payment)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
                                title="Descargar Recibo A5"
                              >
                                <Download className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Recibo A5</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── 5. CONTENIDO TAB MOROSIDAD POR AULA ── */}
      {activeTab === 'morosidad' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Índice de Morosidad por Grado & Sección
              </h3>
              <p className="text-xs text-slate-500">
                Monitoreo de deudas pendientes para cobranza institucional.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Aula / Nivel</th>
                  <th className="py-3 px-4">Total Alumnos</th>
                  <th className="py-3 px-4">Alumnos con Deuda</th>
                  <th className="py-3 px-4">Cuotas Vencidas</th>
                  <th className="py-3 px-4">Monto en Mora (S/)</th>
                  <th className="py-3 px-4">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {morosidadBySection.map((item) => (
                  <tr key={item.seccion.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {item.seccion.grado?.nombre} &quot;{item.seccion.letra}&quot; ({item.seccion.grado?.nivel.toUpperCase()})
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                      {item.totalStudents} estudiantes
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">
                      {item.debtorStudentsCount}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {item.pendingCount}
                    </td>
                    <td className="py-3 px-4 font-black text-rose-600 dark:text-rose-400">
                      S/ {item.moraAmount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      {item.debtorStudentsCount === 0 ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Al Día
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          {Math.round((item.debtorStudentsCount / (item.totalStudents || 1)) * 100)}% en Mora
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 6. MODAL REGISTRAR COBRO EN CAJA ── */}
      {isPayModalOpen && selectedPaymentToPay && (
        <Modal
          isOpen={isPayModalOpen}
          onClose={() => setIsPayModalOpen(false)}
          title="Registrar Cobro en Caja / Emisión de Recibo"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                  Concepto: {selectedPaymentToPay.concepto}
                </span>
                <span className="font-black text-emerald-700 dark:text-emerald-300 text-sm">
                  S/ {selectedPaymentToPay.total.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                Estudiante: {getStudentInfo(selectedPaymentToPay.estudiante_id).nombre}
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Método de Pago *
              </label>
              <select
                value={payFormData.metodoPago}
                onChange={(e) => setPayFormData(prev => ({ ...prev, metodoPago: e.target.value as any }))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white"
              >
                <option value="efectivo">💵 Efectivo (Caja Directa)</option>
                <option value="yape">📱 Yape</option>
                <option value="plin">📱 Plin</option>
                <option value="transferencia">🏦 Transferencia Bancaria (BCP/BBVA)</option>
                <option value="tarjeta">💳 Tarjeta Débito / Crédito</option>
              </select>
            </div>

            {payFormData.metodoPago !== 'efectivo' && (
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  N° de Operación / Código de Aprobación
                </label>
                <input
                  type="text"
                  placeholder="Ej. OP-9823412"
                  value={payFormData.numeroOperacion}
                  onChange={(e) => setPayFormData(prev => ({ ...prev, numeroOperacion: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setIsPayModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmPayment}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Confirmar Pago & Marcar Cancelado
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── 7. MODAL EMISIÓN MASIVA DE PENSIONES ── */}
      {isBulkModalOpen && (
        <Modal
          isOpen={isBulkModalOpen}
          onClose={() => setIsBulkModalOpen(false)}
          title="Emisión Masiva de Pensiones Escolares"
        >
          <form onSubmit={handleBulkGeneration} className="space-y-4 text-xs">
            <p className="text-xs text-slate-500">
              Esta acción generará automáticamente los recibos pendientes de pago para todos los estudiantes matriculados activos, diferenciados por nivel educativo.
            </p>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nombre del Concepto / Mes *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Pensión de Octubre 2026"
                value={bulkFormData.mesNombre}
                onChange={(e) => setBulkFormData(prev => ({ ...prev, mesNombre: e.target.value }))}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Fecha de Vencimiento *
              </label>
              <input
                type="date"
                required
                value={bulkFormData.fechaVencimiento}
                onChange={(e) => setBulkFormData(prev => ({ ...prev, fechaVencimiento: e.target.value }))}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Inicial (S/)
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={bulkFormData.montoInicial}
                  onChange={(e) => setBulkFormData(prev => ({ ...prev, montoInicial: Number(e.target.value) }))}
                  className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Primaria (S/)
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={bulkFormData.montoPrimaria}
                  onChange={(e) => setBulkFormData(prev => ({ ...prev, montoPrimaria: Number(e.target.value) }))}
                  className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Secundaria (S/)
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={bulkFormData.montoSecundaria}
                  onChange={(e) => setBulkFormData(prev => ({ ...prev, montoSecundaria: Number(e.target.value) }))}
                  className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Generar Pensiones Masivamente
              </button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
}
