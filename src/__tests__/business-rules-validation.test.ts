import { describe, it, expect } from 'vitest';
import {
  calculateAge,
  validateDni,
  validatePeruPhone,
  validateStudentBirthDate,
  validateTeacherBirthDate,
  validateStudentPayload,
  validateTeacherPayload,
} from '../lib/validation/businessRules';
import { DEFAULT_ACADEMIC_AGE_RANGES, TEACHER_AGE_RULES } from '../lib/validation/academicAgeConfig';
import { POST as studentApiPost } from '../app/api/estudiantes/route';
import { POST as teacherApiPost } from '../app/api/docentes/route';
import { POST as enrollmentApiPost } from '../app/api/matriculas/route';
import { NextRequest } from 'next/server';

describe('Sistema Integral de Validaciones y Reglas de Negocio', () => {
  // ── 1. Validación de DNI Peruano (8 dígitos numéricos) ──
  describe('Validación de DNI Peruano', () => {
    it('acepta DNI válido de 8 dígitos numéricos', () => {
      const res = validateDni('74859612');
      expect(res.valid).toBe(true);
      expect(res.error).toBeUndefined();
    });

    it('rechaza DNI vacío o no proporcionado', () => {
      const res = validateDni('');
      expect(res.valid).toBe(false);
      expect(res.error).toContain('obligatorio');
    });

    it('acepta DNI vacío si está marcado como opcional', () => {
      const res = validateDni('', { isOptional: true });
      expect(res.valid).toBe(true);
    });

    it('rechaza DNI con menos o más de 8 dígitos', () => {
      expect(validateDni('1234567').valid).toBe(false);
      expect(validateDni('123456789').valid).toBe(false);
    });

    it('rechaza DNI con caracteres alfabéticos o símbolos', () => {
      expect(validateDni('7485A612').valid).toBe(false);
      expect(validateDni('7485-612').valid).toBe(false);
    });

    it('rechaza DNI ficticio con dígitos repetidos (e.g. 00000000 o 99999999)', () => {
      const res0 = validateDni('00000000');
      expect(res0.valid).toBe(false);
      expect(res0.error).toContain('secuencia repetitiva');

      const res1 = validateDni('11111111');
      expect(res1.valid).toBe(false);
    });

    it('detecta y rechaza DNI duplicado cuando ya existe en el sistema', () => {
      const existing = ['74859612', '45896321'];
      const res = validateDni('74859612', { existingDnis: existing });
      expect(res.valid).toBe(false);
      expect(res.error).toContain('Ya existe');
    });

    it('permite el mismo DNI si pertenece al usuario en edición', () => {
      const existing = ['74859612', '45896321'];
      const res = validateDni('74859612', {
        existingDnis: existing,
        currentUserId: '74859612',
      });
      expect(res.valid).toBe(true);
    });
  });

  // ── 2. Validación de Teléfono Peruano (9 dígitos iniciando con 9) ──
  describe('Validación de Teléfono Celular Peruano', () => {
    it('acepta número celular peruano válido de 9 dígitos comenzando con 9', () => {
      const res = validatePeruPhone('987654321');
      expect(res.valid).toBe(true);
      expect(res.error).toBeUndefined();
    });

    it('rechaza teléfono celular que no empieza con 9', () => {
      const res = validatePeruPhone('887654321');
      expect(res.valid).toBe(false);
      expect(res.error).toContain('debe iniciar con el dígito 9');
    });

    it('rechaza teléfono con longitud incorrecta', () => {
      expect(validatePeruPhone('98765432').valid).toBe(false);
      expect(validatePeruPhone('9876543210').valid).toBe(false);
    });

    it('ignora espacios o guiones si se limpian o valida opcionalidad', () => {
      expect(validatePeruPhone('', { isOptional: true }).valid).toBe(true);
    });
  });

  // ── 3. Cálculo de Edad y Fechas de Nacimiento ──
  describe('Cálculo de Edad y Control de Fechas', () => {
    it('calcula la edad exacta en años, meses y días respecto a la fecha actual', () => {
      const fixedRef = new Date('2026-10-20T12:00:00Z');
      const age = calculateAge('2016-05-15', fixedRef);
      expect(age.years).toBe(10);
      expect(age.isFuture).toBe(false);
      expect(age.formatted).toContain('10 años');
    });

    it('detecta fechas futuras e impide registros', () => {
      const fixedRef = new Date('2026-10-20T12:00:00Z');
      const age = calculateAge('2027-01-01', fixedRef);
      expect(age.isFuture).toBe(true);

      const valStudent = validateStudentBirthDate('2027-01-01', 'primaria', undefined, fixedRef);
      expect(valStudent.valid).toBe(false);
      expect(valStudent.error).toContain('no puede ser una fecha futura');
    });
  });

  // ── 4. Reglas de Edad por Nivel Educativo (Alumnos) ──
  describe('Reglas de Edad según Nivel Educativo', () => {
    const fixedRef = new Date('2026-03-01T12:00:00Z'); // Inicio escolar 2026

    it('acepta estudiante de 4 años para Inicial (rango 3-5)', () => {
      // Nacido en 2022 -> 4 años
      const res = validateStudentBirthDate('2022-01-15', 'inicial', undefined, fixedRef);
      expect(res.valid).toBe(true);
    });

    it('rechaza estudiante de 12 años intentando matricularse en Inicial', () => {
      // Nacido en 2014 -> 12 años
      const res = validateStudentBirthDate('2014-01-15', 'inicial', undefined, fixedRef);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('no corresponde al nivel Inicial');
    });

    it('acepta estudiante de 10 años para Primaria (rango 6-12)', () => {
      const res = validateStudentBirthDate('2016-01-15', 'primaria', undefined, fixedRef);
      expect(res.valid).toBe(true);
    });

    it('rechaza estudiante de 4 años en Secundaria', () => {
      const res = validateStudentBirthDate('2022-01-15', 'secundaria', undefined, fixedRef);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('no corresponde al nivel Secundaria');
    });

    it('permite rangos de edad configurables por programa académico', () => {
      const customRanges = {
        ...DEFAULT_ACADEMIC_AGE_RANGES,
        secundaria: { min: 14, max: 25, strictMax: 30, description: 'EBA / Nocturna' },
      };
      // Alumno de 22 años en secundaria regular falla, pero con configuración personalizada es válido
      const regularRes = validateStudentBirthDate('2004-01-15', 'secundaria', undefined, fixedRef);
      expect(regularRes.valid).toBe(false);

      const customRes = validateStudentBirthDate('2004-01-15', 'secundaria', customRanges, fixedRef);
      expect(customRes.valid).toBe(true);
    });
  });

  // ── 5. Regla de Edad Mínima en Docentes (>= 18 años) ──
  describe('Regla de Edad Mínima en Docentes', () => {
    const fixedRef = new Date('2026-10-20T12:00:00Z');

    it('acepta profesor mayor de 18 años', () => {
      // Nacido en 1990 -> 36 años
      const res = validateTeacherBirthDate('1990-03-25', 18, fixedRef);
      expect(res.valid).toBe(true);
    });

    it('rechaza profesor menor de 18 años', () => {
      // Nacido en 2012 -> 14 años
      const res = validateTeacherBirthDate('2012-05-10', 18, fixedRef);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('debe tener al menos 18 años');
    });
  });

  // ── 6. Validación Integral de Esquemas (Payloads) ──
  describe('Validación Integral de Esquemas (Payloads)', () => {
    it('valida payload completo de estudiante con datos correctos', () => {
      const payload = {
        nombres: 'Mateo Alejandro',
        apellidos: 'Salazar Quispe',
        dni: '78965412',
        fecha_nacimiento: '2016-04-10',
        nombre_apoderado: 'Elena Quispe',
        telefono_apoderado: '988554433',
        level: 'primaria' as const,
      };

      const result = validateStudentPayload(payload);
      expect(result.valid).toBe(true);
      expect(Object.keys(result.errors).length).toBe(0);
    });

    it('detecta múltiples errores en payload de estudiante', () => {
      const payload = {
        nombres: '',
        apellidos: '',
        dni: '123', // inválido
        fecha_nacimiento: '2028-01-01', // futuro
        telefono_apoderado: '12345', // inválido
        level: 'primaria' as const,
      };

      const result = validateStudentPayload(payload);
      expect(result.valid).toBe(false);
      expect(result.errors.nombres).toBeDefined();
      expect(result.errors.apellidos).toBeDefined();
      expect(result.errors.dni).toBeDefined();
      expect(result.errors.fecha_nacimiento).toBeDefined();
      expect(result.errors.telefono_apoderado).toBeDefined();
    });

    it('valida payload completo de docente', () => {
      const payload = {
        nombres: 'María Elena',
        apellidos: 'Paredes Campos',
        dni: '41258963',
        fecha_nacimiento: '1988-07-20',
        telefono: '998877665',
        especialidad: 'Matemática',
      };

      const result = validateTeacherPayload(payload);
      expect(result.valid).toBe(true);
    });

    it('rechaza payload de docente menor de edad o con teléfono inválido', () => {
      const payload = {
        nombres: 'Junior',
        apellidos: 'Pérez',
        dni: '78945612',
        fecha_nacimiento: '2015-05-10', // 11 años
        telefono: '888111222', // no empieza con 9
      };

      const result = validateTeacherPayload(payload);
      expect(result.valid).toBe(false);
      expect(result.errors.fecha_nacimiento).toContain('18 años');
      expect(result.errors.telefono).toBeDefined();
    });
  });

  // ── 7. Validación en Rutas API Backend (HTTP 422 y Error Maps) ──
  describe('Validación en Endpoints de API Backend', () => {
    it('POST /api/estudiantes rechaza solicitud con DNI o teléfono inválido con status 422', async () => {
      const fakeReq = new NextRequest('http://localhost:3000/api/estudiantes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          createData: {
            nombres: 'Prueba',
            apellidos: 'Api',
            dni: '00000000', // DNI ficticio repetitivo
            fechaNacimiento: '2016-05-15',
            seccionId: 'sec-1pri-a',
            nombreApoderado: 'Apoderado',
            telefonoApoderado: '123456789', // Teléfono no peruano
          },
        }),
      });

      const res = await studentApiPost(fakeReq);
      expect(res.status).toBe(422);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.errors).toBeDefined();
      expect(json.errors.dni).toBeDefined();
      expect(json.errors.telefono_apoderado || json.errors.telefonoApoderado).toBeDefined();
    });

    it('POST /api/docentes rechaza docente menor de 18 años con status 422', async () => {
      const fakeReq = new NextRequest('http://localhost:3000/api/docentes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombres: 'Profesor Joven',
          apellidos: 'Menor',
          dni: '48963258',
          fecha_nacimiento: '2015-01-01', // Menor de edad
          telefono: '999888777',
        }),
      });

      const res = await teacherApiPost(fakeReq);
      expect(res.status).toBe(422);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.errors.fecha_nacimiento).toContain('18 años');
    });

    it('POST /api/matriculas valida vacantes y edad del estudiante antes de matricular', async () => {
      const fakeReq = new NextRequest('http://localhost:3000/api/matriculas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombres: 'Alumno Incompatible',
          apellidos: 'Prueba',
          dni: '78451296',
          fechaNacimiento: '2010-01-01', // 16 años (secundaria)
          nivel: 'inicial', // Intentando inicial con 16 años
          seccionId: 'sec-ini-3a',
          telefonoApoderado: '987123456',
        }),
      });

      const res = await enrollmentApiPost(fakeReq);
      expect(res.status).toBe(422);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.errors.fecha_nacimiento).toContain('no corresponde al nivel Inicial');
    });
  });
});
