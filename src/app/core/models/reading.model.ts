import { ApiDate } from './api.model';

/** Estados validos de un prestamo. CHECK constraint en `prestamos.estado`. */
export type ReadingStatus = 'activo' | 'devuelto';

export const READING_STATUSES: readonly ReadingStatus[] = ['activo', 'devuelto'];

/**
 * Prestamo/lectura tal y como lo serializa `Reading.to_dict()`.
 *
 * OJO: `usuario` es un string plano con "Nombre Apellido", no un objeto, y
 * puede ser `null` si la fila del usuario desaparecio.
 */
export interface ApiReading {
  id: number;
  usuario_id: number;
  usuario: string | null;
  libro_id: number;
  libro_titulo: string;
  fecha_prestamo: ApiDate;
  /** `null` mientras el prestamo esta `activo`. */
  fecha_devolucion: ApiDate | null;
  fecha_actualizacion: ApiDate;
  estado: ReadingStatus;
  /** Entero de 0 a 100. Llegar a 100 NO devuelve el libro automaticamente. */
  progreso: number;
}

/** Cuerpo de `POST /api/readings/`. */
export interface CreateReadingRequest {
  libro_id: number;
  progreso?: number;
}

/**
 * Cuerpo de `PUT /api/readings/{id}` (actualizacion parcial).
 *
 * NUNCA enviar `usuario_id`: el backend lo rechaza y ademas todas sus consultas
 * van filtradas por el usuario del token.
 */
export interface UpdateReadingRequest {
  progreso?: number;
  estado?: ReadingStatus;
}

/** Filtros admitidos por `GET /api/readings/`. Un valor invalido da 400. */
export interface ReadingFilters {
  estado?: ReadingStatus;
  libro_id?: number;
}
