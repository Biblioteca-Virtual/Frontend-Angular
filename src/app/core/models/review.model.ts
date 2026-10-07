import { ApiDate } from './api.model';

/** Calificacion valida. CHECK constraint `calificacion BETWEEN 1 AND 5`. */
export type ReviewRating = 1 | 2 | 3 | 4 | 5;

export const REVIEW_RATINGS: readonly ReviewRating[] = [1, 2, 3, 4, 5];

/**
 * Reseña tal y como lo serializa `Review.to_dict()`.
 *
 * A diferencia de los prestamos, las reseñas NO tienen `fecha_actualizacion`:
 * se actualizan en el sitio. Ademas las lecturas son globales (muestran las
 * reseñas de todos los usuarios), aunque las escrituras son de propietario.
 */
export interface ApiReview {
  id: number;
  libro_id: number;
  libro_titulo: string;
  usuario_id: number;
  /** String plano "Nombre Apellido" o `null`. */
  usuario: string | null;
  calificacion: ReviewRating;
  comentario: string | null;
  fecha_creacion: ApiDate;
}

/** Cuerpo de `POST /api/reviews/`. Un usuario solo puede reseñar un libro. */
export interface CreateReviewRequest {
  libro_id: number;
  calificacion: ReviewRating;
  comentario?: string | null;
}

/** Cuerpo de `PUT /api/reviews/{id}`. */
export interface UpdateReviewRequest {
  calificacion?: ReviewRating;
  /** Enviar `null` explicitamente BORRA el comentario. */
  comentario?: string | null;
}
