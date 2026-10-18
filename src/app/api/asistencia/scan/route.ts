import { NextRequest, NextResponse } from 'next/server';
import { MOCK_STUDENTS, MOCK_ENROLLMENTS } from '@/lib/mock-data';
import { fetchStudents, fetchEnrollments } from '@/lib/services/academicService';
import { recordAttendanceInDb } from '@/lib/services/attendanceService';
import { findStudentByQr, parseQrPayload, getTodayLocalIso } from '@/lib/attendance/qrMatcher';
import { AttendanceStatus, AttendanceMethod } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tokenQr, metodo = 'qr', status = 'presente', observacion } = body;

    if (!tokenQr) {
      return NextResponse.json(
        { success: false, message: 'Token QR requerido' },
        { status: 400 }
      );
    }

    const rawClean = parseQrPayload(tokenQr);
    if (!rawClean) {
      return NextResponse.json(
        { success: false, message: 'Contenido de QR vacío o inválido' },
        { status: 400 }
      );
    }

    const allStudents = await fetchStudents();
    const student = findStudentByQr(allStudents, rawClean) || findStudentByQr(MOCK_STUDENTS, rawClean);

    if (!student) {
      return NextResponse.json(
        { success: false, message: 'Estudiante no encontrado para este código QR' },
        { status: 404 }
      );
    }

    const allEnrollments = await fetchEnrollments();
    const studentEnrollments = allEnrollments.filter((e) => 
      e.estudiante_id === student.id ||
      e.estudiante?.id === student.id ||
      (student.profile_id && (e.estudiante_id === student.profile_id || e.estudiante?.profile_id === student.profile_id)) ||
      (student.codigo_estudiante && e.estudiante?.codigo_estudiante === student.codigo_estudiante)
    );

    const targetEnrollment = studentEnrollments.find((e) => e.estado === 'activo') ||
      MOCK_ENROLLMENTS.find((e) => e.estudiante_id === student.id && e.estado === 'activo');

    if (!targetEnrollment) {
      return NextResponse.json(
        { success: false, message: 'El estudiante figura como retirado o sin matrícula activa en el periodo lectivo' },
        { status: 400 }
      );
    }

    // Persistir asistencia en base de datos
    const dbRes = await recordAttendanceInDb({
      matriculaId: targetEnrollment.id,
      estado: (status as AttendanceStatus) || 'presente',
      metodo: (metodo as AttendanceMethod) || 'qr',
      observacion,
    });

    const studentName = student.profile
      ? `${student.profile.nombres} ${student.profile.apellidos}`
      : `${student.nombres || ''} ${student.apellidos || ''}`.trim() || 'Estudiante';

    if (dbRes.duplicate) {
      return NextResponse.json(
        {
          success: false,
          duplicate: true,
          message: dbRes.error || `El alumno ${studentName} ya cuenta con asistencia registrada hoy`,
          data: dbRes.record,
        },
        { status: 409 }
      );
    }

    const todayStr = getTodayLocalIso();
    const timeStr = dbRes.record?.hora_registro || new Date().toLocaleTimeString('es-PE', { hour12: false });

    return NextResponse.json({
      success: true,
      message: `¡Asistencia de ${studentName} registrada correctamente a las ${timeStr}!`,
      data: dbRes.record || {
        estudiante: studentName,
        codigo: student.codigo_estudiante,
        fecha: todayStr,
        hora: timeStr,
        estado: status,
        metodo,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor al procesar escaneo QR', error: String(error) },
      { status: 500 }
    );
  }
}
