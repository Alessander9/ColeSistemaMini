import { EducationalLevel } from '@/types';
import { DEFAULT_ACADEMIC_AGE_RANGES, TEACHER_AGE_RULES, LevelAgeRule } from './academicAgeConfig';

export interface ValidationResult {
  isValid: boolean;
  valid: boolean;
  message?: string;
  error?: string;
  code?: string;
}

export interface AgeCalculationResult {
  years: number;
  months: number;
  days: number;
  totalMonths: number;
  isFuture: boolean;
  isValidDate: boolean;
  formattedText: string;
  formatted: string;
}

function makeResult(
  isValid: boolean,
  message?: string,
  code?: string,
  extra?: Record<string, any>
): ValidationResult & Record<string, any> {
  return {
    isValid,
    valid: isValid,
    message,
    error: message,
    code,
    ...extra,
  };
}

/**
 * Calcula la edad exacta en años, meses y días a partir de una fecha de nacimiento.
 */
export function calculateAge(
  birthDateInput?: string | Date | null,
  referenceDate: Date = new Date()
): AgeCalculationResult {
  if (!birthDateInput) {
    return {
      years: 0,
      months: 0,
      days: 0,
      totalMonths: 0,
      isFuture: false,
      isValidDate: false,
      formattedText: 'Fecha no especificada',
      formatted: 'Fecha no especificada',
    };
  }

  let birthDate: Date;
  if (typeof birthDateInput === 'string') {
    const parts = birthDateInput.split('T')[0].split('-').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) {
      return {
        years: 0,
        months: 0,
        days: 0,
        totalMonths: 0,
        isFuture: false,
        isValidDate: false,
        formattedText: 'Fecha inválida',
        formatted: 'Fecha inválida',
      };
    }
    birthDate = new Date(parts[0], parts[1] - 1, parts[2]);
  } else {
    birthDate = birthDateInput;
  }

  if (isNaN(birthDate.getTime())) {
    return {
      years: 0,
      months: 0,
      days: 0,
      totalMonths: 0,
      isFuture: false,
      isValidDate: false,
      formattedText: 'Fecha inválida',
      formatted: 'Fecha inválida',
    };
  }

  const today = new Date(referenceDate);

  if (birthDate.getTime() > today.getTime()) {
    return {
      years: 0,
      months: 0,
      days: 0,
      totalMonths: 0,
      isFuture: true,
      isValidDate: true,
      formattedText: 'Fecha futura',
      formatted: 'Fecha futura',
    };
  }

  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  let days = today.getDate() - birthDate.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonthLastDay = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
    days += prevMonthLastDay;
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const totalMonths = years * 12 + months;

  let formattedText = '';
  if (years === 0 && months === 0) {
    formattedText = `${days} día${days === 1 ? '' : 's'}`;
  } else if (years === 0) {
    formattedText = `${months} mes${months === 1 ? '' : 'es'}`;
  } else if (months === 0) {
    formattedText = `${years} año${years === 1 ? '' : 's'}`;
  } else {
    formattedText = `${years} año${years === 1 ? '' : 's'}, ${months} mes${months === 1 ? '' : 'es'}`;
  }

  return {
    years,
    months,
    days,
    totalMonths,
    isFuture: false,
    isValidDate: true,
    formattedText,
    formatted: formattedText,
  };
}

/**
 * Valida un DNI peruano: exactamente 8 dígitos numéricos, sin secuencias repetitivas inválidas y con control de duplicados.
 */
export function validateDni(
  dni?: string | null,
  options?: {
    required?: boolean;
    isOptional?: boolean;
    existingDnis?: (string | undefined)[];
    currentId?: string;
    currentUserId?: string;
    entityName?: string;
  }
): ValidationResult {
  const isRequired = options?.isOptional === true ? false : options?.required !== false;
  const cleanDni = (dni || '').trim();

  if (!cleanDni) {
    if (isRequired) {
      return makeResult(false, 'El DNI es obligatorio.', 'REQUIRED');
    }
    return makeResult(true);
  }

  if (!/^\d+$/.test(cleanDni)) {
    return makeResult(false, 'El DNI solo debe contener números.', 'NUMERIC_ONLY');
  }

  if (cleanDni.length !== 8) {
    return makeResult(
      false,
      `El DNI debe tener exactamente 8 dígitos (actual: ${cleanDni.length}).`,
      'LENGTH_MISMATCH'
    );
  }

  // Descartar secuencias repetitivas inválidas como 00000000 o 99999999
  if (/^(\d)\1{7}$/.test(cleanDni)) {
    return makeResult(false, 'El número de DNI ingresado no es válido (secuencia repetitiva).', 'INVALID_SEQUENCE');
  }

  // Control de DNI duplicado
  if (options?.existingDnis && options.existingDnis.length > 0) {
    const currentExcludeId = options.currentUserId || options.currentId;
    const isDuplicate = options.existingDnis.some(existing => {
      if (!existing) return false;
      if (currentExcludeId && existing === currentExcludeId) return false;
      return existing.trim() === cleanDni;
    });

    if (isDuplicate) {
      const entity = options.entityName ? ` para este ${options.entityName}` : '';
      return makeResult(false, `Ya existe un registro con el DNI ${cleanDni}${entity}.`, 'DUPLICATE_DNI');
    }
  }

  return makeResult(true);
}

