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
    const studentsMap = new Map((students || []).map(s => [s.id, s]));
    const activeEnrollmentsMap = new Map<string, (typeof enrollments)[number]>();
    const anyEnrollmentsMap = new Map<string, (typeof enrollments)[number]>();
    (enrollments || []).forEach(e => {
      if (!anyEnrollmentsMap.has(e.estudiante_id)) anyEnrollmentsMap.set(e.estudiante_id, e);
      if (e.estado === 'activo') activeEnrollmentsMap.set(e.estudiante_id, e);
    });
    const sectionsMap = new Map((sections || []).map(s => [s.id, s]));
    const teachersMap = new Map((teachers || []).map(t => [t.id, t]));

    return base.map(c => {
      const student = studentsMap.get(c.studentId);
      const enrollment = activeEnrollmentsMap.get(c.studentId) || anyEnrollmentsMap.get(c.studentId);
      const section = (enrollment?.seccion_id ? sectionsMap.get(enrollment.seccion_id) : undefined) || enrollment?.seccion;
      const tutor = section?.tutor_id ? teachersMap.get(section.tutor_id) || null : null;
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
