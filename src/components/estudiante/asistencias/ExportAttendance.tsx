'use client';

import { AttendanceRecord, Student, Enrollment } from '@/types';

export function exportAttendanceToExcel(
  records: AttendanceRecord[],
  student?: Student,
  enrollment?: Enrollment,
  dateRangeLabel?: string
) {
  const headers = ['Fecha', 'Hora de Ingreso', 'Tipo de Registro', 'Estado', 'Dispositivo', 'Ubicacion', 'Observacion'];
  
  const rows = records.map((r) => [
    r.fecha,
    r.hora_registro || '—',
    r.tipo_registro || (r.estado === 'falta' ? 'inasistencia' : 'ingreso'),
    r.estado,
    r.dispositivo || '—',
    r.ubicacion || '—',
    `"${(r.observacion || '').replace(/"/g, '""')}"`,
  ]);

  const studentHeader = [
    ['REPORTE OFICIAL DE ASISTENCIA ESCOLAR'],
    [`Estudiante:`, student ? `${student.profile?.nombres || student.nombres || ''} ${student.profile?.apellidos || student.apellidos || ''}` : 'Estudiante'],
    [`DNI/ID:`, student?.profile?.dni || student?.dni || student?.codigo_estudiante || student?.id || '—'],
    [`Grado y Seccion:`, enrollment?.seccion?.grado ? `${enrollment.seccion.grado.nombre} "${enrollment.seccion.letra}"` : '3° Primaria A'],
    [`Periodo / Rango:`, dateRangeLabel || 'General 2026'],
    [`Generado el:`, new Date().toLocaleDateString('es-PE') + ' ' + new Date().toLocaleTimeString('es-PE')],
    [],
  ];

  const csvContent = [
    ...studentHeader.map(line => line.join(',')),
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `asistencia_${student?.profile?.apellidos || student?.apellidos || 'alumno'}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportAttendanceToPDF(
  records: AttendanceRecord[],
  student?: Student,
  enrollment?: Enrollment,
  dateRangeLabel?: string
) {
  // Generate printable iframe or trigger window print
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const presentCount = records.filter(r => r.estado === 'presente').length;
  const tardanzaCount = records.filter(r => r.estado === 'tardanza').length;
  const faltaCount = records.filter(r => r.estado === 'falta').length;
  const totalCount = records.length;
  const pct = totalCount > 0 ? Math.round(((presentCount + tardanzaCount) / totalCount) * 100) : 100;

  const studentFullName = student ? `${student.profile?.nombres || student.nombres || ''} ${student.profile?.apellidos || student.apellidos || ''}` : 'Estudiante';
  const studentDocId = student?.profile?.dni || student?.dni || student?.codigo_estudiante || student?.id || '—';

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Historial de Asistencias - ${studentFullName}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 30px; color: #1e293b; }
        .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 20px; }
        .title { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0; }
        .subtitle { font-size: 12px; color: #64748b; margin: 4px 0 0 0; }
        .meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; background: #f8fafc; padding: 14px; border-radius: 10px; margin-bottom: 20px; font-size: 12px; }
        .kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
        .kpi-box { padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; text-align: center; }
        .kpi-title { font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; }
        .kpi-val { font-size: 18px; font-weight: 800; margin-top: 4px; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        th { background: #f1f5f9; text-align: left; padding: 8px 10px; font-weight: 700; color: #475569; border-bottom: 1px solid #cbd5e1; }
        td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 700; }
        .badge-presente { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
        .badge-tardanza { background: #fffbeb; color: #b45309; border: 1px solid #fde68a; }
        .badge-falta { background: #fff1f2; color: #be123c; border: 1px solid #fecdd3; }
        .badge-justificado { background: #f0f9ff; color: #0369a1; border: 1px solid #bae6fd; }
        .footer { margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 10px; color: #94a3b8; text-align: center; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 class="title">COLEGIO MONTESSORI • SISTEMA INSTITUCIONAL</h1>
        <p class="subtitle">Bitácora Oficial de Asistencias & Control de Ingresos con Código QR</p>
      </div>

      <div class="meta-grid">
        <div><strong>Estudiante:</strong> ${studentFullName}</div>
        <div><strong>DNI / Código:</strong> ${studentDocId}</div>
        <div><strong>Grado y Sección:</strong> ${enrollment?.seccion?.grado?.nombre || 'Primaria'} "${enrollment?.seccion?.letra || 'A'}"</div>
        <div><strong>Rango Seleccionado:</strong> ${dateRangeLabel || 'Septiembre 2026'}</div>
        <div><strong>Fecha de Emisión:</strong> ${new Date().toLocaleDateString('es-PE')}</div>
        <div><strong>Total Registros:</strong> ${totalCount}</div>
      </div>

      <div class="kpi-row">
        <div class="kpi-box">
          <div class="kpi-title">Asistencia Global</div>
          <div class="kpi-val" style="color: #059669;">${pct}%</div>
        </div>
        <div class="kpi-box">
          <div class="kpi-title">Puntuales</div>
          <div class="kpi-val" style="color: #0284c7;">${presentCount}</div>
        </div>
        <div class="kpi-box">
          <div class="kpi-title">Tardanzas</div>
          <div class="kpi-val" style="color: #d97706;">${tardanzaCount}</div>
        </div>
        <div class="kpi-box">
          <div class="kpi-title">Inasistencias</div>
          <div class="kpi-val" style="color: #e11d48;">${faltaCount}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Hora</th>
            <th>Tipo</th>
            <th>Estado</th>
            <th>Dispositivo</th>
            <th>Observación</th>
          </tr>
        </thead>
        <tbody>
          ${records.map(r => `
            <tr>
              <td><strong>${r.fecha}</strong></td>
              <td>${r.hora_registro || '—'}</td>
              <td>${r.tipo_registro || (r.estado === 'falta' ? 'Inasistencia' : 'Ingreso')}</td>
              <td>
                <span class="badge badge-${r.estado}">
                  ${r.estado === 'presente' ? '✓ A tiempo' : r.estado === 'tardanza' ? '⚠ Tardanza' : r.estado === 'falta' ? '✕ Falta' : 'ℹ Justificado'}
                </span>
              </td>
              <td>${r.dispositivo || 'Kiosko QR'}</td>
              <td>${r.observacion || '—'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="footer">
        Documento generado automáticamente para seguimiento del estudiante. Válido institucionalmente sin enmiendas.
      </div>

      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
