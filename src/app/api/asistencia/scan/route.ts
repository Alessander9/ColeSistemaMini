import { NextRequest, NextResponse } from 'next/server';
import { MOCK_STUDENTS, MOCK_ENROLLMENTS, MOCK_ATTENDANCES } from '@/lib/mock-data';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tokenQr, metodo = 'qr', status = 'presente' } = body;

    if (!tokenQr) {
      return NextResponse.json(
        { success: false, message: 'Token QR requerido' },
        { status: 400 }
      );
    }

    const student = MOCK_STUDENTS.find(
      (s) => s.token_qr === tokenQr || s.codigo_estudiante === tokenQr
    );

    if (!student) {
      return NextResponse.json(
        { success: false, message: 'Estudiante no encontrado para este código QR' },
        { status: 404 }
      );
    }

    const enrollment = MOCK_ENROLLMENTS.find((e) => e.estudiante_id === student.id);
    if (!enrollment) {
      return NextResponse.json(
        { success: false, message: 'Estudiante sin matrícula activa' },
        { status: 400 }
      );
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toLocaleTimeString('es-PE', { hour12: false });
    const studentName = `${student.profile?.nombres} ${student.profile?.apellidos}`;

    return NextResponse.json({
      success: true,
      message: `¡Asistencia de ${studentName} registrada correctamente a las ${timeStr}!`,
      data: {
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
      { success: false, message: 'Error interno del servidor', error: String(error) },
      { status: 500 }
    );
  }
}
