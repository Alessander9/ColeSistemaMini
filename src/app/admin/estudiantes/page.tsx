'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { QrCard } from '@/components/qr/QrCard';
import { Student } from '@/types';
import { UserPlus, QrCode, Phone, UserCheck, ShieldCheck } from 'lucide-react';

export default function AdminEstudiantesPage() {
  const { students, enrollments, addStudent } = useApp();
  const [selectedStudentForQr, setSelectedStudentForQr] = useState<Student | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    dni: '',
    fechaNacimiento: '2016-05-15',
    seccionId: 'sec-3pri-a',
    nombreApoderado: '',
    telefonoApoderado: '',
  });

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombres || !formData.apellidos || !formData.dni) return;

    const result = addStudent(formData);
    setIsAddModalOpen(false);
    setSelectedStudentForQr(result.student);
    setFormData({
      nombres: '',
      apellidos: '',
      dni: '',
      fechaNacimiento: '2016-05-15',
      seccionId: 'sec-3pri-a',
      nombreApoderado: '',
      telefonoApoderado: '',
    });
  };

  const columns: Column<Student>[] = [
    {
      header: 'Estudiante',
      cell: (student) => {
        const fullName = `${student.profile?.apellidos}, ${student.profile?.nombres}`;
        return (
          <div className="flex items-center gap-3">
            <img
              src={student.profile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
              alt={fullName}
              className="w-9 h-9 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
            />
            <div>
              <p className="font-extrabold text-slate-800 dark:text-white">{fullName}</p>
              <p className="text-[10px] font-mono text-slate-400 font-bold">{student.codigo_estudiante}</p>
            </div>
          </div>
        );
      },
    },
    {
      header: 'DNI',
      cell: (student) => (
        <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300">
          {student.profile?.dni}
        </span>
      ),
    },
    {
      header: 'Grado / Sección',
      cell: (student) => {
        const enr = enrollments.find(e => e.estudiante_id === student.id);
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {enr?.seccion?.grado?.nombre || '3° Primaria'} &quot;{enr?.seccion?.letra || 'A'}&quot;
          </span>
        );
      },
    },
    {
      header: 'Apoderado / Contacto',
      cell: (student) => (
        <div className="text-xs">
          <p className="font-bold text-slate-700 dark:text-slate-300">{student.nombre_apoderado || 'No registrado'}</p>
          <p className="text-[10px] text-slate-400 flex items-center gap-1">
            <Phone className="w-3 h-3" /> {student.telefono_apoderado || '-'}
          </p>
        </div>
      ),
    },
    {
      header: 'Acciones',
      cell: (student) => (
        <button
          type="button"
          onClick={() => setSelectedStudentForQr(student)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-all cursor-pointer"
        >
          <QrCode className="w-3.5 h-3.5" />
          Ver Carnet QR
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in-50">
      <PageHeader
        title="Gestión de Estudiantes & Carnets QR"
        description="Padrón general de alumnos, emisión de credenciales y generación automática de carnets con código QR."
        badge={`${students.length} Estudiantes`}
      >
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all active:scale-95"
        >
          <UserPlus className="w-3.5 h-3.5" />
          Registrar Estudiante
        </button>
      </PageHeader>

      <DataTable
        data={students}
        columns={columns}
        searchPlaceholder="Buscar por nombre, apellidos o DNI..."
        searchFilter={(s, q) =>
          `${s.profile?.nombres} ${s.profile?.apellidos} ${s.profile?.dni} ${s.codigo_estudiante}`
            .toLowerCase()
            .includes(q)
        }
      />

      {/* View QR ID Modal */}
      {selectedStudentForQr && (
        <Modal
          isOpen={!!selectedStudentForQr}
          onClose={() => setSelectedStudentForQr(null)}
          title="Carnet Escolar con Código QR"
          maxWidth="md"
        >
          <QrCard student={selectedStudentForQr} showActions={true} />
        </Modal>
      )}

      {/* Add Student Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Registrar Nuevo Estudiante"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateStudent} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nombres *</label>
              <input
                required
                type="text"
                placeholder="Ej. Mateo Alejandro"
                value={formData.nombres}
                onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Apellidos *</label>
              <input
                required
                type="text"
                placeholder="Ej. Silva Quispe"
                value={formData.apellidos}
                onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">DNI del Alumno *</label>
              <input
                required
                type="text"
                maxLength={8}
                placeholder="8 dígitos"
                value={formData.dni}
                onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Sección de Matrícula *</label>
              <select
                value={formData.seccionId}
                onChange={(e) => setFormData({ ...formData, seccionId: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="sec-3pri-a">3° de Primaria &quot;A&quot;</option>
                <option value="sec-3pri-b">3° de Primaria &quot;B&quot;</option>
                <option value="sec-5pri-a">5° de Primaria &quot;A&quot;</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nombre del Apoderado</label>
              <input
                type="text"
                placeholder="Ej. Jorge Silva Rodríguez"
                value={formData.nombreApoderado}
                onChange={(e) => setFormData({ ...formData, nombreApoderado: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Teléfono de Contacto</label>
              <input
                type="text"
                placeholder="Ej. 955443322"
                value={formData.telefonoApoderado}
                onChange={(e) => setFormData({ ...formData, telefonoApoderado: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow transition-all active:scale-95"
            >
              Guardar y Generar QR
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
