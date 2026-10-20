import { EducationalLevel } from '@/types';

export interface LevelAgeRule {
  minAge: number;
  maxAge: number;
  label: string;
  description: string;
}

/**
 * Configuración de rangos de edad permitidos según el programa académico (CNEB / MINEDU Perú).
 * Es configurable y adaptable si la institución define políticas de rezago escolar o aceleración.
 */
export const DEFAULT_ACADEMIC_AGE_RANGES: Record<EducationalLevel, LevelAgeRule> = {
  inicial: {
    minAge: 3,
    maxAge: 5,
    label: 'Inicial (3 a 5 años)',
    description: 'Edad cronológica recomendada de 3 a 5 años (permite hasta 6 años cumplidos).',
  },
  primaria: {
    minAge: 6,
    maxAge: 12,
    label: 'Primaria (6 a 12 años)',
    description: 'Edad cronológica recomendada de 6 a 12 años (permite hasta 14 años por rezago o traslado).',
  },
  secundaria: {
    minAge: 11,
    maxAge: 18,
    label: 'Secundaria (11 a 18 años)',
    description: 'Edad cronológica recomendada de 11 a 18 años (permite hasta 19 años para culminación de EBR).',
  },
};

/**
 * Reglas para edad de docentes y personal.
 */
export const TEACHER_AGE_RULES = {
  minAge: 18,
  maxAge: 85,
  label: 'Mayor de edad (mínimo 18 años)',
};
