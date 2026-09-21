import { Course, Competency, EducationalLevel } from '@/types';

export interface OfficialCnebCourseDefinition {
  id: string;
  nombre: string;
  codigo: string;
  nivel: EducationalLevel;
  color: string;
  color_hex: string;
  area_curricular: string;
  horas_semanales_sugeridas: number;
  descripcion: string;
  competencias: {
    codigo: string;
    descripcion: string;
    orden: number;
  }[];
}

export const OFFICIAL_CNEB_CURRICULUM: OfficialCnebCourseDefinition[] = [
  // ==========================================
  // INICIAL (3, 4 y 5 Años)
  // ==========================================
  {
    id: 'cneb-ini-mat',
    nombre: 'Matemática',
    codigo: 'MAT-INI',
    nivel: 'inicial',
    color: '#4f46e5',
    color_hex: '#4f46e5',
    area_curricular: 'Matemática',
    horas_semanales_sugeridas: 5,
    descripcion: 'Desarrollo del pensamiento lógico-matemático y nociones espaciales/numéricas.',
    competencias: [
      {
        codigo: 'C1',
        descripcion: 'Resuelve problemas de cantidad',
        orden: 1,
      },
      {
        codigo: 'C2',
        descripcion: 'Resuelve problemas de forma, movimiento y localización',
        orden: 2,
      },
    ],
  },
  {
    id: 'cneb-ini-com',
    nombre: 'Comunicación',
    codigo: 'COM-INI',
    nivel: 'inicial',
    color: '#0891b2',
    color_hex: '#0891b2',
    area_curricular: 'Comunicación',
    horas_semanales_sugeridas: 5,
    descripcion: 'Expresión y comprensión oral y aproximación a la lectura y escritura.',
    competencias: [
      {
        codigo: 'C1',
        descripcion: 'Se comunica oralmente en su lengua materna',
        orden: 1,
      },
      {
        codigo: 'C2',
        descripcion: 'Lee diversos tipos de textos en su lengua materna',
        orden: 2,
      },
      {
        codigo: 'C3',
        descripcion: 'Escribe diversos tipos de textos en su lengua materna',
        orden: 3,
      },
      {
        codigo: 'C4',
        descripcion: 'Crea proyectos desde los lenguajes artísticos',
        orden: 4,
      },
    ],
  },
  {
    id: 'cneb-ini-ps',
    nombre: 'Personal Social',
    codigo: 'PS-INI',
    nivel: 'inicial',
    color: '#d97706',
    color_hex: '#d97706',
    area_curricular: 'Personal Social',
    horas_semanales_sugeridas: 5,
    descripcion: 'Construcción de la identidad y convivencia democrática.',
    competencias: [
      {
        codigo: 'C1',
        descripcion: 'Construye su identidad',
        orden: 1,
      },
      {
        codigo: 'C2',
        descripcion: 'Convive y participa democráticamente en la búsqueda del bien común',
        orden: 2,
      },
      {
        codigo: 'C3',
        descripcion: 'Construye su identidad, como persona humana, amada por Dios',
        orden: 3,
      },
    ],
  },
  {
    id: 'cneb-ini-cyt',
    nombre: 'Ciencia y Tecnología',
    codigo: 'CYT-INI',
    nivel: 'inicial',
    color: '#059669',
    color_hex: '#059669',
    area_curricular: 'Ciencia y Tecnología',
    horas_semanales_sugeridas: 4,
    descripcion: 'Exploración del entorno y curiosidad científica.',
    competencias: [
      {
        codigo: 'C1',
        descripcion: 'Indaga mediante métodos científicos para construir sus conocimientos',
        orden: 1,
      },
    ],
  },
  {
    id: 'cneb-ini-psi',
    nombre: 'Psicomotricidad',
    codigo: 'PSI-INI',
    nivel: 'inicial',
    color: '#ea580c',
    color_hex: '#ea580c',
    area_curricular: 'Psicomotriz',
    horas_semanales_sugeridas: 4,
    descripcion: 'Desarrollo de habilidades motoras, esquema corporal y coordinación.',
    competencias: [
      {
        codigo: 'C1',
        descripcion: 'Se desenvuelve de manera autónoma a través de su motricidad',
        orden: 1,
      },
    ],
  },

  // ==========================================
  // PRIMARIA (1° a 6° de Primaria)
  // ==========================================
  {
    id: 'cneb-pri-mat',
    nombre: 'Matemática',
    codigo: 'MAT-PRI',
    nivel: 'primaria',
    color: '#4f46e5',
    color_hex: '#4f46e5',
    area_curricular: 'Matemática',
    horas_semanales_sugeridas: 6,
    descripcion: 'Resolución de problemas de cantidad, regularidad, forma y gestión de datos.',
    competencias: [
      {
        codigo: 'C1',
        descripcion: 'Resuelve problemas de cantidad',
        orden: 1,
      },
      {
        codigo: 'C2',
        descripcion: 'Resuelve problemas de regularidad, equivalencia y cambio',
        orden: 2,
      },
      {
        codigo: 'C3',
        descripcion: 'Resuelve problemas de forma, movimiento y localización',
        orden: 3,
      },
      {
        codigo: 'C4',
        descripcion: 'Resuelve problemas de gestión de datos e incertidumbre',
        orden: 4,
      },
    ],
  },
  {
    id: 'cneb-pri-com',
    nombre: 'Comunicación',
    codigo: 'COM-PRI',
    nivel: 'primaria',
    color: '#0891b2',
    color_hex: '#0891b2',
    area_curricular: 'Comunicación',
    horas_semanales_sugeridas: 6,
    descripcion: 'Comunicación oral, comprensión lectora y producción de textos.',
    competencias: [
      {
        codigo: 'C1',
        descripcion: 'Se comunica oralmente en su lengua materna',
        orden: 1,
      },
      {
        codigo: 'C2',
        descripcion: 'Lee diversos tipos de textos escritos en su lengua materna',
        orden: 2,
      },
      {
        codigo: 'C3',
        descripcion: 'Escribe diversos tipos de textos en su lengua materna',
        orden: 3,
      },
    ],
  },
  {
    id: 'cneb-pri-cyt',
    nombre: 'Ciencia y Tecnología',
    codigo: 'CYT-PRI',
    nivel: 'primaria',
    color: '#059669',
    color_hex: '#059669',
    area_curricular: 'Ciencia y Tecnología',
    horas_semanales_sugeridas: 4,
    descripcion: 'Indagación científica, comprensión del mundo físico y soluciones tecnológicas.',
    competencias: [
      {
        codigo: 'C1',
        descripcion: 'Indaga mediante métodos científicos para construir sus conocimientos',
        orden: 1,
      },
      {
        codigo: 'C2',
        descripcion: 'Explica el mundo físico basándose en conocimientos sobre seres vivos, materia y energía',
        orden: 2,
      },
      {
        codigo: 'C3',
        descripcion: 'Diseña y construye soluciones tecnológicas para resolver problemas de su entorno',
        orden: 3,
      },
    ],
  },
  {
    id: 'cneb-pri-ps',
    nombre: 'Personal Social',
    codigo: 'PS-PRI',
    nivel: 'primaria',
    color: '#d97706',
    color_hex: '#d97706',
    area_curricular: 'Personal Social',
    horas_semanales_sugeridas: 4,
    descripcion: 'Identidad, convivencia ciudadana, historia, geografía y economía.',
    competencias: [
      {
        codigo: 'C1',
        descripcion: 'Construye su identidad',
        orden: 1,
      },
      {
        codigo: 'C2',
        descripcion: 'Convive y participa democráticamente en la búsqueda del bien común',
        orden: 2,
      },
      {
        codigo: 'C3',
        descripcion: 'Construye interpretaciones históricas',
        orden: 3,
      },
      {
        codigo: 'C4',
        descripcion: 'Gestiona responsablemente el espacio y el ambiente',
        orden: 4,
      },
      {
        codigo: 'C5',
        descripcion: 'Gestiona responsablemente los recursos económicos',
        orden: 5,
      },
    ],
  },
  {
    id: 'cneb-pri-ing',
    nombre: 'Inglés',
    codigo: 'ING-PRI',
    nivel: 'primaria',
    color: '#7c3aed',
    color_hex: '#7c3aed',
    area_curricular: 'Inglés',
    horas_semanales_sugeridas: 3,
    descripcion: 'Desarrollo de competencias comunicativas en idioma extranjero.',
    competencias: [
      {
        codigo: 'C1',
        descripcion: 'Se comunica oralmente en inglés como lengua extranjera',
        orden: 1,
      },
      {
        codigo: 'C2',
        descripcion: 'Lee diversos tipos de textos en inglés como lengua extranjera',
        orden: 2,
      },
      {
        codigo: 'C3',
        descripcion: 'Escribe diversos tipos de textos en inglés como lengua extranjera',
        orden: 3,
      },
    ],
  },
  {
    id: 'cneb-pri-art',
    nombre: 'Arte y Cultura',
    codigo: 'ART-PRI',
    nivel: 'primaria',
    color: '#db2777',
    color_hex: '#db2777',
    area_curricular: 'Arte y Cultura',
    horas_semanales_sugeridas: 3,
    descripcion: 'Apreciación crítica y creación de proyectos desde los lenguajes del arte.',
    competencias: [
      {
        codigo: 'C1',
        descripcion: 'Aprecia de manera crítica manifestaciones artístico-culturales',
        orden: 1,
      },
      {
        codigo: 'C2',
        descripcion: 'Crea proyectos desde los lenguajes artísticos',
        orden: 2,
      },
    ],
  },
  {
    id: 'cneb-pri-ef',
    nombre: 'Educación Física',
    codigo: 'EF-PRI',
    nivel: 'primaria',
    color: '#ea580c',
    color_hex: '#ea580c',
    area_curricular: 'Educación Física',
    horas_semanales_sugeridas: 3,
    descripcion: 'Motricidad, vida saludable e interacción sociomotriz.',
    competencias: [
      {
        codigo: 'C1',
        descripcion: 'Se desenvuelve de manera autónoma a través de su motricidad',
        orden: 1,
      },
      {
        codigo: 'C2',
        descripcion: 'Asume una vida saludable',
        orden: 2,
      },
      {
        codigo: 'C3',
        descripcion: 'Interactúa a través de sus habilidades sociomotrices',
        orden: 3,
      },
    ],
  },
  {
    id: 'cneb-pri-rel',
    nombre: 'Educación Religiosa',
    codigo: 'REL-PRI',
    nivel: 'primaria',
    color: '#ca8a04',
    color_hex: '#ca8a04',
    area_curricular: 'Educación Religiosa',
    horas_semanales_sugeridas: 2,
    descripcion: 'Formación espiritual, moral y trascendente.',
    competencias: [
      {
        codigo: 'C1',
        descripcion: 'Construye su identidad como persona amada por Dios, digna, libre y trascendente',
        orden: 1,
      },
      {
        codigo: 'C2',
        descripcion: 'Asume la experiencia del encuentro personal y comunitario con Dios en su proyecto de vida',
        orden: 2,
      },
    ],
  },

  // ==========================================
  // SECUNDARIA (1° a 5° de Secundaria)
  // ==========================================
  {
    id: 'cneb-sec-mat',
    nombre: 'Matemática',
    codigo: 'MAT-SEC',
    nivel: 'secundaria',
    color: '#4f46e5',
    color_hex: '#4f46e5',
    area_curricular: 'Matemática',
    horas_semanales_sugeridas: 6,
    descripcion: 'Matemática avanzada: álgebra, geometría, trigonometría, estadística y probabilidad.',
    competencias: [
      {
        codigo: 'C1',
        descripcion: 'Resuelve problemas de cantidad',
        orden: 1,
      },
      {
        codigo: 'C2',
        descripcion: 'Resuelve problemas de regularidad, equivalencia y cambio',
        orden: 2,
      },
      {
        codigo: 'C3',
        descripcion: 'Resuelve problemas de forma, movimiento y localización',
        orden: 3,
      },
      {
        codigo: 'C4',
        descripcion: 'Resuelve problemas de gestión de datos e incertidumbre',
        orden: 4,
      },
    ],
  },
  {
    id: 'cneb-sec-com',
    nombre: 'Comunicación',
    codigo: 'COM-SEC',
    nivel: 'secundaria',
    color: '#0891b2',
    color_hex: '#0891b2',
    area_curricular: 'Comunicación',
    horas_semanales_sugeridas: 6,
    descripcion: 'Comprensión crítica de textos literarios y no literarios, debate y redacción académica.',
    competencias: [
      {
        codigo: 'C1',
        descripcion: 'Se comunica oralmente en su lengua materna',
        orden: 1,
      },
      {
        codigo: 'C2',
        descripcion: 'Lee diversos tipos de textos escritos en su lengua materna',
        orden: 2,
      },
      {
        codigo: 'C3',
        descripcion: 'Escribe diversos tipos de textos en su lengua materna',
        orden: 3,
      },
    ],
  },
  {
    id: 'cneb-sec-ing',
    nombre: 'Inglés',
    codigo: 'ING-SEC',
    nivel: 'secundaria',
    color: '#7c3aed',
    color_hex: '#7c3aed',
    area_curricular: 'Inglés',
    horas_semanales_sugeridas: 4,
    descripcion: 'Fluidez comunicativa, comprensión auditiva y expresión escrita en inglés.',
    competencias: [
      {
        codigo: 'C1',
        descripcion: 'Se comunica oralmente en inglés como lengua extranjera',
        orden: 1,
      },
      {
        codigo: 'C2',
        descripcion: 'Lee diversos tipos de textos en inglés como lengua extranjera',
        orden: 2,
      },
      {
        codigo: 'C3',
        descripcion: 'Escribe diversos tipos de textos en inglés como lengua extranjera',
        orden: 3,
      },
    ],
  },
  {
    id: 'cneb-sec-art',
    nombre: 'Arte y Cultura',
    codigo: 'ART-SEC',
    nivel: 'secundaria',
    color: '#db2777',
    color_hex: '#db2777',
    area_curricular: 'Arte y Cultura',
    horas_semanales_sugeridas: 3,
    descripcion: 'Expresión plástica, musical, escénica y análisis cultural.',
    competencias: [
      {
        codigo: 'C1',
        descripcion: 'Aprecia de manera crítica manifestaciones artístico-culturales',
        orden: 1,
      },
      {
        codigo: 'C2',
        descripcion: 'Crea proyectos desde los lenguajes artísticos',
        orden: 2,
      },
    ],
  },
  {
    id: 'cneb-sec-ccss',
    nombre: 'Ciencias Sociales',
    codigo: 'CCSS-SEC',
    nivel: 'secundaria',
    color: '#b45309',
    color_hex: '#b45309',
    area_curricular: 'Ciencias Sociales',
    horas_semanales_sugeridas: 4,
    descripcion: 'Historia del Perú y universal, geografía y gestión económica responsable.',
    competencias: [
      {
        codigo: 'C1',
        descripcion: 'Construye interpretaciones históricas',
        orden: 1,
      },
      {
        codigo: 'C2',
        descripcion: 'Gestiona responsablemente el espacio y el ambiente',
        orden: 2,
      },
      {
        codigo: 'C3',
        descripcion: 'Gestiona responsablemente los recursos económicos',
        orden: 3,
      },
    ],
  },
  {
    id: 'cneb-sec-dpcc',
    nombre: 'Desarrollo Personal, Ciudadanía y Cívica',
    codigo: 'DPCC-SEC',
    nivel: 'secundaria',
    color: '#d97706',
    color_hex: '#d97706',
    area_curricular: 'Desarrollo Personal, Ciudadanía y Cívica',
    horas_semanales_sugeridas: 3,
    descripcion: 'Autoestima, ética, derechos humanos, participación ciudadana y constitución.',
    competencias: [
      {
        codigo: 'C1',
        descripcion: 'Construye su identidad',
        orden: 1,
      },
      {
        codigo: 'C2',
        descripcion: 'Convive y participa democráticamente en la búsqueda del bien común',
        orden: 2,
      },
    ],
  },
  {
    id: 'cneb-sec-ef',
    nombre: 'Educación Física',
    codigo: 'EF-SEC',
    nivel: 'secundaria',
    color: '#ea580c',
    color_hex: '#ea580c',
    area_curricular: 'Educación Física',
    horas_semanales_sugeridas: 3,
    descripcion: 'Acondicionamiento físico, deportes colectivos, nutrición y salud integral.',
    competencias: [
      {
        codigo: 'C1',
        descripcion: 'Se desenvuelve de manera autónoma a través de su motricidad',
        orden: 1,
      },
      {
        codigo: 'C2',
        descripcion: 'Asume una vida saludable',
        orden: 2,
      },
      {
        codigo: 'C3',
        descripcion: 'Interactúa a través de sus habilidades sociomotrices',
        orden: 3,
      },
    ],
  },
  {
    id: 'cneb-sec-rel',
    nombre: 'Educación Religiosa',
    codigo: 'REL-SEC',
    nivel: 'secundaria',
    color: '#ca8a04',
    color_hex: '#ca8a04',
    area_curricular: 'Educación Religiosa',
    horas_semanales_sugeridas: 2,
    descripcion: 'Reflexión trascendente, valores cristianos y doctrina social.',
    competencias: [
      {
        codigo: 'C1',
        descripcion: 'Construye su identidad como persona amada por Dios, digna, libre y trascendente',
        orden: 1,
      },
      {
        codigo: 'C2',
        descripcion: 'Asume la experiencia del encuentro personal y comunitario con Dios en su proyecto de vida',
        orden: 2,
      },
    ],
  },
  {
    id: 'cneb-sec-cyt',
    nombre: 'Ciencia y Tecnología',
    codigo: 'CYT-SEC',
    nivel: 'secundaria',
    color: '#059669',
    color_hex: '#059669',
    area_curricular: 'Ciencia y Tecnología',
    horas_semanales_sugeridas: 5,
    descripcion: 'Física, química, biología y desarrollo de prototipos tecnológicos.',
    competencias: [
      {
        codigo: 'C1',
        descripcion: 'Indaga mediante métodos científicos para construir sus conocimientos',
        orden: 1,
      },
      {
        codigo: 'C2',
        descripcion: 'Explica el mundo físico basándose en conocimientos sobre seres vivos, materia y energía',
        orden: 2,
      },
      {
        codigo: 'C3',
        descripcion: 'Diseña y construye soluciones tecnológicas para resolver problemas de su entorno',
        orden: 3,
      },
    ],
  },
  {
    id: 'cneb-sec-ept',
    nombre: 'Educación para el Trabajo',
    codigo: 'EPT-SEC',
    nivel: 'secundaria',
    color: '#0284c7',
    color_hex: '#0284c7',
    area_curricular: 'Educación para el Trabajo',
    horas_semanales_sugeridas: 3,
    descripcion: 'Emprendimiento, modelos de negocio Canvas, habilidades técnicas y financieras.',
    competencias: [
      {
        codigo: 'C1',
        descripcion: 'Gestiona proyectos de emprendimiento económico o social',
        orden: 1,
      },
    ],
  },
];

