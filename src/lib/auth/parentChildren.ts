import { Student, UserProfile } from '@/types';

/**
 * ¿Este alumno es hijo de este apoderado?
 * Usa el vínculo explícito (apoderado_id) cuando existe. Para alumnos guardados antes de que existiera,
 * compara el correo o el teléfono del apoderado registrados en la matrícula. Nunca compara nombres:
 * dos apoderados pueden llamarse igual.
 */
export function isChildOfParent(student: Student, parent: Pick<UserProfile, 'id' | 'email' | 'telefono'>): boolean {
  if (student.apoderado_id) return student.apoderado_id === parent.id;

  const email = parent.email?.toLowerCase().trim();
  const phone = parent.telefono?.trim();
  return (
    (!!email && student.email_apoderado?.toLowerCase().trim() === email) ||
    (!!phone && student.telefono_apoderado?.trim() === phone)
  );
}

export function getChildrenOfParent(students: Student[], parent: Pick<UserProfile, 'id' | 'email' | 'telefono'>): Student[] {
  return students.filter(s => isChildOfParent(s, parent));
}
