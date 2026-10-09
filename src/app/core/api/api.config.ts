import { environment } from '@env/environment';

/**
 * Origen del backend Flask. Sin barra final.
 *
 * El backend corre en el puerto 5000 por defecto (no lee ninguna variable
 * `PORT`, usa `app.run(debug=True)`).
 */
export const API_URL = environment.apiUrl.replace(/\/+$/, '');

/** Timeout compartido de las peticiones HTTP. */
export const API_TIMEOUT_MS = environment.apiTimeoutMs;

/**
 * URLs de la API.
 *
 * Este objeto es el UNICO lugar donde se construyen URLs contra el backend, a
 * proposito, por dos motivos:
 *
 *  1. La barra final de `/api/books/` es obligatoria. El blueprint `books` se
 *     registro con `strict_slashes=True`, asi que `GET /api/books` NO coincide
 *     con ninguna regla: el backend responde un 308 hacia `/api/books/` con un
 *     cuerpo HTML y SIN cabeceras CORS. Los clientes que siguen la redireccion
 *     de forma transparente (navegador o urllib) acaban viendo la respuesta
 *     correcta, pero a cambio de un viaje extra, y si en algun momento esa
 *     redireccion pasa a ser de otro origen el preflight del 308 puede fallar y
 *     el navegador bloqueara la peticion entera. Los blueprints `readings` y
 *     `reviews` usan `strict_slashes=False` y aceptan ambas formas. Mantener la
 *     barra aqui evita el rodeo sin que nadie tenga que recordarlo.
 *
 *  2. El prefijo real es `/api`. El documento `docs/contratoAPI's.md` del
 *     backend lista las rutas sin el, y esta desactualizado: el `create_app`
 *     registra los blueprints con `url_prefix="/api/..."`.
 */
export const API_ENDPOINTS = {
  auth: {
    register: `${API_URL}/api/auth/register`,
    login: `${API_URL}/api/auth/login`,
    me: `${API_URL}/api/auth/me`,
  },

  /** Barra final obligatoria. Ver nota 1. */
  books: `${API_URL}/api/books/`,
  book: (id: number) => `${API_URL}/api/books/${id}`,

  readings: `${API_URL}/api/readings/`,
  reading: (id: number) => `${API_URL}/api/readings/${id}`,

  reviews: `${API_URL}/api/reviews/`,
  review: (id: number) => `${API_URL}/api/reviews/${id}`,

  roulette: `${API_URL}/api/roulette/spin`,

  /** Fuera de `/api`, sin sobre `{ data }` y sin CORS. */
  health: `${API_URL}/health`,

  openapi: `${API_URL}/openapi.yaml`,
  docs: `${API_URL}/docs`,
} as const;

/**
 * Rutas de la API que exigen `Authorization: Bearer <token>`.
 *
 * Se usa para no adjuntar el token a las peticiones de autenticacion (login y
 * registro), que deben poder ejecutarse precisamente cuando no hay sesion.
 */
export const PROTECTED_PATHS: readonly string[] = [
  '/api/books',
  '/api/readings',
  '/api/reviews',
  '/api/roulette',
];
