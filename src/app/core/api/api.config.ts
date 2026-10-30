import { environment } from '@env/environment';

/**
 * Origen del backend Flask. Sin barra final.
 */
export const API_URL = environment.apiUrl.replace(/\/+$/, '');

/** Timeout compartido de las peticiones HTTP. */
export const API_TIMEOUT_MS = environment.apiTimeoutMs;

/**
 * URLs de la API.
 */
export const API_ENDPOINTS = {
  auth: {
    register: `${API_URL}/api/auth/register`,
    login: `${API_URL}/api/auth/login`,
    me: `${API_URL}/api/auth/me`,
  },

  /** Barra final obligatoria. */
  books: `${API_URL}/api/books/`,
  book: (id: number) => `${API_URL}/api/books/${id}`,
  categories: `${API_URL}/api/books/categories`,
  authors: `${API_URL}/api/books/authors`,
  bookProgress: (id: number) => `${API_URL}/api/books/${id}/progress`,
  bookReviews: (id: number) => `${API_URL}/api/books/${id}/reviews`,

  storage: {
    upload: `${API_URL}/api/storage/upload`,
    cover: (filename: string) => `${API_URL}/api/storage/covers/${filename}`,
  },

  collections: `${API_URL}/api/collections/`,
  collection: (id: number) => `${API_URL}/api/collections/${id}`,
  collectionBooks: (id: number) => `${API_URL}/api/collections/${id}/books`,
  collectionBook: (id: number, bookId: number) =>
    `${API_URL}/api/collections/${id}/books/${bookId}`,

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
 */
export const PROTECTED_PATHS: readonly string[] = [
  '/api/auth/me',
  '/api/books',
  '/api/collections',
  '/api/reviews',
  '/api/roulette',
  '/api/storage',
];
