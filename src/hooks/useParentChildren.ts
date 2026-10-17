'use client';

import { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { getChildrenOfParent } from '@/lib/auth/parentChildren';

// Hijos del apoderado con su matrícula, aula y tutor reales (compartido por las páginas del apoderado)
export function useParentChildren() {
  const { childrenList, selectedChildId, setSelectedChildId, students, enrollments, sections, teachers, currentUser } = useApp();

  const children = useMemo(() => {
    let base = (childrenList || []).map(c => ({ id: c.id, studentId: c.estudiante_id }));
    if (currentUser?.rol === 'apoderado') {
      // childrenList es global: un apoderado solo debe ver a sus propios hijos
      const ownIds = new Set(getChildrenOfParent(students, currentUser).map(s => s.id));
      base = base.filter(c => ownIds.has(c.studentId));
      ownIds.forEach(id => {
        if (!base.some(c => c.studentId === id)) base.push({ id, studentId: id });
      });
    }
    return base.map(c => {
      const student = students.find(s => s.id === c.studentId);
      const enrollment = enrollments.find(e => e.estudiante_id === c.studentId && e.estado === 'activo') || enrollments.find(e => e.estudiante_id === c.studentId);
      const section = sections.find(s => s.id === enrollment?.seccion_id) || enrollment?.seccion;
      const tutor = teachers.find(t => t.id === section?.tutor_id) || null;
      return {
        id: c.id,
        student,
        enrollment,
        section,
        tutor,
        nombre: student?.profile?.nombres || student?.nombres || 'Alumno',
        apellidos: student?.profile?.apellidos || student?.apellidos || '',
        aula: section ? `${section.grado?.nombre || 'Grado'} "${section.letra}"` : 'Sin aula asignada',
        avatar: student?.profile?.avatar_url,
      };
    });
  }, [childrenList, students, enrollments, sections, teachers, currentUser]);

  const child = children.find(c => c.id === selectedChildId) || children[0] || null;
  return { children, child, selectChild: setSelectedChildId };
}

export type ParentChild = ReturnType<typeof useParentChildren>['children'][number];
