'use client';

import { useCallback, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Section } from '@/types';

/**
 * Color fijo por aula para todo el portal docente:
 * la misma aula se ve siempre del mismo color (panel, horario, asistencia, notas, tareas, evaluaciones, tutoría y menú).
 * Las clases están escritas completas para que Tailwind las incluya.
 */
export interface AulaColor {
  /** Botón elegido: fondo sólido + borde + texto blanco */
  solid: string;
  /** Texto claro sobre el fondo sólido */
  solidSub: string;
  /** Fondo suave (tarjetas, casillas del horario) */
  soft: string;
  /** Texto con el color del aula */
  text: string;
  /** Borde con el color del aula */
  border: string;
  /** Borde al pasar el mouse */
  hover: string;
  /** Punto / barra de color */
  dot: string;
  /** Etiqueta pequeña (chip) */
  chip: string;
  /** Botón principal con el color del aula */
  btn: string;
  /** Ícono o número con el color del aula */
  icon: string;
  /** Borde al escribir en un campo */
  focus: string;
}

export const AULA_PALETTE: AulaColor[] = [
  { solid: 'bg-blue-600 border-blue-600 text-white', solidSub: 'text-blue-100', soft: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-800 dark:text-blue-200', border: 'border-blue-300 dark:border-blue-700', hover: 'hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/40', dot: 'bg-blue-600', chip: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-200', btn: 'bg-blue-600 hover:bg-blue-700 text-white', icon: 'text-blue-600 dark:text-blue-400', focus: 'focus:border-blue-500' },
  { solid: 'bg-emerald-600 border-emerald-600 text-white', solidSub: 'text-emerald-100', soft: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-800 dark:text-emerald-200', border: 'border-emerald-300 dark:border-emerald-700', hover: 'hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/40', dot: 'bg-emerald-600', chip: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200', btn: 'bg-emerald-600 hover:bg-emerald-700 text-white', icon: 'text-emerald-600 dark:text-emerald-400', focus: 'focus:border-emerald-500' },
  { solid: 'bg-orange-500 border-orange-500 text-white', solidSub: 'text-orange-50', soft: 'bg-orange-50 dark:bg-orange-950/40', text: 'text-orange-800 dark:text-orange-200', border: 'border-orange-300 dark:border-orange-700', hover: 'hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/40', dot: 'bg-orange-500', chip: 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-200', btn: 'bg-orange-500 hover:bg-orange-600 text-white', icon: 'text-orange-500 dark:text-orange-400', focus: 'focus:border-orange-500' },
  { solid: 'bg-violet-600 border-violet-600 text-white', solidSub: 'text-violet-100', soft: 'bg-violet-50 dark:bg-violet-950/40', text: 'text-violet-800 dark:text-violet-200', border: 'border-violet-300 dark:border-violet-700', hover: 'hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-950/40', dot: 'bg-violet-600', chip: 'bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-200', btn: 'bg-violet-600 hover:bg-violet-700 text-white', icon: 'text-violet-600 dark:text-violet-400', focus: 'focus:border-violet-500' },
  { solid: 'bg-pink-600 border-pink-600 text-white', solidSub: 'text-pink-100', soft: 'bg-pink-50 dark:bg-pink-950/40', text: 'text-pink-800 dark:text-pink-200', border: 'border-pink-300 dark:border-pink-700', hover: 'hover:border-pink-500 hover:bg-pink-50 dark:hover:bg-pink-950/40', dot: 'bg-pink-600', chip: 'bg-pink-100 text-pink-800 dark:bg-pink-950/60 dark:text-pink-200', btn: 'bg-pink-600 hover:bg-pink-700 text-white', icon: 'text-pink-600 dark:text-pink-400', focus: 'focus:border-pink-500' },
  { solid: 'bg-teal-600 border-teal-600 text-white', solidSub: 'text-teal-100', soft: 'bg-teal-50 dark:bg-teal-950/40', text: 'text-teal-800 dark:text-teal-200', border: 'border-teal-300 dark:border-teal-700', hover: 'hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-950/40', dot: 'bg-teal-600', chip: 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-200', btn: 'bg-teal-600 hover:bg-teal-700 text-white', icon: 'text-teal-600 dark:text-teal-400', focus: 'focus:border-teal-500' },
  { solid: 'bg-cyan-600 border-cyan-600 text-white', solidSub: 'text-cyan-100', soft: 'bg-cyan-50 dark:bg-cyan-950/40', text: 'text-cyan-800 dark:text-cyan-200', border: 'border-cyan-300 dark:border-cyan-700', hover: 'hover:border-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-950/40', dot: 'bg-cyan-600', chip: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-200', btn: 'bg-cyan-600 hover:bg-cyan-700 text-white', icon: 'text-cyan-600 dark:text-cyan-400', focus: 'focus:border-cyan-500' },
  { solid: 'bg-lime-600 border-lime-600 text-white', solidSub: 'text-lime-50', soft: 'bg-lime-50 dark:bg-lime-950/40', text: 'text-lime-800 dark:text-lime-200', border: 'border-lime-300 dark:border-lime-700', hover: 'hover:border-lime-500 hover:bg-lime-50 dark:hover:bg-lime-950/40', dot: 'bg-lime-600', chip: 'bg-lime-100 text-lime-800 dark:bg-lime-950/60 dark:text-lime-200', btn: 'bg-lime-600 hover:bg-lime-700 text-white', icon: 'text-lime-600 dark:text-lime-400', focus: 'focus:border-lime-500' },
];

const LEVEL_ORDER: Record<string, number> = { inicial: 0, primaria: 1, secundaria: 2 };

/** Orden estable de aulas: nivel → grado → letra */
export function sortSections(list: Section[]) {
  return [...list].sort((a, b) =>
    (LEVEL_ORDER[a.grado?.nivel || ''] ?? 9) - (LEVEL_ORDER[b.grado?.nivel || ''] ?? 9) ||
    (a.grado?.numero_grado ?? 0) - (b.grado?.numero_grado ?? 0) ||
    a.letra.localeCompare(b.letra)
  );
}

// Para aulas fuera de la lista del docente: color estable según su id
const hashIndex = (id: string) => Array.from(id).reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0, 7) % AULA_PALETTE.length;

/** Devuelve `aulaColor(seccionId)` con el color fijo de cada aula del docente actual. */
export function useAulaColors() {
  const { currentUser, sections, getTeacherSections } = useApp();

  const orderedIds = useMemo(() => {
    const teaching = currentUser?.id ? (getTeacherSections(currentUser.id) || []).map(ts => ts.seccion) : [];
    const tutored = sections.filter(s => s.tutor_id && s.tutor_id === currentUser?.id);
    const mine = [...teaching, ...tutored.filter(t => !teaching.some(s => s.id === t.id))];
    // Sin aulas propias (p. ej. el admin) se usa el orden de todas las aulas
    return sortSections(mine.length > 0 ? mine : sections).map(s => s.id);
  }, [currentUser?.id, sections, getTeacherSections]);

  return useCallback(
    (sectionId?: string): AulaColor => {
      const idx = sectionId ? orderedIds.indexOf(sectionId) : -1;
      return AULA_PALETTE[idx >= 0 ? idx % AULA_PALETTE.length : hashIndex(sectionId || '')];
    },
    [orderedIds]
  );
}
