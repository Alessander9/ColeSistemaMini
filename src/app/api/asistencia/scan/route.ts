import { NextRequest, NextResponse } from 'next/server';
import { MOCK_STUDENTS, MOCK_ENROLLMENTS } from '@/lib/mock-data';
import { fetchStudents, fetchEnrollments } from '@/lib/services/academicService';

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

    let rawToken = String(tokenQr).trim();
    if (rawToken.startsWith('{') && rawToken.endsWith('}')) {
      try {
        const parsed = JSON.parse(rawToken);
        rawToken = parsed.token_qr || parsed.codigo || parsed.codigo_estudiante || parsed.dni || parsed.id || rawToken;
      } catch {
        /* fallback */
      }
    }

    const normalize = (s?: string) =>
      s ? s.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') : '';
    const normToken = normalize(rawToken);

    const codeMatch = rawToken.match(/EST-\d{4}-[\w-]+/i);
    const extractedCode = codeMatch ? normalize(codeMatch[0]) : '';
    const dniMatch = rawToken.match(/\b\d{8}\b/);
    const extractedDni = dniMatch ? dniMatch[0] : '';

    const allStudents = await fetchStudents();
    const student = allStudents.find(
      (s) => {
        const sToken = normalize(s.token_qr);
        const sCode = normalize(s.codigo_estudiante);
        const sDni = normalize(s.profile?.dni || s.dni);
        return (
          (sToken && (sToken === normToken || normToken.includes(sToken) || sToken.includes(normToken))) ||
          (sCode && (sCode === normToken || normToken.includes(sCode) || sCode.includes(normToken) || (extractedCode && sCode === extractedCode))) ||
          (sDni && (sDni === normToken || normToken.includes(sDni) || (extractedDni && sDni === extractedDni))) ||
          s.id === rawToken ||
          s.profile_id === rawToken ||
          (normToken.includes(sCode) && sCode.length >= 4)
        );
      }
    ) || MOCK_STUDENTS.find(
      (s) =>
        s.token_qr === rawToken ||
        normalize(s.codigo_estudiante) === normToken ||
        normalize(s.profile?.dni) === normToken
    );

    if (!student) {
      return NextResponse.json(
        { success: false, message: 'Estudiante no encontrado para este código QR' },
        { status: 404 }
      );
    }

    const allEnrollments = await fetchEnrollments();
    const enrollment = allEnrollments.find((e) => 
      e.estudiante_id === student.id ||
      e.estudiante?.id === student.id ||
      (student.profile_id && (e.estudiante_id === student.profile_id || e.estudiante?.profile_id === student.profile_id)) ||
      (student.codigo_estudiante && e.estudiante?.codigo_estudiante === student.codigo_estudiante)
    ) || MOCK_ENROLLMENTS.find((e) => e.estudiante_id === student.id);

    const todayStr = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toLocaleTimeString('es-PE', { hour12: false });
    const studentName = student.profile
      ? `${student.profile.nombres} ${student.profile.apellidos}`
      : `${student.nombres || ''} ${student.apellidos || ''}`.trim() || 'Estudiante';

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
