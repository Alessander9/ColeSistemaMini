import { NextRequest, NextResponse } from 'next/server';
import { fetchStudents, fetchEnrollments, registerStudentServer, createStudentInDb } from '@/lib/services/academicService';
import { fetchAttendances } from '@/lib/services/attendanceService';
import { Student, Enrollment } from '@/types';

export async function GET() {
  try {
    const [students, enrollments, attendances] = await Promise.all([
      fetchStudents(),
      fetchEnrollments(),
      fetchAttendances(),
    ]);

    return NextResponse.json({
      success: true,
      students,
      enrollments,
      attendances,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Error al obtener estudiantes del servidor', error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { student, enrollment, createData } = body;

    // Si viene la orden de crear desde datos crudos
    if (createData) {
      const created = await createStudentInDb(createData);
      return NextResponse.json({
        success: true,
        student: created.student,
        credentials: created.credentials,
      });
    }

    // Si viene un estudiante y matrícula ya ensamblados por el cliente
    if (student) {
      registerStudentServer(student as Student, enrollment as Enrollment | undefined);

      return NextResponse.json({
        success: true,
        message: 'Estudiante y matrícula registrados exitosamente en el servidor',
        student,
        enrollment,
      });
    }

    return NextResponse.json(
      { success: false, message: 'Faltan datos de estudiante o matrícula' },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Error interno al registrar estudiante', error: String(error) },
      { status: 500 }
    );
  }
}
