export interface SesionAprendizaje {
  id: string;
  seccion_id: string;
  curso_id: string;
  docente_id: string;
  fecha: string;
  titulo_sesion: string;
  competencia_ids: string[];
  campo_tematico: string;
  instrumento_evaluacion?: 'rubrica' | 'lista_cotejo' | 'prueba_escrita' | 'observacion';
  enlaces_recursos?: string[];
  observaciones?: string;
  created_at: string;
}