/**
 * Valida un teléfono celular peruano: exactamente 9 dígitos numéricos que inician con el dígito 9.
 */
export function validatePeruPhone(
  phone?: string | null,
  options?: {
    required?: boolean;
    isOptional?: boolean;
    fieldName?: string;
  }
): ValidationResult {
  const isRequired = options?.isOptional === true ? false : options?.required !== false;
  const rawPhone = (phone || '').trim();
  const cleanPhone = rawPhone.replace(/[\s-]/g, '');
  const fieldLabel = options?.fieldName || 'El teléfono celular';

  if (!cleanPhone) {
    if (isRequired) {
      return makeResult(false, `${fieldLabel} es obligatorio.`, 'REQUIRED');
    }
    return makeResult(true);
  }

  if (!/^\d+$/.test(cleanPhone)) {
    return makeResult(false, `${fieldLabel} solo debe contener dígitos numéricos.`, 'NUMERIC_ONLY');
  }

  if (cleanPhone.length !== 9) {
    return makeResult(
      false,
      `${fieldLabel} debe tener exactamente 9 dígitos (actual: ${cleanPhone.length}).`,
      'LENGTH_MISMATCH'
    );
  }

  if (!cleanPhone.startsWith('9')) {
    return makeResult(
      false,
      `${fieldLabel} debe ser un número celular peruano válido (debe iniciar con el dígito 9).`,
      'INVALID_PREFIX'
    );
  }

  return makeResult(true);
}

/**
 * Valida la fecha de nacimiento de un estudiante y su compatibilidad con el nivel educativo.
 */
export function validateStudentBirthDate(
  birthDate?: string | null,
  level?: EducationalLevel | 'inicial' | 'primaria' | 'secundaria' | null,
  customRanges?: Record<string, any>,
  referenceDate?: Date
): ValidationResult & { age?: number; formattedAge?: string } {
  if (!birthDate) {
    return makeResult(false, 'La fecha de nacimiento del alumno es obligatoria.', 'REQUIRED');
  }

  const ageData = calculateAge(birthDate, referenceDate);

  if (!ageData.isValidDate) {
    return makeResult(false, 'La fecha de nacimiento ingresada no es válida.', 'INVALID_DATE');
  }

  if (ageData.isFuture) {
    return makeResult(false, 'La fecha de nacimiento no puede ser una fecha futura.', 'FUTURE_DATE');
  }

  // Rango general humano razonable para educación básica (3 a 22 años)
  if (ageData.years < 2) {
    return makeResult(
      false,
      `El estudiante debe tener al menos 3 años (edad actual: ${ageData.formattedText}).`,
      'TOO_YOUNG',
      { age: ageData.years, formattedAge: ageData.formattedText }
    );
  }

  if (ageData.years > 22 && !customRanges) {
    return makeResult(
      false,
      `La edad (${ageData.years} años) excede el límite ordinario para educación escolar básica.`,
      'TOO_OLD',
      { age: ageData.years, formattedAge: ageData.formattedText }
    );
  }

  // Validación de compatibilidad con el nivel académico
  const ranges = customRanges || DEFAULT_ACADEMIC_AGE_RANGES;
  if (level && ranges[level]) {
    const rule = ranges[level];
    const minAllowed = rule.minAge ?? rule.min ?? 3;
    const maxAllowed = rule.strictMax ?? (rule.maxAge ? (level === 'inicial' ? rule.maxAge + 1 : level === 'primaria' ? rule.maxAge + 2 : rule.maxAge + 1) : (rule.max ?? 18));
    const levelLabel = rule.label || (level === 'inicial' ? 'Inicial' : level === 'primaria' ? 'Primaria' : 'Secundaria');

    if (ageData.years < minAllowed || ageData.years > maxAllowed) {
      return makeResult(
        false,
        `La edad de ${ageData.formattedText} no corresponde al nivel ${levelLabel} (rango permitido: ${minAllowed} a ${rule.maxAge ?? rule.max} años).`,
        'LEVEL_AGE_MISMATCH',
        { age: ageData.years, formattedAge: ageData.formattedText }
      );
    }
  }

  return makeResult(true, undefined, undefined, {
    age: ageData.years,
    formattedAge: ageData.formattedText,
  });
}

