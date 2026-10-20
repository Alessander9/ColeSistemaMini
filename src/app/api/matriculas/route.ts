import { NextRequest, NextResponse } from 'next/server';
import { fetchStudents, fetchEnrollments, fetchSections, createStudentInDb } from '@/lib/services/academicService';
import { validateStudentPayload, validateDni, validatePeruPhone } from '@/lib/validation/businessRules';

export async function GET() {
  try {
    const enrollments = await fetchEnrollments();
    return NextResponse.json({
      success: true,
      enrollments,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Error al obtener matrículas', error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = body.enrollmentData || body;

    if (!data || !data.nombres || !data.apellidos || !data.dni || !data.seccionId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Faltan campos obligatorios para la matrícula (nombres, apellidos, dni, seccionId)',
          errors: {
            nombres: !data?.nombres ? 'Los nombres son obligatorios' : undefined,
            apellidos: !data?.apellidos ? 'Los apellidos son obligatorios' : undefined,
            dni: !data?.dni ? 'El DNI es obligatorio' : undefined,
            seccionId: !data?.seccionId ? 'La sección es obligatoria' : undefined,
          },
        },
        { status: 400 }
      );
    }

    const [existingStudents, sections, enrollments] = await Promise.all([
      fetchStudents(),
      fetchSections(),
      fetchEnrollments(),
    ]);

    const targetSection = sections.find(s => s.id === data.seccionId);
    if (!targetSection) {
      return NextResponse.json(
        {
          success: false,
          message: 'La sección educativa especificada no existe',
          errors: { seccionId: 'Sección no encontrada' },
        },
        { status: 404 }
      );
    }

    // Comprobar vacantes libres
    const takenSeats = enrollments.filter(e => e.seccion_id === data.seccionId && e.estado === 'activo').length;
    const maxCapacity = targetSection.capacidad_maxima || 30;
    if (takenSeats >= maxCapacity) {
      return NextResponse.json(
        {
          success: false,
          message: 'La sección seleccionada ya no cuenta con vacantes disponibles',
          errors: { seccionId: 'Aula completa' },
        },
        { status: 409 }
      );
    }

    // Validar estudiante y regla de edad según nivel educativo
    const studentValidation = validateStudentPayload(
      {
        nombres: data.nombres,
        apellidos: data.apellidos,
        dni: data.dni,
        fecha_nacimiento: data.fechaNacimiento || data.fecha_nacimiento,
        nombre_apoderado: data.nombreApoderado || data.nombre_apoderado,
        telefono_apoderado: data.telefonoApoderado || data.telefono_apoderado,
        seccion_id: data.seccionId,
        level: data.nivel || targetSection.grado?.nivel,
      },
      {
        existingDnis: existingStudents.map(s => s.dni).filter(Boolean),
      }
    );

    const errors: Record<string, string> = { ...studentValidation.errors };

    // Validar apoderado
    if (data.telefonoApoderado || data.telefono_apoderado) {
      const phoneVal = validatePeruPhone(data.telefonoApoderado || data.telefono_apoderado);
      if (!phoneVal.valid) {
        errors.telefonoApoderado = phoneVal.error!;
      }
    }

    if (data.dniApoderado || data.dni_apoderado) {
      const parentDniVal = validateDni(data.dniApoderado || data.dni_apoderado, { isOptional: true });
      if (!parentDniVal.valid) {
        errors.dniApoderado = parentDniVal.error!;
      }
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'La solicitud de matrícula contiene datos que no cumplen las reglas de negocio',
          errors,
        },
        { status: 422 }
      );
    }

    const created = await createStudentInDb({
      nombres: data.nombres,
      apellidos: data.apellidos,
      dni: data.dni,
      fechaNacimiento: data.fechaNacimiento || data.fecha_nacimiento,
      seccionId: data.seccionId,
      nombreApoderado: data.nombreApoderado || data.nombre_apoderado || 'Apoderado Legal',
      telefonoApoderado: data.telefonoApoderado || data.telefono_apoderado || '999888777',
      dniApoderado: data.dniApoderado || data.dni_apoderado,
      emailApoderado: data.emailApoderado || data.email_apoderado,
      parentesco: data.parentesco || 'Padre',
      genero: data.genero || 'M',
    });

    return NextResponse.json({
      success: true,
      message: 'Matrícula procesada y validada exitosamente',
      student: created.student,
      credentials: created.credentials,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Error interno al procesar matrícula', error: String(error) },
      { status: 500 }
    );
  }
}
