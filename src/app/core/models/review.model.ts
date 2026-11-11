/** Tipos de las reseñas. */
import { ApiDate } from './api.model';

/** Calificacion valida: de 0.5 a 5, de a 0.5 (admite medias estrellas). */
export type ReviewRating = number;

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