/**
 * Valida la fecha de nacimiento de un docente exigiendo mayoría de edad (mínimo 18 años).
 */
export function validateTeacherBirthDate(
  birthDate?: string | null,
  minAge: number = TEACHER_AGE_RULES.minAge,
  referenceDate?: Date
): ValidationResult & { age?: number; formattedAge?: string } {
  if (!birthDate) {
    return makeResult(false, 'La fecha de nacimiento del docente es obligatoria.', 'REQUIRED');
  }

  const ageData = calculateAge(birthDate, referenceDate);

  if (!ageData.isValidDate) {
    return makeResult(false, 'La fecha de nacimiento ingresada no es válida.', 'INVALID_DATE');
  }

  if (ageData.isFuture) {
    return makeResult(false, 'La fecha de nacimiento no puede ser una fecha futura.', 'FUTURE_DATE');
  }

  if (ageData.years < minAge) {
    return makeResult(
      false,
      `El docente debe tener al menos ${minAge} años (mayor de edad). Edad calculada: ${ageData.formattedText}.`,
      'UNDERAGE_TEACHER',
      { age: ageData.years, formattedAge: ageData.formattedText }
    );
  }

  if (ageData.years > TEACHER_AGE_RULES.maxAge) {
    return makeResult(
      false,
      `La fecha indicada corresponde a una edad no plausible (${ageData.years} años).`,
      'OVERAGE_TEACHER',
      { age: ageData.years, formattedAge: ageData.formattedText }
    );
  }

  return makeResult(true, undefined, undefined, {
    age: ageData.years,
    formattedAge: ageData.formattedText,
  });
}

/**
 * Validador para payload completo de Estudiante (Frontend y Backend).
 */
export function validateStudentPayload(
  data: {
    nombres?: string;
    apellidos?: string;
    dni?: string;
    fechaNacimiento?: string;
    fecha_nacimiento?: string;
    nivel?: EducationalLevel | 'inicial' | 'primaria' | 'secundaria';
    level?: EducationalLevel | 'inicial' | 'primaria' | 'secundaria';
    telefonoApoderado?: string;
    telefono_apoderado?: string;
    dniApoderado?: string;
    dni_apoderado?: string;
    nombreApoderado?: string;
    nombre_apoderado?: string;
    emailApoderado?: string;
    email_apoderado?: string;
    seccionId?: string;
    seccion_id?: string;
    customAgeRanges?: Record<string, any>;
  },
  context?: { existingDnis?: (string | undefined)[]; currentId?: string; currentStudentId?: string }
): { isValid: boolean; valid: boolean; errors: Record<string, string>; message?: string } {
  const errors: Record<string, string> = {};

  if (!data.nombres || !data.nombres.trim()) {
    errors.nombres = 'Los nombres son obligatorios.';
  } else if (data.nombres.trim().length < 2) {
    errors.nombres = 'Los nombres deben tener al menos 2 caracteres.';
  }

  if (!data.apellidos || !data.apellidos.trim()) {
    errors.apellidos = 'Los apellidos son obligatorios.';
  } else if (data.apellidos.trim().length < 2) {
    errors.apellidos = 'Los apellidos deben tener al menos 2 caracteres.';
  }

  // DNI Alumno
  const dniRes = validateDni(data.dni, {
    required: true,
    existingDnis: context?.existingDnis,
    currentId: context?.currentStudentId || context?.currentId,
    entityName: 'estudiante',
  });
  if (!dniRes.isValid && dniRes.message) {
    errors.dni = dniRes.message;
  }

  // Fecha Nacimiento y Nivel
  const birthDate = data.fecha_nacimiento || data.fechaNacimiento;
  const level = data.level || data.nivel;
  const birthRes = validateStudentBirthDate(birthDate, level, data.customAgeRanges);
  if (!birthRes.isValid && birthRes.message) {
    errors.fecha_nacimiento = birthRes.message;
    errors.fechaNacimiento = birthRes.message;
  }

  // Apoderado
  const nombreApo = data.nombre_apoderado ?? data.nombreApoderado;
  if (nombreApo !== undefined) {
    if (!nombreApo.trim()) {
      errors.nombre_apoderado = 'El nombre del apoderado es obligatorio.';
      errors.nombreApoderado = 'El nombre del apoderado es obligatorio.';
    }
  }

  const telApo = data.telefono_apoderado ?? data.telefonoApoderado;
  if (telApo !== undefined) {
    const phoneRes = validatePeruPhone(telApo, {
      required: true,
      fieldName: 'El teléfono del apoderado',
    });
    if (!phoneRes.isValid && phoneRes.message) {
      errors.telefono_apoderado = phoneRes.message;
      errors.telefonoApoderado = phoneRes.message;
    }
  }

  const dniApo = data.dni_apoderado ?? data.dniApoderado;
  if (dniApo) {
    const dniApoRes = validateDni(dniApo, {
      required: false,
      entityName: 'apoderado',
    });
    if (!dniApoRes.isValid && dniApoRes.message) {
      errors.dni_apoderado = dniApoRes.message;
      errors.dniApoderado = dniApoRes.message;
    }
  }

  const emailApo = data.email_apoderado ?? data.emailApoderado;
  if (emailApo && emailApo.trim()) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailApo.trim())) {
      errors.email_apoderado = 'El correo electrónico no tiene un formato válido.';
      errors.emailApoderado = 'El correo electrónico no tiene un formato válido.';
    }
  }

  const isValid = Object.keys(errors).length === 0;
  return {
    isValid,
    valid: isValid,
    errors,
    message: Object.values(errors)[0],
  };
}

