import { NextRequest, NextResponse } from 'next/server';
import { fetchStudents, fetchEnrollments, fetchSections, registerStudentServer, createStudentInDb } from '@/lib/services/academicService';
import { fetchAttendances } from '@/lib/services/attendanceService';
import { Student, Enrollment } from '@/types';
import { validateStudentPayload } from '@/lib/validation/businessRules';

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

    const target = createData || student || (body.nombres && body.dni ? body : null);

    if (!target) {
      return NextResponse.json(
        { success: false, message: 'Faltan datos de estudiante o matrícula' },
        { status: 400 }
      );
    }

    // Obtener secciones y estudiantes existentes para validación integral
    const [existingStudents, allSections] = await Promise.all([
      fetchStudents(),
      fetchSections(),
    ]);

    const seccionId = target.seccionId || target.seccion_id || enrollment?.seccion_id;
    const targetSection = seccionId ? allSections.find(s => s.id === seccionId) : undefined;
    const inferredLevel = target.level || target.nivel || targetSection?.grado?.nivel;

    const validation = validateStudentPayload(
      {
        nombres: target.nombres,
        apellidos: target.apellidos,
        dni: target.dni,
        fecha_nacimiento: target.fecha_nacimiento || target.fechaNacimiento,
        telefono_apoderado: target.telefono_apoderado || target.telefonoApoderado,
        nombre_apoderado: target.nombre_apoderado || target.nombreApoderado,
        seccion_id: seccionId,
        level: inferredLevel,
      },
      {
        existingDnis: existingStudents.map(s => s.dni).filter(Boolean),
        currentStudentId: target.id,
      }
    );

    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          message: validation.message || 'Errores de validación en los datos del estudiante',
          errors: validation.errors,
        },
        { status: 422 }
      );
    }

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

    return NextResponse.json({
      success: true,
      message: 'Datos de estudiante validados correctamente',
      data: target,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Error interno al registrar estudiante', error: String(error) },
      { status: 500 }
    );
  }
}
