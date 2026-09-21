/**
 * Banco de Conclusiones Descriptivas Sugeridas CNEB (RVM 094-2020-MINEDU)
 * Genera retroalimentación formativa cualitativa para niveles Inicial, Primaria y Secundaria.
 */

import { GradeLetter } from '@/types';

export interface ConclusionTemplate {
  escala: GradeLetter;
  texto: string; // Puede contener {estudiante} y {competencia}
}

export const CNEB_CONCLUSIONS_TEMPLATES: Record<string, ConclusionTemplate[]> = {
  general: [
    {
      escala: 'AD',
      texto: 'Demuestra un desempeño sobresaliente en la competencia, evidenciando autonomía, razonamiento crítico y capacidad para aplicar lo aprendido en situaciones complejas.'
    },
    {
      escala: 'A',
      texto: 'Ha alcanzado el nivel esperado para el grado en esta competencia, cumpliendo satisfactoriamente con los criterios de evaluación.'
    },
    {
      escala: 'B',
      texto: 'Se encuentra en proceso hacia el nivel esperado. Requiere acompañamiento pedagógico focalizado y mayor práctica para consolidar sus aprendizajes.'
    },
    {
      escala: 'C',
      texto: 'Muestra dificultades iniciales en el desarrollo de la competencia. Necesita refuerzo académico estructurado, apoyo guiado y seguimiento continuo.'
    }
  ],
  matematica: [
    {
      escala: 'AD',
      texto: 'Aplica diversas estrategias heurísticas y de cálculo mental con notable precisión, justificando sus procedimientos matemáticos con solvencia.'
    },
    {
      escala: 'A',
      texto: 'Resuelve problemas del entorno utilizando algoritmos y representaciones gráficas de manera adecuada y coherente.'
    },
    {
      escala: 'B',
      texto: 'Comprende el enunciado de los problemas, pero requiere afianzar las operaciones y la verificación sistemática de sus resultados.'
    },
    {
      escala: 'C',
      texto: 'Presenta dificultad para interpretar datos y seleccionar la operación matemática adecuada. Se recomienda reforzar el razonamiento lógico.'
    }
  ],
  comunicacion: [
    {
      escala: 'AD',
      texto: 'Produce textos coherentes con rica variedad léxica, adecuando su registro al destinatario y argumentando sus ideas con claridad.'
    },
    {
      escala: 'A',
      texto: 'Lee e interpreta diversos tipos de textos, extrayendo información explícita e implícita de forma pertinente.'
    },
    {
      escala: 'B',
      texto: 'Redacta textos básicos, pero requiere mejorar la cohesión, el uso de conectores lógicos y la puntuación formal.'
    },
    {
      escala: 'C',
      texto: 'Muestra dificultad en la decodificación y comprensión inferencial de textos. Se sugiere fomentar la lectura diaria acompañada en el hogar.'
    }
  ],
  ciencia: [
    {
      escala: 'AD',
      texto: 'Formula hipótesis fundamentadas, diseña experimentos sencillos y comunica sus conclusiones científicas con rigor y claridad.'
    },
    {
      escala: 'A',
      texto: 'Explica el mundo físico basándose en conocimientos científicos y reconoce la importancia del cuidado ambiental.'
    },
    {
      escala: 'B',
      texto: 'Identifica conceptos científicos básicos, pero requiere apoyo para relacionar causas y efectos en fenómenos naturales.'
    },
    {
      escala: 'C',
      texto: 'Necesita mayor acompañamiento en la observación sistemática y en la formulación de explicaciones basadas en evidencia.'
    }
  ]
};

/**
 * Obtiene sugerencias de conclusiones descriptivas según curso, competencia y escala obtenida.
 */
export function getSuggestedConclusions(
  courseName: string,
  escala: GradeLetter,
  studentName?: string
): string[] {
  const normalizedCourse = courseName.toLowerCase();
  let categoryKey = 'general';

  if (normalizedCourse.includes('matem')) {
    categoryKey = 'matematica';
  } else if (normalizedCourse.includes('comunic') || normalizedCourse.includes('lengu')) {
    categoryKey = 'comunicacion';
  } else if (normalizedCourse.includes('cienc') || normalizedCourse.includes('ambient') || normalizedCourse.includes('biolog')) {
    categoryKey = 'ciencia';
  }

  const categoryTemplates = CNEB_CONCLUSIONS_TEMPLATES[categoryKey] || [];
  const generalTemplates = CNEB_CONCLUSIONS_TEMPLATES.general || [];

  const matched = [
    ...categoryTemplates.filter(t => t.escala === escala),
    ...generalTemplates.filter(t => t.escala === escala)
  ];

  const uniqueTexts = Array.from(new Set(matched.map(m => m.texto)));

  if (studentName) {
    const firstName = studentName.split(' ')[0] || studentName;
    return uniqueTexts.map(txt => `${firstName}: ${txt}`);
  }

  return uniqueTexts;
}