/**
 * Validador para payload completo de Docente (Frontend y Backend).
 */
export function validateTeacherPayload(
  data: {
    nombres?: string;
    apellidos?: string;
    dni?: string;
    fecha_nacimiento?: string;
    fechaNacimiento?: string;
    telefono?: string;
    email?: string;
    especialidad?: string;
  },
  context?: { existingDnis?: (string | undefined)[]; currentId?: string; currentTeacherId?: string }
): { isValid: boolean; valid: boolean; errors: Record<string, string>; message?: string } {
  const errors: Record<string, string> = {};

  if (!data.nombres || !data.nombres.trim()) {
    errors.nombres = 'Los nombres del docente son obligatorios.';
  } else if (data.nombres.trim().length < 2) {
    errors.nombres = 'Los nombres deben tener al menos 2 caracteres.';
  }

  if (!data.apellidos || !data.apellidos.trim()) {
    errors.apellidos = 'Los apellidos del docente son obligatorios.';
  } else if (data.apellidos.trim().length < 2) {
    errors.apellidos = 'Los apellidos deben tener al menos 2 caracteres.';
  }

  // DNI Docente
  const dniRes = validateDni(data.dni, {
    required: true,
    existingDnis: context?.existingDnis,
    currentId: context?.currentTeacherId || context?.currentId,
    entityName: 'docente',
  });
  if (!dniRes.isValid && dniRes.message) {
    errors.dni = dniRes.message;
  }

  // Fecha Nacimiento Docente (mínimo 18 años)
  const birthDate = data.fecha_nacimiento || data.fechaNacimiento;
  if (birthDate) {
    const ageRes = validateTeacherBirthDate(birthDate);
    if (!ageRes.isValid && ageRes.message) {
      errors.fecha_nacimiento = ageRes.message;
      errors.fechaNacimiento = ageRes.message;
    }
  } else {
    errors.fecha_nacimiento = 'La fecha de nacimiento del docente es obligatoria.';
    errors.fechaNacimiento = 'La fecha de nacimiento del docente es obligatoria.';
  }

  // Teléfono Docente
  if (data.telefono) {
    const phoneRes = validatePeruPhone(data.telefono, {
      required: false,
      fieldName: 'El teléfono del docente',
    });
    if (!phoneRes.isValid && phoneRes.message) {
      errors.telefono = phoneRes.message;
    }
  }

  // Email
  if (data.email && data.email.trim()) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
      errors.email = 'El correo electrónico no tiene un formato válido.';
    }
  }

  const isValid = Object.keys(errors).length === 0;
  return {
    isValid,
    valid: isValid,
    errors,
    message: Object.values(errors)[0],
  };
}
