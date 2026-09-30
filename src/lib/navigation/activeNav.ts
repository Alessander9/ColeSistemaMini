/**
 * Decide qué opción del menú lateral corresponde a la página actual.
 *
 * - Respeta las pestañas por query (?tab=cursos vs ?tab=grados).
 * - Marca la opción padre en subpáginas (/admin/estudiantes/123 → "Directorio Estudiantil").
 * - Permite asociar rutas sin opción propia (p. ej. /admin/secciones/… → "Grados & Secciones").
 * - Devuelve una sola opción: la que mejor coincide.
 */
export interface NavMatchItem {
  href: string;
  /** Prefijos de ruta adicionales que también activan esta opción */
  matches?: string[];
  /** Si la ruta llega sin ?tab=, esta es la pestaña que se muestra por defecto */
  defaultForPath?: boolean;
}

// Raíces de cada portal: solo se activan con coincidencia exacta (si no, marcarían todo)
const ROOTS = new Set(['/admin', '/docente', '/estudiante', '/apoderado', '/asistencia']);

export function findActiveNavHref(items: NavMatchItem[], pathname: string, search: string): string | null {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  let best: { href: string; score: number } | null = null;

  for (const item of items) {
    const [itemPath, itemQuery = ''] = item.href.split('?');
    const itemParams = new URLSearchParams(itemQuery);
    let score = 0;

    if (pathname === itemPath) {
      const keys = Array.from(itemParams.keys());
      if (keys.length === 0) {
        score = 1000;
      } else {
        const allMatch = keys.every(k => params.get(k) === itemParams.get(k));
        const noneGiven = keys.every(k => !params.has(k));
        if (allMatch) score = 1100;                       // misma ruta y misma pestaña
        else if (noneGiven && item.defaultForPath) score = 1050; // pestaña por defecto
        else score = 0;
      }
    } else if (!ROOTS.has(itemPath) && pathname.startsWith(itemPath + '/')) {
      score = 500 + itemPath.length;                      // subpágina de esta opción
    } else if (item.matches?.some(m => pathname === m || pathname.startsWith(m + '/'))) {
      score = 400;                                         // ruta asociada
    }

    if (score > 0 && (!best || score > best.score)) best = { href: item.href, score };
  }
  return best?.href ?? null;
}