/**
 * Convierte las definiciones oficiales de CNEB en estructuras Course y Competency
 * compatibles con el sistema.
 */
export function getOfficialCnebCoursesAndCompetencies(level?: EducationalLevel): {
  courses: Course[];
  competencies: Competency[];
} {
  const definitions = level
    ? OFFICIAL_CNEB_CURRICULUM.filter(c => c.nivel === level)
    : OFFICIAL_CNEB_CURRICULUM;

  const courses: Course[] = [];
  const competencies: Competency[] = [];

  definitions.forEach(def => {
    const courseCompetencies: Competency[] = def.competencias.map((comp, idx) => ({
      id: `comp-${def.codigo.toLowerCase()}-${comp.codigo.toLowerCase()}`,
      curso_id: def.id,
      codigo: comp.codigo,
      descripcion: comp.descripcion,
      orden: comp.orden || idx + 1,
    }));

    competencies.push(...courseCompetencies);

    courses.push({
      id: def.id,
      nombre: def.nombre,
      codigo: def.codigo,
      nivel: def.nivel,
      color: def.color,
      color_hex: def.color_hex,
      area_curricular: def.area_curricular,
      horas_semanales_sugeridas: def.horas_semanales_sugeridas,
      descripcion: def.descripcion,
      activo: true,
      created_at: new Date().toISOString(),
      competencias: courseCompetencies,
    });
  });

  return { courses, competencies };
}
