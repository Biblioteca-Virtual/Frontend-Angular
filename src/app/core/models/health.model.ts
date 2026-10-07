/** Estado de la base de datos segun `GET /health`. */
export type DatabaseStatus = 'ok' | 'indisponible';

/**
 * Respuesta de `GET /health`.
 *
 * OJO: este endpoint NO usa el sobre `{ data: ... }`, y jamas devuelve 500:
 * si la base de datos esta caida responde 200 con `database: "indisponible"`.
 * El blueprint tampoco esta bajo `/api`, por lo que no lleva cabeceras CORS.
 */
export interface HealthStatus {
  status: 'ok';
  database: DatabaseStatus;
}
