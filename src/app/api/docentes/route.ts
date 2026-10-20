import { NextRequest, NextResponse } from 'next/server';
import { MOCK_TEACHERS, MOCK_USERS } from '@/lib/mock-data';
import { validateTeacherPayload } from '@/lib/validation/businessRules';

const g = (typeof globalThis !== 'undefined' ? globalThis : global) as any;
if (!g.__coleLocalTeachers) g.__coleLocalTeachers = [...MOCK_TEACHERS];

export async function GET() {
  try {
    const teachers = g.__coleLocalTeachers || MOCK_TEACHERS;
    return NextResponse.json({
      success: true,
      teachers,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Error al obtener docentes', error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const candidate = body.teacher || body;

    if (!candidate || !candidate.nombres || !candidate.dni) {
      return NextResponse.json(
        {
          success: false,
          message: 'Faltan datos obligatorios del docente (nombres, dni)',
          errors: {
            nombres: !candidate?.nombres ? 'Los nombres son obligatorios' : undefined,
            dni: !candidate?.dni ? 'El DNI es obligatorio' : undefined,
          },
        },
        { status: 400 }
      );
    }

    const currentTeachers = g.__coleLocalTeachers || MOCK_TEACHERS;
    const existingDnis = [
      ...currentTeachers.map((t: any) => t.dni),
      ...MOCK_USERS.map((u: any) => u.dni),
    ].filter(Boolean);

    const validation = validateTeacherPayload(
      {
        nombres: candidate.nombres,
        apellidos: candidate.apellidos,
        dni: candidate.dni,
        fecha_nacimiento: candidate.fecha_nacimiento || candidate.fechaNacimiento,
        telefono: candidate.telefono,
        email: candidate.email,
        especialidad: candidate.especialidad,
      },
      {
        existingDnis,
        currentTeacherId: candidate.id,
      }
    );

    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          message: validation.message || 'Errores de validación en los datos del docente',
          errors: validation.errors,
        },
        { status: 422 }
      );
    }

    const newTeacher = {
      id: candidate.id || `teacher-${Date.now()}`,
      nombres: candidate.nombres.trim(),
      apellidos: candidate.apellidos.trim(),
      dni: candidate.dni.trim(),
      fecha_nacimiento: candidate.fecha_nacimiento || candidate.fechaNacimiento || undefined,
      telefono: candidate.telefono ? candidate.telefono.trim() : undefined,
      email: candidate.email ? candidate.email.trim() : undefined,
      especialidad: candidate.especialidad ? candidate.especialidad.trim() : 'Docente',
      activo: candidate.activo !== undefined ? candidate.activo : true,
      created_at: new Date().toISOString(),
    };

    currentTeachers.push(newTeacher);

    return NextResponse.json({
      success: true,
      message: 'Docente registrado exitosamente',
      teacher: newTeacher,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Error interno al procesar docente', error: String(error) },
      { status: 500 }
    );
  }
}
